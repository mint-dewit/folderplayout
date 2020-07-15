import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import { ipcRenderer } from 'electron'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import App from './App'
import router from './router'
import store from './store'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

Vue.use(BootstrapVue)

library.add(fas)

Vue.component('font-awesome-icon', FontAwesomeIcon)

ipcRenderer.on('init', () => {
  ipcRenderer.send('init', {
    schedule: store.state.playoutSchedule,
    settings: store.state.settings,
  })
})
ipcRenderer.on('setReadableTimeline', (ev, tl) => {
  console.log('readable tl', tl)
  store.dispatch('setReadableTimeline', tl)
})
ipcRenderer.on('setDeviceState', (ev, device, status) => {
  console.log('device status', device, status)
  store.dispatch('setDeviceState', { device, status })
})
ipcRenderer.on('removeDeviceState', (ev, device) => {
  console.log('remove device', device)
  store.dispatch('removeDeviceState', device)
})

window.store = store

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>',
}).$mount('#app')
