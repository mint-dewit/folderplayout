<template>
  <b-row>
    <b-col>
      <h6 class="text-center">NOW PLAYING: {{ playoutState.nowPlaying }}</h6>
    </b-col>
    <b-col>
      <h6 class="text-center">NEXT UP: {{ playoutState.nextUp }}</h6>
    </b-col>
  </b-row>
</template>

<script>
export default {
  computed: {
    playoutState () {
      return this.$store.getters.getPlayoutState(this.t)
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
    }, 1000)
  },
  destroyed () {
    clearInterval(this.interval)
  }
}
</script>
