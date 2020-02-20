<template>
  <b-container fluid>
    <b-row class="mt-3">
      <b-col>
        <b-card>
          <timing-component/>

          <progress-bar />

          <status-text />

          <!-- <b-row>
            <b-col cols="6" offset="6" class="text-center">
              <b-button size="lg" variant="primary">TAKE</b-button>
            </b-col>
          </b-row> -->
        </b-card>
      </b-col>
    </b-row>

    <b-row class="mt-3">
      <b-col>
        <b-card>
          <h2>Playlist</h2>

          <b-list-group>
            <b-list-group-item v-for="(item, i) in playlist" :key="i">
              <b-row>
                <b-col sm="1">
                  {{ item.date }}
                </b-col>
                <b-col sm="2">
                  {{ item.time }}
                </b-col>
                <b-col>
                   {{ item.label }}
                </b-col>
                <b-col sm="2">
                  {{ toTimeString(item.duration) }}
                </b-col>
              </b-row>
            </b-list-group-item>
          </b-list-group>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import TimingComponent from '@/components/DashBoard/TimingComponent'
import ProgressBar from '@/components/DashBoard/ProgressBar'
import StatusText from '@/components/DashBoard/StatusText'

export default {
  components: { TimingComponent, ProgressBar, StatusText },
  computed: {
    playlist () {
      return this.$store.state.readableTimeline.map(o => {
        const start = new Date(o.start)
        o.date = start.getDate() + '/' + (start.getMonth() + 1)
        o.time = start.toLocaleTimeString(undefined, { hour12: false })
        return o
      })
    }
  },
  methods: {
    toTimeString (ms) {
      const s = Math.round(ms / 1000) % 60
      const m = Math.floor(ms / (60 * 1000)) % 60
      const h = Math.floor(ms / (60 * 60 * 1000)) % 60
      const pad = (t) => ('00' + t).substr(-2)

      return `${pad(h)}:${pad(m)}:${pad(s)}`
    }
  },
  data () {
    return {
      t: Date.now()
    }
  },
  created () {
    this.interval = setInterval(() => {
      t = Date.now()
    }, 1000)
  },
  destroyed () {
    clearInterval(this.interval)
  }
}
</script>
