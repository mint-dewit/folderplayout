import { RecurrenceParser, DateObj } from 'recurrence-parser'
import { Conductor, DeviceType } from 'timeline-state-resolver'
import { MediaScanner } from './media'
import { MappingAtemType } from 'timeline-state-resolver/dist/types/src'

export class PlayoutManager {
  constructor(API) {
    this.API = API
    this.conductor = new Conductor()
    this.scanner = new MediaScanner(API.settings.mediaScannerURL)
    this.parser = new RecurrenceParser(
      (name) => this.scanner.getMediaDuration(name),
      (name) => this.scanner.getMediaTime(name),
      (name) => this.scanner.getFolderContents(name),
      null,
      () => null
    )

    this.conductor.on('error', (...err) => console.log(...err))
    this.scanner.on('connectionChanged', (status) => this.updateDeviceStatus('mediascanner', status))
    this.updateDeviceStatus('mediascanner', this.scanner.getStatus())

    this.conductor
      .init()
      .then(() => {
        this.updateMappingsAndDevices()
      })
      .then(() => {
        this.createTimeline()
        this.scanner.on('changed', () => this.createTimeline())
      })

    this.timeout = setTimeout(() => this.createTimeline(), 0)
  }

  dispose() {
    this.conductor.destroy()
    this.conductor.removeAllListeners()
    delete this.scanner
    delete this.conductor
  }

