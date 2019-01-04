import { RecurrenceParser, DateObj } from 'recurrence-parser'
import { Conductor, DeviceType, TriggerType } from 'timeline-state-resolver'
import Store from '../renderer/store/index'
import { MediaScanner } from './media'
import { Resolver } from 'superfly-timeline'

const conductor = new Conductor()
const scanner = new MediaScanner()
const parser = new RecurrenceParser(name => scanner.getMediaDuration(name), name => scanner.getFolderContents(name), null, () => null)

conductor.on('error', (...err) => console.log(...err))
// conductor.on('debug', (...info) => console.log(...info))

conductor.init()
  .then(() => {
    conductor.mapping = {
      'bg': {
        device: DeviceType.CASPARCG,
        deviceId: 'ccg',
        channel: 1,
        layer: 10
      },
      'PLAYOUT': {
        device: DeviceType.CASPARCG,
        deviceId: 'ccg',
        channel: 1,
        layer: 20
      }
    }
  })
  .then(() => {
    return conductor.addDevice('ccg', { type: DeviceType.CASPARCG, options: { host: '127.0.0.1', port: 5250, useScheduling: false } })
  })
  .then(() => {
    createTimeline()
    scanner.on('changed', () => createTimeline())
    Store.watch(state => state.playoutSchedule, () => createTimeline())
    Store.watch(state => state.settings.decklinkInput, () => createTimeline())
  })

let timeout = setTimeout(() => createTimeline(), 0)

function createTimeline () {
  if (Store.state.playoutSchedule.length === 0) {
    clearTimeout(timeout)
    timeout = setTimeout(() => createTimeline(), 12 * 3600 * 1000) // re-parse in 12 hours
    return
  }
  const tls = []
  let time = Date.now() - 6 * 3600 * 1000 // 6 hrs ago
  let stopCondition = Date.now() + 18 * 3600 * 1000 // 18 hrs ahead

  parser.schedule = JSON.parse(JSON.stringify(Store.state.playoutSchedule))

  while (time < stopCondition) {
    const tl = parser.getNextTimeline(new DateObj(time))
    tls.push(tl)
    time = tl.end + 1000
  }

  const decklink = (volume, start, end) => {
    const tlObj = {
      id: `bg_decklink_${volume ? 'unmute' : 'mute'}_${start}`,
      LLayer: 'bg',
      trigger: {
        type: TriggerType.TIME_ABSOLUTE,
        value: start
      },
      duration: end ? end - start : 0,
      content: {
        type: 'input',
        attributes: {
          device: Number(Store.state.settings.decklinkInput)
        },
        mixer: {
          volume: volume ? 1 : 0,
          inTransition: {
            duration: 250
          }
        }
      }
    }

    return tlObj
  }

  const timeline = []
  let last = Date.now()
  for (const tl of tls) {
    timeline.push(decklink(true, last, tl.start))
    timeline.push(decklink(false, tl.start, tl.end))

    const bg = []
    for (let i = 0; i < tl.timeline.length; i++) { // make bg objects
      const obj = JSON.parse(JSON.stringify(tl.timeline[i]))
      obj.id += '_bg'
      obj.originalLLayer = obj.LLayer
      obj.LLayer += '_BG'
      obj.isBackground = true
      if (i === 0) {
        obj.trigger = {
          type: TriggerType.TIME_RELATIVE,
          value: `#${tl.timeline[0].id}.start - 2000`
        }
        obj.duration = 2000
      } else {
        obj.trigger = {
          type: TriggerType.LOGICAL,
          value: `#${tl.timeline[i - 1].id}`
        }
        obj.duration = 0
      }
      bg.push(obj)
    }

    timeline.push(...tl.timeline)
    timeline.push(...bg)

    for (const obj of tl.timeline) {
      if (obj.content.muted && obj.duration > 500) {
        const dl = {
          id: 'bg_decklink_' + obj.id,
          LLayer: 'bg',
          trigger: {
            type: TriggerType.TIME_RELATIVE,
            value: `#${obj.id}.start`
          },
          duration: obj.duration,
          priority: 1,
          content: {
            type: 'input',
            attributes: {
              device: Number(Store.state.settings.decklinkInput)
            },
            mixer: {
              volume: 1,
              inTransition: {
                duration: 250
              }
            }
          }
        }
        timeline.push(dl)
      }
    }
    last = tl.end
  }
  timeline.push(decklink(true, last))

  conductor.timeline = timeline
  clearTimeout(timeout)
  timeout = setTimeout(() => createTimeline(), 12 * 3600 * 1000) // re-parse in 12 hours
}

setInterval(() => {
  const update = {}

  if (!conductor.timeline || conductor.timeline.length === 0) return

  const tl = Resolver.getState(conductor.timeline, Date.now())

  const curLayer = tl.LLayers['PLAYOUT'] || tl.LLayers['bg']

  if (curLayer.LLayer === 'bg' && Store.state.playoutState.nowPlaying !== 'Nothing') {
    update.nowPlaying = 'Nothing'
  } else if (curLayer.LLayer === 'PLAYOUT' && curLayer.content.attributes.file !== Store.state.playoutState.nowPlaying) {
    update.nowPlaying = curLayer.content.attributes.file
  }
  if (curLayer.resolved.endTime !== Store.state.playoutState.nextUpTime) {
    update.nextUpTime = curLayer.resolved.endTime
  }
  if (curLayer.resolved.startTime !== Store.state.playoutState.startTime) {
    update.startTime = curLayer.resolved.startTime
  }

  const nextTl = Resolver.getState(conductor.timeline, curLayer.resolved.endTime)
  if (nextTl.LLayers['PLAYOUT']) {
    if (nextTl.LLayers['PLAYOUT'].content.attributes.file !== Store.state.playoutState.nextUp) {
      update.nextUp = nextTl.LLayers['PLAYOUT'].content.attributes.file
    }
  } else {
    if (Store.state.playoutState.nextUp !== 'Nothing') {
      update.nextUp = 'Nothing'
    }
  }

  if (Object.keys(update).length > 0) Store.dispatch('updatePlayoutState', update)
}, 200)
