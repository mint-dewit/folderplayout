/**
 * Note that this is a pretty blatant copy from the vuex-electron project. That
 * project however suffers from a bug that has to do with the underlying storage
 * library used. Since I don't require any usage of the main process, I just
 * replace the storage with localStorage from the browser.
 */
import merge from 'deepmerge'

const STORAGE_KEY = 'state' // Note - change this in assets/fatal.html too

class PersistedState {
  constructor(options, store) {
    this.options = options
    this.store = store
  }

  loadOptions() {
    if (!this.options.storageKey) this.options.storageKey = STORAGE_KEY

    this.whitelist = this.loadFilter(this.options.whitelist, 'whitelist')
    this.blacklist = this.loadFilter(this.options.blacklist, 'blacklist')
  }

  getState() {
    return JSON.parse(window.localStorage.getItem(this.options.storageKey))
  }

  setState(state) {
    window.localStorage.setItem(this.options.storageKey, JSON.stringify(state))
  }

  loadFilter(filter, name) {
    if (!filter) {
      return null
    } else if (filter instanceof Array) {
      return this.filterInArray(filter)
    } else if (typeof filter === 'function') {
      return filter
    } else {
      throw new Error(`[Vuex Electron] Filter "${name}" should be Array or '
        Function. Please, read the docs.`)
    }
  }

  filterInArray(list) {
    return (mutation) => {
      return list.includes(mutation.type)
    }
  }

  checkStorage() {
    if (!window || !window.localStorage) {
      throw new Error('Could not find ' + 'localStorage, which is required by storeState.js')
    }
  }

  combineMerge(target, source, options) {
    const emptyTarget = (value) => (Array.isArray(value) ? [] : {})
    const clone = (value, options) => merge(emptyTarget(value), value, options)
    const destination = target.slice()

    source.forEach(function (e, i) {
      if (typeof destination[i] === 'undefined') {
        const cloneRequested = options.clone !== false
        const shouldClone = cloneRequested && options.isMergeableObject(e)
        destination[i] = shouldClone ? clone(e, options) : e
      } else if (options.isMergeableObject(e)) {
        destination[i] = merge(target[i], e, options)
      } else if (target.indexOf(e) === -1) {
        destination.push(e)
      }
    })

    return destination
  }

  loadInitialState() {
    const state = this.getState(this.options.storage, this.options.storageKey)

    if (state) {
      const mergedState = merge(this.store.state, state, { arrayMerge: this.combineMerge })
      this.store.replaceState(mergedState)
    }
  }

  subscribeOnChanges() {
    this.store.subscribe((mutation, state) => {
      if (this.blacklist && this.blacklist(mutation)) return
      if (this.whitelist && !this.whitelist(mutation)) return

      this.setState(state)
    })
  }
}

export default (options = {}) => (store) => {
  const persistedState = new PersistedState(options, store)

  persistedState.loadOptions()
  persistedState.checkStorage()
  persistedState.loadInitialState()
  persistedState.subscribeOnChanges()
}
