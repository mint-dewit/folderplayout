<template>
  <b-container fluid>
    <b-row class="mt-3">
      <b-col>
        <b-card>
          <h3>Settings</h3>

          <b-row>
            <b-col sm="3"><label for="decklink-input">Infochannel Decklink Input:</label></b-col>
            <b-col sm="9"><b-form-input id="decklink-input" type="number" min="1" v-model="decklinkInput"></b-form-input></b-col>
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
        this.$store.dispatch('settingsSetDecklink', val)
      }
    }
  }
}
</script>

