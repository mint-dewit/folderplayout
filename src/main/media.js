import axios from 'axios'
import { EventEmitter } from 'events'

const SCANNER_URL = 'http://192.168.1.111:8000/' // hushhh
axios.defaults.baseURL = SCANNER_URL

export class MediaScanner extends EventEmitter {
  lastSeq = 0
  media = []
  connected = false

  constructor () {
    super()
    this._updateMedia()
  }

  getMediaDuration (name) {
    for (const clip of this.media) {
      if (clip.name === name.toUpperCase()) {
        return clip.format.duration
      }
    }

    return 0
  }

  getFolderContents (name) {
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

  async _updateMedia () {
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
      }
    } catch (e) {
      if (this.connected) {
        this.connected = false
        this.emit('disconnected')
      }
    }

    setTimeout(() => this._updateMedia(), 1000)
  }
}
