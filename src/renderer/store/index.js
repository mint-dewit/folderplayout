import Vue from 'vue'
import Vuex from 'vuex'
import uid from 'uid'

import storeState from './storeState'
import fs from 'fs'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    schedule: [],
    playoutSchedule: [], // a buffer between the schedule editing and actual playout
    playoutState: {
      nextUpTime: 0,
      startTime: 0,
      nowPlaying: 'Nothing',
      nextUp: ''
    },
    settings: {
      inputType: 0,
      decklinkInput: 1,
      atemIp: '',
      infochannelAtemInput: 0,
      playoutAtemInput: 0,
      mediaScannerURL: 'http://127.0.0.1:8000/',
      casparcgHost: '127.0.0.1',
      casparcgPort: 5250
    }
  },
  getters: {
    /**
     * Finds a specific entry in the schedule by it's id.
     */
    scheduleEntryById: (state) => (_id) => {
      // recursively find the right item:
      let findEntry = (parent) => {
        for (let item of parent) {
          if (item._id === _id) {
            return item
          } else if (item.children) {
            let found = findEntry(item.children)
            if (found) return found
          }
        }
      }

      return findEntry(state.schedule)
    },

    /**
     * finds the children of an entry, or if entry is not a group,
     * this finds it's brothers and sisters.
     */
    entryChildren: (state) => (_id) => {
      let findChildren = (parent) => {
        for (let child of parent) {
          if (child.type === 'group') {
            for (let childsChild of child.children) {
              if (childsChild._id === _id && childsChild.type !== 'group') {
                return child
              } else if (childsChild._id) {
                return childsChild
              }
            }
            let res = findChildren(child.children)
            if (res) return res
          }
        }
      }

      return findChildren(state.schedule)
    },

    /**
     * searches schedule for entry with _id, returns the entry if it
     * is a group, or else, returns its parent
     */
    findGroupOrParent: (state) => (_id) => {
      let findById = (parent) => {
        if (parent.children) {
          for (let child of parent.children) {
            if (child._id === _id && child.type === 'group') { // child we are editing, and child is a group
              return child
            } else if (child._id === _id) { // child we are editing, but child is not a group
              return parent
            } else if (child.type === 'group') { // not the  child we are editing, but child is a group, therefore might contain what we are editing
              let res = findById(child) || null

              if (res) return res
            }
          }
        }
      }

      return findById({ children: state.schedule, _id: 'MAIN_ENTRY', name: 'Schedule' })
    }
  },
  mutations: {
    /**
     * adds a new video file to the schedule
     * @param {Object} state
     * @param {Object} payload _id determines the parent of the new entry
     */
    newEntry (state, payload) {
      const newEntry = {
        _id: payload.newId,
        type: payload.type
      }

      if (payload.type === 'group') { newEntry.children = [] } else { newEntry.path = '' }

      let findParent = (parent) => {
        for (let item of parent) {
          if (item._id === payload._id) {
            return item
          } else if (item.children) {
            let res = findParent(item.children)
            if (res) return res
          }
        }
      }
      let parent = payload._id ? findParent(state.schedule) : null

      if (parent) {
        parent.children.push(newEntry)
      } else {
        state.schedule.push(newEntry)
      }
    },

    /**
     * remove an entry from the schedule
     * @param {Object} state
     * @param {Object} payload
     */
    deleteEntry (state, payload) {
      let deleteId = (parent) => {
        for (let i in parent) {
          if (parent[i]._id === payload._id) {
            parent.splice(i, 1)
          } else if (parent[i].children) {
            deleteId(parent[i].children)
          }
        }
      }

      deleteId(state.schedule)
    },

    toggleDay (_, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      if (!entry) throw new Error('Could not find entry with id ' + payload._id)
      if (entry.days && entry.days.indexOf(payload.day) > -1) {
        entry.days.splice(entry.days.indexOf(payload.day), 1)
      } else {
        if (!entry.days) entry.days = []
        entry.days.push(payload.day)
      }
    },

    setMuted (_state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      if (payload.muted !== true) {
        delete entry.audio
      } else {
        entry.audio = false
      }
    },

    /**
     * Adds a time entry to a specific entry, where the
     * entry is defined by payload._id
     * @param {Object} state
     * @param {Object} payload
     */
    addTime (_state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      if (entry.times) {
        entry.times.push(payload.time)
      } else {
        Vue.set(entry, 'times', [payload.time])
      }
    },

    /**
     * Updates a time entry in a specific entry, where the
     * entry is defined by the payload._id, the time entry
     * is defined by payload.index and the new time is defined
     * by payload.time
     * @param {Object} state
     * @param {Object} payload
     */
    updateTime (_state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      entry.times[payload.index] = payload.time
    },

    /**
     * Deletes a time entry in a specific entry, where the
     * entry is defined by the payload._id, and the time entry
     * is defined by entry.index
     * @param {Object} state The store state
     * @param {Object} payload An object with parameters
     */
    deleteTime (_state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      entry.times.splice(payload.index, 1)
      if (entry.times.length === 0) { Vue.set(entry, 'times', null) }
    },

    addDateEntry (_state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      if (entry.dates) {
        entry.dates.push(payload.dateEntry)
      } else {
        Vue.set(entry, 'dates', [ payload.dateEntry ])
      }
    },

    updateDateEntry (_state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      entry.dates[payload.dateEntry][payload.type] = payload.date
    },

    deleteDateEntry (_state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      entry.dates.splice(payload.index, 1)
      if (entry.dates.length === 0) { Vue.set(entry, 'dates', null) }
    },

    reorder (_, payload) {
      var list = this.getters.findGroupOrParent(payload.id)
      list = list.children

      const movedItem = list.splice(payload.oldIndex, 1)[0]
      list.splice(payload.newIndex, 0, movedItem)
    },

    updateWeeks (state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      entry.weeks = payload.value
      // if (!entry.weeks || typeof entry.weeks !== 'object') entry.weeks = []

      // const old = [ ...entry.weeks ]
      // for (let week of payload.value) {
      //   let i = old.indexOf(week)
      //   if (i < 0) { // new week added
      //     console.log('NEW', week)
      //     entry.weeks.push(week)
      //   } else { // already exists
      //     console.log('EXISTING', week)
      //     old.splice(i, 1)
      //   }
      // }
      // for (let week of old) { // deleted weeks
      //   console.log('DELETED', week)
      //   entry.weeks.splice(entry.weeks.indexOf(week), 1)
      // }
    },

    updatePath (_state, payload) {
      const entry = this.getters.scheduleEntryById(payload._id)
      if (entry.type === 'group') {
        entry.name = payload.value
      } else {
        entry.path = payload.value
      }
      // let findEntry = (parent) => {
      //   for (let child in parent) {
      //     if (parent[child]._id === payload._id) {
      //       if (parent[child].type === 'group') {
      //         parent[child].name = payload.value
      //       } else {
      //         parent[child].path = payload.value
      //       }

      //       break
      //     }

      //     if (parent[child].type === 'group') { findEntry(parent[child].children) }
      //   }
      // }

      // findEntry(state.schedule)
    },

    updatePlayoutSchedule (state) {
      state.playoutSchedule = JSON.parse(JSON.stringify(state.schedule))
    },

    resetSchedule (state) {
      state.schedule = JSON.parse(JSON.stringify(state.playoutSchedule))
    },

    updatePlayoutState (state, payload) {
      state.playoutState = { ...state.playoutState, ...payload }
    },

    resetScheduleTo (state, schedule) {
      state.schedule = schedule
    },

    settingsUpdateDecklink (state, input) {
      state.settings.decklinkInput = input
    },

    settingsSet (state, settings) {
      state.settings = settings
    }
  },
  actions: {
    newEntry (context, payload) {
      context.commit('newEntry', { ...payload, newId: uid() })
    },

    deleteEntry (context, payload) {
      context.commit('deleteEntry', payload)
    },

    toggleDay (context, payload) {
      context.commit('toggleDay', payload)
    },

    setMuted (context, payload) {
      context.commit('setMuted', payload)
    },

    addTime (context, payload) {
      context.commit('addTime', payload)
    },

    updateTime (context, payload) {
      context.commit('updateTime', payload)
    },

    deleteTime (context, payload) {
      context.commit('deleteTime', payload)
    },

    addDateEntry (context, payload) {
      context.commit('addDateEntry', payload)
    },

    updateDateEntry (context, payload) {
      context.commit('updateDateEntry', payload)
    },

    deleteDateEntry (context, payload) {
      context.commit('deleteDateEntry', payload)
    },

    reorder (context, payload) {
      context.commit('reorder', payload)
    },

    setWeeks (context, payload) {
      context.commit('updateWeeks', payload)
    },

    setPath (context, payload) {
      context.commit('updatePath', payload)
    },

    setPlayoutSchedule (context) {
      context.commit('updatePlayoutSchedule')
    },

    resetSchedule (context) {
      context.commit('resetSchedule')
    },

    updatePlayoutState (context, payload) {
      context.commit('updatePlayoutState', payload)
    },

    exportSchedule (context, filename) {
      const schedule = JSON.stringify(context.state.schedule, null, 2)
      fs.writeFile(filename, schedule)
    },

    importSchedule (context, filename) {
      try {
        const rawData = fs.readFileSync(filename)
        const schedule = JSON.parse(rawData)

        const makeWeekDaysNumbers = el => {
          if (el.days) {
            for (let i = 0; i < el.days.length; i++) {
              el.days.splice(i, 1, Number(el.days[i]))
            }
          }
          if (el.children) {
            for (const child of el.children) makeWeekDaysNumbers(child)
          }
        }
        for (const el of schedule) makeWeekDaysNumbers(el)

        context.commit('resetScheduleTo', schedule)
      } catch (e) {
        console.error(e)
      }
    },

    // deprecated:
    settingsSetDecklink (context, input) {
      context.commit('settingsUpdateDecklink', input)
    },

    settingsUpdate (context, input) {
      context.commit('settingsSet', { ...context.state.settings, ...input })
    }
  },
  plugins: [
    storeState()
  ],
  strict: process.env.NODE_ENV !== 'production'
})
