import { RecurrenceParser, DateObj } from 'recurrence-parser'
import { Conductor, DeviceType, TriggerType } from 'timeline-state-resolver'
import Store from '../renderer/store/index'
import { MediaScanner } from './media'

const conductor = new Conductor()
const scanner = new MediaScanner()
const parser = new RecurrenceParser(name => scanner.getMediaDuration(name), name => scanner.getFolderContents(name))

conductor.on('error', (...err) => console.log(...err))
conductor.on('debug', (...info) => console.log(...info))

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
    return conductor.addDevice('ccg', { type: DeviceType.CASPARCG, options: { host: '127.0.0.1', port: 5250 } })
  })
  .then(() => {
    createTimeline()
    scanner.on('changed', () => createTimeline())
    Store.watch(state => state.playoutSchedule, () => createTimeline())
    Store.dispatch('updatePlayoutStatus', { nowPlaying: 'Hello, world!' })
  })

function createTimeline () {
  const tls = []
  let time = Date.now() - 6 * 3600 * 1000 // 6 hrs ago
  let stopCondition = Date.now() + 18 * 3600 * 1000 // 18 hrs ahead

  parser.schedule = JSON.parse(JSON.stringify(Store.state.playoutSchedule))

  while (time < stopCondition) {
    const tl = parser.getNextTimeline(new DateObj(time))
    tls.push(tl)
    console.log(new Date(tl.start), new Date(tl.end))
    time = tl.end + 1
  }

  const decklink = {
    id: 'bg_decklink',
    LLayer: 'bg',
    trigger: {
      type: TriggerType.TIME_ABSOLUTE,
      value: Date.now()
    },
    duration: 0,
    content: {
      type: 'input',
      attributes: {
        device: 1
      },
      keyframes: []
    }
  }

  for (const timeline of tls) {
    decklink.content.keyframes.push({
      id: 'bg_decklink_mute_' + timeline.start,
      trigger: {
        type: TriggerType.TIME_ABSOLUTE,
        value: timeline.start - 2000
      },
      duration: (timeline.end - timeline.start + 2000),
      content: {
        mixer: {
          volume: 0,
          inTransition: {
            duration: 2000
          },
          outTransition: {
            duration: 2000
          }
        }
      }
    }, {
      id: 'bg_decklink_unmute_' + timeline.end,
      trigger: {
        type: TriggerType.TIME_ABSOLUTE,
        value: timeline.end
      },
      duration: (2000),
      content: {
        mixer: {
          volume: 1,
          inTransition: {
            duration: 2000
          }
        }
      }
    })
  }
  console.log(decklink)

  const timeline = []
  for (const tl of tls) {
    timeline.push(...tl.timeline)
  }
  timeline.push(decklink)

  conductor.timeline = timeline
}
