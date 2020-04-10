'use strict'

import { app, BrowserWindow } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let fatalErrorWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const fatalErrWinURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/static/fatal.html`
  : `file://${__dirname}/static/fatal.html`

  // const fatalErrWinURL = `file://${__dirname}/static/fatal.html`

function createFatalErrorWindow () {
  fatalErrorWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 400
  })

  fatalErrorWindow.loadURL(fatalErrWinURL)
}

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.webContents.on('crashed', () => {
    console.log('mainWindow crashed')
    createFatalErrorWindow()
    mainWindow.close()
  })

  if (process.env.NODE_ENV !== 'development') {
    mainWindow.webContents.on('before-input-event', (_e, input) => {
      if (input.type === 'keyDown' && input.key === 'I' && input.shift && input.control) {
        mainWindow.webContents.openDevTools()
      }
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
