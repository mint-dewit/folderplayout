import axios from 'axios'
import { EventEmitter } from 'events'

const SCANNER_URL = 'http://127.0.0.1:8000/'

export class MediaScanner extends EventEmitter {
  constructor(url) {
    super()

    this.lastSeq = 0
    this.media = []
    this.connected = false
    this.url = '127.0.0.1'

    axios.defaults.baseURL = url || SCANNER_URL
    this._updateMedia()
  }

  getMediaTime(name) {
    for (const clip of this.media) {
      if (clip.name === name.toUpperCase()) {
        return clip.mediaTime
      }
    }

    return 0
  }

  getMediaDuration(name) {
    for (const clip of this.media) {
      if (clip.name === name.toUpperCase()) {
        return clip.format.duration
      }
    }

    return 0
  }

  getFolderContents(name) {
    const res = []

    if (name.substr(-1) !== '/') name += '/'
    name = name.toUpperCase()

    for (const clip of this.media) {
      if (clip.name.search(name) === 0) {
        let clipName = clip.name
        clipName = clipName.replace(name, '')
        if (clipName.split('/').length === 1) {
          res.push(clip.name)
        }
      }
    }

    return res
  }

  getStatus() {
    if (this.connected) {
      return {
        statusCode: 1, // good
        messages: [],
      }
    } else {
      return {
        statusCode: 4, // bad
        messages: ['Unable to connect to media manager at ' + axios.defaults.baseURL],
      }
    }
  }

  async _updateMedia() {
    try {
      const res = await axios.get('/stat/seq')
      const lastSeq = res.data.update_seq

      if (lastSeq !== this.lastSeq) {
        this.lastSeq = lastSeq
        this.media = (await axios.get('/media')).data
        this.emit('changed')
      }

      if (!this.connected) {
        this.connected = true
        this.emit('connected')
        this.emit('connectionChanged', this.getStatus())
      }
    } catch (e) {
      if (this.connected) {
        this.connected = false
        this.emit('disconnected')
        this.emit('connectionChanged', this.getStatus())
      }
    }

    setTimeout(() => this._updateMedia(), 1000)
  }
}
