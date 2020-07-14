<template>
  <b-row>
    <b-col>
      <h1 class="text-center">{{ curTime }}</h1>
    </b-col>
    <b-col>
      <h1 class="text-center">{{ countdown }}</h1>
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
      curTime: new Date().toLocaleTimeString('nl-nl'),
      countdown: '00:00:00',
      t: Date.now(),
    }
  },
  created() {
    this.interval = setInterval(() => {
      this.curTime = new Date().toLocaleTimeString('nl-nl')
      if (this.playoutState.nextUpTime > 0) {
        let t = this.playoutState.nextUpTime - Date.now()
        const makeTwo = (num) => ('00' + Math.floor(num)).substr(-2)
        this.countdown = `${makeTwo(t / 3600000)}:${makeTwo((t % 3600000) / 60000)}:${makeTwo((t % 60000) / 1000)}`
      } else {
        this.countdown = '--:--:--'
      }
      this.t = Date.now()
    }, 200)
  },
  destroyed() {
    clearInterval(this.interval)
  },
}
</script>

<style scoped>
h1 {
  font-variant-numeric: tabular-nums;
}
</style>
