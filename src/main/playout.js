import { RecurrenceParser, DateObj } from 'recurrence-parser'
import { Conductor, DeviceType } from 'timeline-state-resolver'
import Store from '../renderer/store/index'
import { MediaScanner } from './media'
import { MappingAtemType } from 'timeline-state-resolver/dist/types/src'

const conductor = new Conductor()
const scanner = new MediaScanner(Store.state.settings.mediaScannerURL)
const parser = new RecurrenceParser(name => scanner.getMediaDuration(name), name => scanner.getFolderContents(name), null, () => null)

conductor.on('error', (...err) => console.log(...err))

conductor.init()
  .then(() => {
    updateMappingsAndDevices()
  })
  .then(() => {
    conductor.addDevice('ccg', { type: DeviceType.CASPARCG, options: { host: Store.state.settings.casparcgHost || '127.0.0.1', port: Store.state.settings.casparcgPort || 5250, useScheduling: false } })
    createTimeline()
    scanner.on('changed', () => createTimeline())
    Store.watch(state => state.playoutSchedule, () => createTimeline())
    Store.watch(state => state.settings, () => {
      updateMappingsAndDevices()
      createTimeline()
    })
  })

let timeout = setTimeout(() => createTimeline(), 0)
// let curReadableTimeline = []

function createTimeline () {
  const settings = Store.state.settings
  const tls = []
  let time = Date.now() - 6 * 3600 * 1000 // 6 hrs ago
  let stopCondition = Date.now() + 18 * 3600 * 1000 // 18 hrs ahead

  parser.schedule = JSON.parse(JSON.stringify(Store.state.playoutSchedule))

  let tries = 0
  while (time < stopCondition && tries < 1000 && Store.state.playoutSchedule.length > 0) {
    const tl = parser.getNextTimeline(new DateObj(time))
    tls.push(tl)
    time = tl.end + 1000
    tries++
  }

  const timeline = []
  const readableTimeline = []
  for (const tl of tls) {
    const bg = []
    for (let i = 0; i < tl.timeline.length; i++) { // make bg objects
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
          duration: 2000
        }
      } else {
        obj.enable = {
          while: `#${tl.timeline[i - 1].id}`
        }
      }
      bg.push(obj)
    }

    timeline.push(...tl.timeline)
    timeline.push(...bg)
    readableTimeline.push(...tl.readableTimeline)
  }
  console.log(timeline)
  readableTimeline.sort((a, b) => a.start - b.start)
  // curReadableTimeline = readableTimeline
  Store.dispatch('setReadableTimeline', readableTimeline)

  timeline.push({ // decklink bg = always on
    id: 'decklink_bg',
    layer: 'bg',
    enable: {
      while: 1
    },
    content: {
      deviceType: 1,
      type: 'input',

      device: Number(Store.state.settings.decklinkInput),
      mixer: {
        volume: 1,
        inTransition: {
          duration: 250
        }
      }
    },
    keyframes: [ // mute during unmuted playout
      {
        id: 'decklink_bg_kf0',
        enable: {
          while: '.PLAYOUT & !.MUTED'
        },
        content: {
          mixer: {
            volume: 0,
            inTransition: {
              duration: 250
            }
          }
        }
      }
    ]
  },
  { // atem input for infochannel = always enabled
    id: 'atem_input_infochannel',
    layer: 'ATEM',
    enable: {
      while: 1
    },
    priority: 1,
    content: {
      deviceType: 2,
      type: 'me',

      me: {
        programInput: Number(settings.infochannelAtemInput)
      }
    }
  },
  { // atem input for playout = enabled while playout
    id: 'atem_input_playout',
    layer: 'ATEM',
    enable: {
      while: '.PLAYOUT + 160' // 160 preroll on atem
    },
    priority: 2,
    content: {
      deviceType: 2,
      type: 'me',

      me: {
        programInput: settings.playoutAtemInput
      }
    }
  },
  { // atem audio from infochannel = outside of playout
    id: 'atem_audio_bg',
    layer: 'ATEM_AUDIO_BG',
    enable: {
      while: '!.PLAYOUT' // they need separate expression for some reason
    },
    content: {
      deviceType: 2,
      type: 'audioChan',

      audioChannel: {
        mixOption: 1 // enabled
      }
    }
  },
  { // atem audio from infochannel = when muted
    id: 'atem_audio_muted',
    layer: 'ATEM_AUDIO_BG',
    enable: {
      while: '.MUTED' // they need separate expression for some reason
    },
    content: {
      deviceType: 2,
      type: 'audioChan',

      audioChannel: {
        mixOption: 1 // enabled
      }
    }
  },
  { // atem audio from playout = when unmuted playout
    id: 'atem_audio_playout',
    layer: 'ATEM_AUDIO_PGM',
    enable: {
      while: '.PLAYOUT & !.MUTED & !.LIVE_AUDIO'
    },
    content: {
      deviceType: 2,
      type: 'audioChan',

      audioChannel: {
        mixOption: 1 // enabled
      }
    }
  })

  conductor.timeline = timeline
  clearTimeout(timeout)
  timeout = setTimeout(() => createTimeline(), 12 * 3600 * 1000) // re-parse in 12 hours
  // updateState()
}

