<template>
  <b-container fluid>
    <b-row class="mt-3">
      <b-col>
        <b-card>
          <h3>Settings</h3>

          <b-row>
            <b-col sm="3"><label for="decklink-input">Infochannel Input Type:</label></b-col>
            <b-col sm="9"><b-form-select id="decklink-input" :options="inputTypes" v-model="inputType"></b-form-select></b-col>
          </b-row>

          <b-row v-if="inputType === 0">
            <b-col sm="3"><label for="decklink-input">Infochannel Decklink Input:</label></b-col>
            <b-col sm="9"><b-form-input id="decklink-input" type="number" min="1" v-model="decklinkInput"></b-form-input></b-col>
          </b-row>

          <b-row v-if="inputType === 1">
            <b-col sm="3"><label for="launcher-host">Atem IP:</label></b-col>
            <b-col sm="9"><b-form-input id="launcher-host" type="text" v-model="atemIp"></b-form-input></b-col>
          </b-row>
          <b-row v-if="inputType === 1">
            <b-col sm="3"><label for="decklink-input">Infochannel Atem Input:</label></b-col>
            <b-col sm="9"><b-form-input id="decklink-input" type="number" v-model="infochannelAtemInput"></b-form-input></b-col>
          </b-row>
          <b-row v-if="inputType === 1">
            <b-col sm="3"><label for="decklink-input">Playout Atem Input:</label></b-col>
            <b-col sm="9"><b-form-input id="decklink-input" type="number" min="1" v-model="playoutAtemInput"></b-form-input></b-col>
          </b-row>

          <b-row>
            <b-col sm="3">
              <label for="casparcg-host">CasparCG Host:</label>
            </b-col>
            <b-col sm="9">
              <b-form-input id="casparcg-host" type="text" v-model="casparcgHost"></b-form-input>
            </b-col>
          </b-row>
          <b-row>
            <b-col sm="3">
              <label for="casparcg-port">CasparCG Port:</label>
            </b-col>
            <b-col sm="9">
              <b-form-input id="casparcg-port" type="number" v-model="casparcgPort"></b-form-input>
            </b-col>
          </b-row>

          <b-row>
            <b-col sm="3">
              <label for="scanner-host">Mediascanner URL:</label>
            </b-col>
            <b-col sm="9">
              <b-form-input id="scanner-host" type="text" v-model="mediaScannerURL"></b-form-input>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  computed: {
    decklinkInput: {
      get () {
        return this.$store.state.settings.decklinkInput
      },
      set (val) {
        this.$store.dispatch('settingsUpdate', { decklinkInput: val })
      }
    },
    inputType: {
      get () {
        return this.$store.state.settings.inputType
      },
      set (val) {
        this.$store.dispatch('settingsUpdate', { inputType: val })
      }
    },
    atemIp: {
      get () {
        return this.$store.state.settings.atemIp
      },
      set (val) {
        this.$store.dispatch('settingsUpdate', { atemIp: val })
      }
    },
    infochannelAtemInput: {
      get () {
        return this.$store.state.settings.infochannelAtemInput
      },
      set (val) {
        this.$store.dispatch('settingsUpdate', { infochannelAtemInput: val })
      }
    },
    playoutAtemInput: {
      get () {
        return this.$store.state.settings.playoutAtemInput
      },
      set (val) {
        this.$store.dispatch('settingsUpdate', { playoutAtemInput: val })
      }
    },
    mediaScannerURL: {
      get () {
        return this.$store.state.settings.mediaScannerURL
      },
      set (val) {
        this.$store.dispatch('settingsUpdate', { mediaScannerURL: val })
      }
    },
    casparcgHost: {
      get () {
        return this.$store.state.settings.casparcgHost
      },
      set (val) {
        this.$store.dispatch('settingsUpdate', { casparcgHost: val })
      }
    },
    casparcgPort: {
      get () {
        return this.$store.state.settings.casparcgPort
      },
      set (val) {
        this.$store.dispatch('settingsUpdate', { casparcgPort: val })
      }
    }
  },
  data () {
    return {
      inputTypes: [
        { value: 0, text: 'Decklink Input' },
        { value: 1, text: 'Atem Input' }
      ]
    }
  }
}
</script>

