const { ipcMain } = require('electron')
const { PlayoutManager } = require('./playout')

export class API {
  constructor(window) {
    console.log('init api')
    this.window = window

    ipcMain.once('init', (event, { schedule, settings }) => {
      console.log('init playout')
      this.playoutSchedule = schedule
      this.settings = settings

      this.playoutHandler = new PlayoutManager(this)
    })
    ipcMain.on('schedule', (event, schedule) => {
      console.log('update schedule')
      this.playoutSchedule = schedule
      this.playoutHandler.createTimeline()
    })
    ipcMain.on('settings', (event, settings) => {
      console.log('update settings')
      this.settings = settings
      this.playoutHandler.updateMappingsAndDevices()
      this.playoutHandler.createTimeline()
    })

    console.log('send init')
    this.window.webContents.send('init')
  }

  dispose() {
    this.playoutHandler.dispose()
    delete this.playoutHandler
    ipcMain.removeAllListeners('init')
    ipcMain.removeAllListeners('schedule')
    ipcMain.removeAllListeners('settings')
  }

  setReadableTimeline(tl) {
    this.window.webContents.send('setReadableTimeline', tl)
  }

  setDeviceState(device, deviceStatus) {
    this.window.webContents.send('setDeviceState', device, deviceStatus)
  }

  removeDeviceState(device) {
    this.window.webContents.send('removeDeviceState', device)
  }
}
