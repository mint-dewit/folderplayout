<template>
  <b-row>
    <b-col>
      <b-progress :value="progress" :max="100"></b-progress>
    </b-col>
  </b-row>
</template>

<script>
export default {
  data () {
    return {
      progress: 0
    }
  },
  created () {
    this.interval = setInterval(() => {
      this.progress = 100 * (Date.now() - this.$store.state.playoutState.startTime) / (this.$store.state.playoutState.nextUpTime - this.$store.state.playoutState.startTime)
    }, 200)
  },
  destroyed () {
    clearInterval(this.interval)
  }
}
</script>

