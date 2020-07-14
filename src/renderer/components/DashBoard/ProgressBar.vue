<template>
  <b-row>
    <b-col>
      <b-progress :value="progress" :max="100"></b-progress>
    </b-col>
  </b-row>
</template>

<script>
export default {
  computed: {
    playoutState() {
      return this.$store.getters.getPlayoutState(this.t)
    },
  },
  data() {
    return {
      progress: 0,
      t: Date.now(),
    }
  },
  created() {
    this.interval = setInterval(() => {
      if (Date.now() > this.playoutState.nextUpTime) {
        this.progress = 0
      } else {
        this.progress =
          (100 * (Date.now() - this.playoutState.startTime)) /
          (this.playoutState.nextUpTime - this.playoutState.startTime)
      }
      this.t = Date.now()
    }, 200)
  },
  destroyed() {
    clearInterval(this.interval)
  },
}
</script>