function updateMappingsAndDevices () {
  const settings = Store.state.settings

  if (!conductor.mapping['PLAYOUT']) {
    conductor.mapping['PLAYOUT'] = {
      device: DeviceType.CASPARCG,
      deviceId: 'ccg',
      channel: 1,
      layer: 20
    }
  }

  if (settings.inputType === 0) { // decklink input
    if (conductor.mapping['ATEM']) {
      delete conductor.mapping['ATEM']
    }
    if (conductor.mapping['ATEM_AUDIO']) {
      delete conductor.mapping['ATEM_AUDIO']
    }
    if (conductor.getDevice('atem')) {
      conductor.removeDevice('atem')
    }
    if (!conductor.mapping['bg']) {
      conductor.mapping['bg'] = {
        device: DeviceType.CASPARCG,
        deviceId: 'ccg',
        channel: 1,
        layer: 10
      }
    }
    parser.liveMode = 'casparcg'
  } else if (settings.inputType === 1) { // atem input
    if (conductor.mapping['bg']) {
      delete conductor.mapping['bg']
    }
    if (!conductor.getDevice('atem')) {
      conductor.addDevice('atem', {
        type: DeviceType.ATEM,
        options: {
          host: settings.atemIp
        }
      })
    }
    if (!conductor.mapping['ATEM']) {
      conductor.mapping['ATEM'] = {
        device: DeviceType.ATEM,
        deviceId: 'atem',
        mappingType: MappingAtemType.MixEffect,
        index: 0
      }
    }
    if (!conductor.mapping['ATEM_AUDIO_BG']) {
      conductor.mapping['ATEM_AUDIO_BG'] = {
        device: DeviceType.ATEM,
        deviceId: 'atem',
        mappingType: MappingAtemType.AudioChannel,
        index: settings.infochannelAtemInput
      }
    }
    for (let i = 1; i <= settings.playoutAtemChannels; i++) {
      if (!conductor.mapping['ATEM_AUDIO_' + i]) {
        conductor.mapping['ATEM_AUDIO_' + i] = {
          device: DeviceType.ATEM,
          deviceId: 'atem',
          mappingType: MappingAtemType.AudioChannel,
          index: i
        }
      }
    }
    if (!conductor.mapping['ATEM_AUDIO_PGM']) {
      conductor.mapping['ATEM_AUDIO_PGM'] = {
        device: DeviceType.ATEM,
        deviceId: 'atem',
        mappingType: MappingAtemType.AudioChannel,
        index: settings.playoutAtemInput
      }
    }
    parser.liveMode = 'atem'
  }
}

// let timeoutNextup

// function updateState () {
//   const update = {}

//   if (timeoutNextup) clearTimeout(timeoutNextup)

//   if (!conductor.timeline || conductor.timeline.length === 0) {
//     setTimeout(() => updateState(), 1000)
//     return
//   }

//   const previous = curReadableTimeline.reverse().find(o => {
//     return (o.start + o.end) < Date.now()
//   })
//   curReadableTimeline.reverse() // reverse back
//   const curPlaying = curReadableTimeline.find((o) => {
//     return o.start < Date.now() && (o.start + o.duration) > Date.now()
//   })
//   const next = curReadableTimeline.find(o => {
//     return o.start > Date.now()
//   })

//   // if (curPlaying) console.log(`CurPlaying: ${curPlaying.label} - ${new Date(curPlaying.start)}`)
//   // if (next) console.log(`Next: ${next.label} - ${new Date(next.start)}`)

//   const firstPlayout = next ? next.start : 0
//   const previousPlayout = previous ? previous.start : 0

//   if (!curPlaying && Store.state.playoutState.nowPlaying !== 'Nothing') {
//     update.nowPlaying = 'Nothing'
//   } else if (curPlaying && curPlaying.label !== Store.state.playoutState.nowPlaying) {
//     update.nowPlaying = curPlaying.label
//   }

//   if (firstPlayout && firstPlayout !== Store.state.playoutState.nextUpTime) {
//     update.nextUpTime = firstPlayout
//   }
//   if (previousPlayout && previousPlayout !== Store.state.playoutState.startTime) {
//     update.startTime = previousPlayout
//   }
//   if (next && next.label !== Store.state.playoutState.nextUp) {
//     update.nextUp = next.label
//   }

//   timeoutNextup = setTimeout(() => updateState(), Math.max((firstPlayout - Date.now()) / 2, 200))

//   if (Object.keys(update).length > 0) Store.dispatch('updatePlayoutState', update)
// }

// updateState()
