import Vue from 'vue'
import Vuex from 'vuex'
import uid from 'uid'

import { createPersistedState, createSharedMutations } from 'vuex-electron'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    schedule: []
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
        _id: uid(),
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

    toggleDay (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            if (parent[child].days && parent[child].days[payload.day]) {
              if (parent[child].days[payload.day]) {
                parent[child].days[payload.day] = false
              } else {
                parent[child].days[payload.day] = true
              }
            } else if (parent[child].days) {
              parent[child].days[payload.day] = true
            } else {
              parent[child].days = []
              parent[child].days[payload.day] = true
            }

            break
          }

          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    },

    toggleAudio (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            if (parent[child].audio === false) {
              delete parent[child].audio
            } else {
              parent[child].audio = false
            }

            break
          }

          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    },

    /**
     * Adds a time entry to a specific entry, where the
     * entry is defined by payload._id
     * @param {Object} state
     * @param {Object} payload
     */
    addTime (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            if (parent[child].times) {
              parent[child].times.push(payload.time)
            } else {
              Vue.set(parent[child], 'times', [payload.time])
            }
            break
          }
          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    },

    /**
     * Updates a time entry in a specific entry, where the
     * entry is defined by the payload._id, the time entry
     * is defined by payload.index and the new time is defined
     * by payload.time
     * @param {Object} state
     * @param {Object} payload
     */
    updateTime (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            parent[child].times[payload.index] = payload.time
            break
          }
          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    },

    /**
     * Deletes a time entry in a specific entry, where the
     * entry is defined by the payload._id, and the time entry
     * is defined by entry.index
     * @param {Object} state The store state
     * @param {Object} payload An object with parameters
     */
    deleteTime (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            parent[child].times.splice(payload.index, 1)
            if (parent[child].times.length === 0) { Vue.set(parent[child], 'times', null) }
            break
          }
          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    },

    addDateEntry (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            if (parent[child].dates) {
              parent[child].dates.push(payload.dateEntry)
            } else {
              Vue.set(parent[child], 'dates', [payload.dateEntry])
            }
            break
          }
          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    },

    updateDateEntry (state, payload) {
      let findIn = (group) => {
        for (let child of group) {
          if (child._id === payload._id) {
            child.dates[payload.dateEntry][payload.type] = payload.date
          } else if (child.children) {
            findIn(child.children)
          }
        }
      }

      findIn(state.schedule)
    },

    deleteDateEntry (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            parent[child].dates.splice(payload.index, 1)
            if (parent[child].dates.length === 0) { Vue.set(parent[child], 'dates', null) }
            break
          }
          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    },

    reorder (state, payload) {
      var list = this.getters.findGroupOrParent(payload.id)
      list = list.children

      const movedItem = list.splice(payload.oldIndex, 1)[0]
      list.splice(payload.newIndex, 0, movedItem)
    },

    updateWeeks (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            parent[child].weeks = payload.value

            break
          }

          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    },

    updatePath (state, payload) {
      let findEntry = (parent) => {
        for (let child in parent) {
          if (parent[child]._id === payload._id) {
            if (parent[child].type === 'group') {
              parent[child].name = payload.value
            } else {
              parent[child].path = payload.value
            }

            break
          }

          if (parent[child].type === 'group') { findEntry(parent[child].children) }
        }
      }

      findEntry(state.schedule)
    }
  },
  actions: {
    newEntry (context, payload) {
      context.commit('newEntry', payload)
    },

    deleteEntry (context, payload) {
      context.commit('deleteEntry', payload)
    },

    toggleDay (context, payload) {
      context.commit('toggleDay', payload)
    },

    toggleAudio (context, payload) {
      context.commit('toggleAudio', payload)
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
    }
  },
  plugins: [
    createPersistedState(),
    createSharedMutations()
  ],
  strict: process.env.NODE_ENV !== 'production'
})
