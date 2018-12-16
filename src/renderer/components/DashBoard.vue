<template>
  <b-container fluid>
    <b-row>
      <b-col>
        <b-card>
          <timing-component/>

          <progress-bar />

          <status-text />

          <b-row>
            <b-col cols="6" offset="6" class="text-center">
              <b-button size="lg" variant="primary">TAKE</b-button>
            </b-col>
          </b-row>
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
  components: { TimingComponent, ProgressBar, StatusText }
}
</script>
