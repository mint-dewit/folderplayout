<template>
  <div id="app">
    <b-navbar toggleable="md" type="dark" variant="info">

      <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>

      <b-collapse is-nav id="nav_collapse">

        <b-navbar-nav>
          <b-nav-item to="/">Dashboard</b-nav-item>
          <b-nav-item to="/schedule">Schedule</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">

          <b-navbar-nav v-if="isScheduleEditor()">
            <b-nav-item href v-on:click.prevent="refreshSchedule" title="Refresh">
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
  export default {
    name: 'folderplayout',
    data () {
      return {
        active: 0
      }
    },
    methods: {
      isScheduleEditor: function () {
        return this.$route.path.search('/schedule') > -1
      },
      refreshSchedule: function () {
        // @todo
      },
      saveSchedule: function () {
        // @todo
      }
    }
  }
</script>

<style>
  /* CSS */
</style>