  createTimeline() {
    const settings = this.API.settings
    const tls = []
    let time = Date.now() - 6 * 3600 * 1000 // 6 hrs ago
    let stopCondition = Date.now() + 18 * 3600 * 1000 // 18 hrs ahead

    this.parser.schedule = JSON.parse(JSON.stringify(this.API.playoutSchedule))

    let tries = 0
    while (time < stopCondition && tries < 1000 && this.API.playoutSchedule.length > 0) {
      const tl = this.parser.getNextTimeline(new DateObj(time))
      tls.push(tl)
      time = tl.end + 1000
      tries++
    }

    const timeline = []
    const readableTimeline = []
    for (const tl of tls) {
      const bg = []
      for (let i = 0; i < tl.timeline.length; i++) {
        // make bg objects
        if (tl.timeline[i].content.deviceType === 2) continue // no bg objects for atem
        const obj = JSON.parse(JSON.stringify(tl.timeline[i]))
        delete obj.classes
        obj.id += '_bg'
        obj.lookaheadForLayer = obj.layer
        obj.layer += '_BG'
        obj.isLookahead = true
        if (i === 0) {
          obj.enable = {
            start: `#${tl.timeline[0].id}.start - 2000`,
            duration: 2000,
          }
        } else {
          obj.enable = {
            while: `#${tl.timeline[i - 1].id}`,
          }
        }
        bg.push(obj)
      }

      timeline.push(...tl.timeline)
      timeline.push(...bg)
      readableTimeline.push(...tl.readableTimeline)
    }
    // console.log(timeline)
    readableTimeline.sort((a, b) => a.start - b.start)

    this.API.setReadableTimeline(readableTimeline)

    timeline.push(
      {
        // decklink bg = always on
        id: 'decklink_bg',
        layer: 'bg',
        enable: {
          while: 1,
        },
        content: {
          deviceType: 1,
          type: 'input',

          device: Number(this.API.settings.decklinkInput),
          mixer: {
            volume: 1,
            inTransition: {
              duration: 250,
            },
          },
        },
        keyframes: [
          // mute during unmuted playout
          {
            id: 'decklink_bg_kf0',
            enable: {
              while: '.PLAYOUT & !.MUTED',
            },
            content: {
              mixer: {
                volume: 0,
                inTransition: {
                  duration: 250,
                },
              },
            },
          },
        ],
      },
      {
        // default audio = always on. this obj prevents a bug in ccg-state where it forgets something is muted.
        id: 'ccg_playout_audio',
        layer: 'PLAYOUT',
        enable: {
          while: 1,
        },
        priority: -1, // as low as it gets
        content: {
          deviceType: 1,
          type: 'media',

          file: 'EMPTY',
          mixer: {
            volume: 1,
            inTransition: {
              duration: 0,
            },
          },
        },
      },
      {
        // atem input for infochannel = always enabled
        id: 'atem_input_infochannel',
        layer: 'ATEM',
        enable: {
          while: 1,
        },
        priority: 1,
        content: {
          deviceType: 2,
          type: 'me',

          me: {
            programInput: Number(settings.infochannelAtemInput),
          },
        },
      },
      {
        // atem input for playout = enabled while playout
        id: 'atem_input_playout',
        layer: 'ATEM',
        enable: {
          while: '!(.LIVE + 160) & .PLAYOUT + 160', // block during live inputs + 160 preroll decklink compensation
        },
        priority: 2,
        content: {
          deviceType: 2,
          type: 'me',

          me: {
            programInput: settings.playoutAtemInput,
          },
        },
      },
      {
        // atem audio from infochannel = outside of playout
        id: 'atem_audio_bg',
        layer: 'ATEM_AUDIO_BG',
        enable: {
          while: '!.PLAYOUT', // they need separate expression for some reason
        },
        content: {
          deviceType: 2,
          type: 'audioChan',

          audioChannel: {
            mixOption: 1, // enabled
          },
        },
      },
      {
        // atem audio from infochannel = when muted
        id: 'atem_audio_muted',
        layer: 'ATEM_AUDIO_BG',
        enable: {
          while: '.MUTED', // they need separate expression for some reason
        },
        content: {
          deviceType: 2,
          type: 'audioChan',

          audioChannel: {
            mixOption: 1, // enabled
          },
        },
      },
      {
        // atem audio from playout = when unmuted playout
        id: 'atem_audio_playout',
        layer: 'ATEM_AUDIO_PGM',
        enable: {
          while: '.PLAYOUT & !.MUTED & !.LIVE_AUDIO',
        },
        content: {
          deviceType: 2,
          type: 'audioChan',

          audioChannel: {
            mixOption: 1, // enabled
          },
        },
      }
    )

    this.conductor.timeline = timeline
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => this.createTimeline(), 12 * 3600 * 1000) // re-parse in 12 hours
  }

  async addCasparCG(settings) {
    this.updateDeviceStatus('ccg', { statusCode: 4, messages: ['CasparCG Disconnected'] }) // hack to make it get a status before first connection

    const device = await this.conductor.addDevice('ccg', {
      type: DeviceType.CASPARCG,
      options: {
        host: settings.casparcgHost || '127.0.0.1',
        port: settings.casparcgPort || 5250,
        useScheduling: false,
      },
    })

    this.updateDeviceStatus('ccg', await device.device.getStatus())
    await device.device.on('connectionChanged', (deviceStatus) => this.updateDeviceStatus('ccg', deviceStatus))
  }

  async addAtem(settings) {
    this.updateDeviceStatus('atem', { statusCode: 4, messages: ['Atem Disconnected'] }) // hack to make it get a status before first connection

    const device = await this.conductor.addDevice('atem', {
      type: DeviceType.ATEM,
      options: {
        host: settings.atemIp,
      },
    })
    this.updateDeviceStatus('atem', await device.device.getStatus())
    await device.device.on('connectionChanged', (deviceStatus) => this.updateDeviceStatus('atem', deviceStatus))
  }

  async updateMappingsAndDevices() {
    const settings = this.API.settings

    if (!this.conductor.getDevice('ccg')) {
      this.addCasparCG(settings)
    }

    if (!this.conductor.mapping['PLAYOUT']) {
      this.conductor.mapping['PLAYOUT'] = {
        device: DeviceType.CASPARCG,
        deviceId: 'ccg',
        channel: 1,
        layer: 20,
      }
    }

    if (settings.inputType === 0) {
      // decklink input
      if (this.conductor.mapping['ATEM']) {
        delete this.conductor.mapping['ATEM']
      }
      if (this.conductor.mapping['ATEM_AUDIO']) {
        delete this.conductor.mapping['ATEM_AUDIO']
      }
      if (this.conductor.getDevice('atem')) {
        this.conductor.removeDevice('atem')
        this.API.removeDeviceState('atem')
      }
      if (!this.conductor.mapping['bg']) {
        this.conductor.mapping['bg'] = {
          device: DeviceType.CASPARCG,
          deviceId: 'ccg',
          channel: 1,
          layer: 10,
        }
      }
      this.parser.liveMode = 'casparcg'
    } else if (settings.inputType === 1) {
      // atem input
      if (this.conductor.mapping['bg']) {
        delete this.conductor.mapping['bg']
      }
      if (!this.conductor.getDevice('atem')) {
        this.addAtem(settings)
      }
      if (!this.conductor.mapping['ATEM']) {
        this.conductor.mapping['ATEM'] = {
          device: DeviceType.ATEM,
          deviceId: 'atem',
          mappingType: MappingAtemType.MixEffect,
          index: 0,
        }
      }
      if (!this.conductor.mapping['ATEM_AUDIO_BG']) {
        this.conductor.mapping['ATEM_AUDIO_BG'] = {
          device: DeviceType.ATEM,
          deviceId: 'atem',
          mappingType: MappingAtemType.AudioChannel,
          index: settings.infochannelAtemInput,
        }
      }
      for (let i = 1; i <= settings.playoutAtemChannels; i++) {
        if (!this.conductor.mapping['ATEM_AUDIO_' + i]) {
          this.conductor.mapping['ATEM_AUDIO_' + i] = {
            device: DeviceType.ATEM,
            deviceId: 'atem',
            mappingType: MappingAtemType.AudioChannel,
            index: i,
          }
        }
      }
      if (!this.conductor.mapping['ATEM_AUDIO_PGM']) {
        this.conductor.mapping['ATEM_AUDIO_PGM'] = {
          device: DeviceType.ATEM,
          deviceId: 'atem',
          mappingType: MappingAtemType.AudioChannel,
          index: settings.playoutAtemInput,
        }
      }
      this.parser.liveMode = 'atem'
    }
  }

  updateDeviceStatus(deviceName, deviceStatus) {
    this.API.setDeviceState(deviceName, deviceStatus)
  }
}
