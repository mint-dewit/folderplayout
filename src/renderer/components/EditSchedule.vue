<template>
  <b-container>
    <b-row>
      <b-col>
        <h3>Properties</h3>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <p>
          <a href="#" style="color:black" v-on:click.prevent="deleteObject">
            <font-awesome-icon icon="trash"></font-awesome-icon>
          </a>
          type: {{ editObject.type }}
        </p>
      </b-col>
    </b-row>

    <b-row v-if="editObject.type !== 'group'">
      <b-col>
        <b-form-checkbox :checked="editObject.audio === false" @change="toggleAudio" id="audio">
          Muted
        </b-form-checkbox>
      </b-col>
    </b-row>

    <b-row v-if="editObject.path !== undefined">
      <h5>Path</h5>
      <b-form-input id="name" v-model="editObject.path"></b-form-input>
    </b-row>
    <b-row v-else>
      <h5>Name</h5>
      <b-form-input id="name" v-model="editObject.name"></b-form-input>
    </b-row>

    <b-row>
      <b-col>
        <h5>Days</h5>
        <b-form-checkbox :checked="editObject.days[0]" @change="toggleDay" value="0" id="su" >
          SU
        </b-form-checkbox>
        <b-form-checkbox :checked="editObject.days[1]" @change="toggleDay" value="1" id="mo" >
          MO
        </b-form-checkbox>
        <b-form-checkbox :checked="editObject.days[2]" @change="toggleDay" value="2" id="TU" >
          TU
        </b-form-checkbox>
        <b-form-checkbox :checked="editObject.days[3]" @change="toggleDay" value="3" id="WE" >
          WE
        </b-form-checkbox>
        <b-form-checkbox :checked="editObject.days[4]" @change="toggleDay" value="4" id="TH" >
          TH
        </b-form-checkbox>
        <b-form-checkbox :checked="editObject.days[5]" @change="toggleDay" value="5" id="fr" >
          FR
        </b-form-checkbox>
        <b-form-checkbox :checked="editObject.days[6]" @change="toggleDay" value="6" id="sa" >
          SA
        </b-form-checkbox>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <h5>Weeks</h5>
        <b-form-input id="week" v-model="editObject.weeks" placeholder="e.g. 1,2,3..."></b-form-input>
        <b-form-text>Week numbers (separate with ,)</b-form-text>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <h5>Dates</h5>
        <b-input-group v-for="(date, index) in dates" :key="index">
          <b-input-group-prepend>
            <b-btn v-on:click.prevent="removeDate(index)">
              <font-awesome-icon icon="trash"></font-awesome-icon>
            </b-btn>
          </b-input-group-prepend>
          <b-form-input v-bind:value="date[0]" v-on:change="updateDate($event, index, 0)"></b-form-input>
          <b-form-input v-bind:value="date[1]" v-on:change="updateDate($event, index, 1)"></b-form-input>
        </b-input-group>
        
        <b-input-group>
          <b-form-input></b-form-input>
          <b-form-input></b-form-input>
          <b-input-group-append>
            <b-btn variant="primary" v-on:click.prevent="addDate()">
             Add daterange
            </b-btn>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <h5>Times</h5>
        <b-input-group v-for="(time, index) in times" v-bind:key="time, index">
          <b-input-group-prepend>
            <b-btn @click.prevent="removeTime(index)">
              <font-awesome-icon icon="trash"></font-awesome-icon>
            </b-btn>
          </b-input-group-prepend>
          <b-form-input :value="time" @change="updateTime($event, index)"></b-form-input>
        </b-input-group>
        
        <b-input-group>
          <b-form-input v-model="newTime"></b-form-input>
          <b-input-group-append>
            <b-btn variant="primary" @click.prevent="addTime">
              Add time
            </b-btn>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
  </b-container>
            
            <!-- <br /><hr />
            <div class="row">
                <div class="col s6">
                    <a class="waves-effect waves-teal btn-flat" style="width: 100%" v-on:click.prevent="setProperties">Cancel</a>
                </div>
                <div class="col s6">
                    <a class="waves-effect waves-light btn" style="width: 100%" v-on:click.prevent="saveObject">Save</a>
                </div>
            </div> -->
</template>

