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
          <h2>Device Status</h2>

          <b-table :items="deviceStates" />
        </b-card>
      </b-col>
    </b-row>

    <b-row class="mt-3">
      <b-col>
        <b-card>
          <h2>Playlist</h2>

          <b-table :items="playlist" />
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
      return this.$store.state.readableTimeline.filter(o => o.start > this.t).map(o => {
        const start = new Date(o.start)
        // o.date = start.getDate() + '/' + (start.getMonth() + 1)
        // o.time = start.toLocaleTimeString(undefined, { hour12: false })
        // return o

        return {
          date: start.getDate() + '/' + (start.getMonth() + 1),
          time: start.toLocaleTimeString(undefined, { hour12: false }),
          item: o.label,
          duration: this.toTimeString(o.duration)
        }
      })
    },
    deviceStates () {
      const codes = {
        0: 'Unknown',
        1: 'Good',
        2: 'Minor Warning',
        3: 'Major Warning',
        4: 'Bad',
        5: 'Fatal'
      }
      const names = {
        'atem': 'Blackmagic Atem Switcher',
        'ccg': 'CasparCG',
        'mediascanner': 'CasparCG Media Scanner'
      }
      const states = []

      for (const device in this.$store.state.deviceState) {
        const state = this.$store.state.deviceState[device]
        const displayState = {
          name: names[device] || device,
          status: codes[state.statusCode],
          messages: state.messages && state.messages.join(', ')
        }

        if (state.statusCode >= 2) {
          displayState._cellVariants = {
            status: 'warning'
          }
        }

        if (state.statusCode >= 4) {
          displayState._rowVariant = 'danger'
        }

        states.push(displayState)
      }

      return states
    }
  },
  methods: {
    toTimeString (ms) {
      const s = Math.round(ms / 1000) % 60
      const m = Math.floor(ms / (60 * 1000)) % 60
      const h = Math.floor(ms / (60 * 60 * 1000)) % 60
      const pad = (t) => ('00' + t).substr(-2)

      return `${pad(h)}:${pad(m)}:${pad(s)}`
    },
    deviceNameFromId (name) {
      const names = {
        'atem': 'Blackmagic Atem Switcher',
        'ccg': 'CasparCG',
        'mediascanner': 'CasparCG Media Scanner'
      }

      return names[name] || name
    }
  },
  data () {
    return {
      t: Date.now()
    }
  },
  created () {
    this.interval = setInterval(() => {
      this.t = Date.now()
    }, 500)
  },
  destroyed () {
    clearInterval(this.interval)
  }
}
</script>
