<template>
  <div id="app">
    <b-navbar toggleable="md" type="dark" variant="info">
      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

      <b-collapse is-nav id="nav_collapse">
        <b-navbar-nav>
          <b-nav-item to="/dashboard">Dashboard</b-nav-item>
          <b-nav-item to="/schedule">Schedule</b-nav-item>
          <b-nav-item to="/settings">Settings</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-navbar-nav v-if="isScheduleEditor()">
            <b-nav-item v-on:click.prevent="exportSchedule" title="Export">
              <font-awesome-icon icon="file-export"></font-awesome-icon>
            </b-nav-item>
            <b-nav-item v-on:click.prevent="importSchedule" title="Import">
              <font-awesome-icon icon="file-import"></font-awesome-icon>
            </b-nav-item>
            <b-nav-item href v-on:click.prevent="refreshSchedule" title="Reset">
              <font-awesome-icon icon="redo"></font-awesome-icon>
            </b-nav-item>
            <b-nav-item href v-on:click.prevent="saveSchedule" title="Save">
              <font-awesome-icon icon="save"></font-awesome-icon>
            </b-nav-item>
          </b-navbar-nav>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <router-view></router-view>
  </div>
</template>

<script>
const { dialog } = require('electron').remote

export default {
  name: 'folderplayout',
  data() {
    return {
      active: 0,
    }
  },
  methods: {
    isScheduleEditor: function () {
      return this.$route.path.search('/schedule') > -1
    },
    refreshSchedule: function () {
      this.$store.dispatch('resetSchedule')
    },
    saveSchedule: function () {
      this.$store.dispatch('setPlayoutSchedule')
      this.$bvToast.toast('Saved schedule', {
        variant: 'success',
        toaster: 'b-toaster-bottom-right',
      })
    },
    exportSchedule: async function () {
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Export schedule',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })
      if (filePath && !canceled) this.$store.dispatch('exportSchedule', filePath)
    },
    importSchedule: async function () {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import schedule',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile'],
      })
      if (!canceled && filePaths && filePaths.length > 0) {
        this.$store.dispatch('importSchedule', filePaths[0])
        this.$router.push('/schedule')
      }
    },
  },
}
</script>

<style>
/* CSS */
</style>