<script>
export default { // @todo: init date picker
  name: 'edit-schedule',
  computed: {
    editObject: function () {
      let obj = this.$store.getters.scheduleEntryById(this.id)
      if (!obj.days) { obj.days = [] }
      return obj
    },
    times: function () {
      return this.$store.getters.scheduleEntryById(this.id).times
    },
    dates: function () {
      return this.$store.getters.scheduleEntryById(this.id).dates
    },
    id: function () {
      return this.$route.params.id
    }
  },
  data: function () {
    return {
      newTime: ''
    }
  },
  methods: {
    getDay: function (day) {
      console.log(day, this.$store.getters.scheduleEntryById(this.id).days[day])
      return this.$store.getters.scheduleEntryById(this.id).days[day] || false
    },
    toggleDay: function (ev) {
      this.$store.commit('toggleDay', {_id: this.id, day: ev.target.value})
    },

    toggleAudio: function (ev) {
      console.log(this.id, this.editObject.audio !== false) // why doesn't this haave a fickin boolean value ffs.
      this.$store.commit('toggleAudio', {_id: this.id})
    },

    addDate: function () {
      // let dates = [$('.newdate-0')[0].value, $('.newdate-1')[0].value]

      // if (dates[0] !== '' && dates[1] !== '' && dates[0] < dates[1]) {
      //   this.$store.commit('addDateEntry', {_id: this.id, dateEntry: dates})
      //   $('.newdate-0')[0].value = ''
      //   $('.newdate-1')[0].value = ''
      // }
    },
    updateDate: function (ev, index, type) {
      // where type = 0 for start and 1 for end
      this.$store.commit('updateDateEntry', {_id: this.id, dateEntry: index, type: type, date: ev.target.value})
    },
    removeDate: function (index) {
      this.$store.commit('deleteDateEntry', {_id: this.id, dateEntry: index})

      // if (this.editObject.dates[index])
      //     this.editObject.dates.splice(index, 1)
    },

    addTime: function (event) {
      if (/\b(\d){2}(:){1}(\d){2}(:){1}(\d){2}\b/.test(this.newTime)) {
        this.$store.commit('addTime', {_id: this.id, time: this.newTime})
        this.newTime = ''
      }
    },
    updateTime: function (ev, index) {
      if (/\b(\d){2}(:){1}(\d){2}(:){1}(\d){2}\b/.test(ev.target.value)) {
        this.$store.commit('updateTime', {_id: this.id, index: index, time: ev.target.value})
      } else {
        ev.target.value = this.times[index]
      }
    },
    removeTime: function (index) {
      if (this.editObject.times[index]) { this.$store.commit('deleteTime', {_id: this.id, index: index}) }
    },

    saveObject: function () {
      let props = this.editObject
      var list = this.schedule[this.path[0]]
      for (let i = 1; i < this.path.length; i++) {
        if (list.type === 'group') { list = list.children[this.path[i]] }
      }
      console.log(list)

      list.days = props.days.length > 0 ? props.days : undefined

      if (props.weeks !== '') {
        list.weeks = []
        let weeks = props.weeks.split(',')
        for (let week of weeks) {
          list.weeks.push(week.trim())
          console.log(list.weeks)
        }
      } else if (list.weeks) { list.weeks = undefined }

      if (props.dates.length > 0) { list.dates = [] } else { list.dates = undefined }
      for (let dates of props.dates) {
        dates[0] = dates[0].split('-').reverse().join('-')
        dates[1] = dates[1].split('-').reverse().join('-')
        list.dates.push(dates)
      }

      list.times = props.times.length > 0 ? props.times : undefined

      if (props.type !== 'group') { list.path = props.path ? props.path : '' } else { list.name = props.name !== undefined ? props.name : '' }
    },

    deleteObject: function () {
      let _id = this.id

      let returnAndDeleteById = (parent) => {
        if (parent.children) {
          for (let child of parent.children) {
            if (child._id === _id) { // child we are editing
              // delete:
              this.$store.commit('deleteEntry', {_id: this.id})

              // navigate:
              this.$router.push({path: '/schedule/' + (parent._id === 'MAIN_ENTRY' ? '' : parent._id + '/edit')})

              return parent
            } else if (child.type === 'group') { // not the  child we are editing, but child is a group, therefore might contain what we are editing
              let res = returnAndDeleteById(child) || null

              if (res) { return res }
            }
          }
        }
      }

      returnAndDeleteById({children: this.$store.state.schedule, _id: 'MAIN_ENTRY'})

      // this.$store.commit('deleteEntry', {_id: this.id});

      //
    }
  }
}
</script>