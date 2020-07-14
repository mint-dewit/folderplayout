<template>
  <div id="schedule">
    <div class="left-panel" ref="leftPanel">
      <b-container>
        <b-row>
          <b-col>
            <a href="#" v-on:click.prevent="back()">
              <h3 style="color: black; float: left;">
                <font-awesome-icon v-if="parentEntry._id != 'MAIN_ENTRY'" icon="arrow-left"></font-awesome-icon>
                {{ parentEntry.name || 'Untitled' }}
              </h3>
            </a>
            <b-dropdown text="Add">
              <b-dropdown-item @click="createObject('file')">Clip</b-dropdown-item>
              <b-dropdown-item @click="createObject('input')">Input</b-dropdown-item>
              <b-dropdown-item @click="createObject('folder')">Folder</b-dropdown-item>
              <b-dropdown-item @click="createObject('group')">Group</b-dropdown-item>
            </b-dropdown>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-list-group>
              <draggable @end="reorder">
                <b-list-group-item
                  v-for="item of renderList()"
                  :key="item._id"
                  :to="{ path: '/schedule/' + item._id + '/edit' }"
                  class="collection-item schedule-entry"
                  v-bind:class="{ active: isActive(item._id) }"
                  >{{ item.type }}: {{ item.name || item.path || 'Untitled' }}</b-list-group-item
                >
              </draggable>
            </b-list-group>
          </b-col>
        </b-row>
      </b-container>
    </div>
    <div class="right-panel z-depth-5" ref="rightPanel">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'schedule',
  components: { draggable },
  computed: {
    parentEntry: function () {
      if (this.$route.params.id === undefined) {
        return { _id: 'MAIN_ENTRY', name: 'Schedule' }
      }

      return this.$store.getters.findGroupOrParent(this.$route.params.id)
    },
    schedule: function () {
      return this.$store.state.schedule
    },
  },
  data: function () {
    return {
      path: [],
    }
  },
  methods: {
    reorder: function (ev) {
      this.$store.dispatch('reorder', { id: this.$route.params.id, oldIndex: ev.oldIndex, newIndex: ev.newIndex })
      console.log(ev.newIndex)
    },

    renderList: function () {
      let findList = (parent) => {
        if (parent.children) {
          for (let child of parent.children) {
            if (child._id === this.$route.params.id && child.type === 'group') {
              // child we are editing, and child is a group
              return child.children
            } else if (child._id === this.$route.params.id) {
              // child we are editing, but child is not a group
              return parent.children
            } else if (child.type === 'group') {
              // not the  child we are editing, but child is a group, therefore might contain what we are editing
              let res = findList(child)
              if (res) return res
            }
          }
        }
      }

      if (this.$route.params.id) {
        return findList({ children: this.schedule, _id: -1 })
      }

      return this.schedule
    },
    isActive: function (id) {
      if (id === this.$route.params.id) return true
    },
    getProperties: function () {
      if (this.path.length === 0) return undefined
      let list = this.schedule[this.path[0]]
      if (this.path.length === 1) return list
      for (let i = 1; i < this.path.length; i++) {
        if (list.type === 'group') list = list.children[this.path[i]]
      }
      return list
    },
    setProperties: function () {
      // stupid hack here, but sometimes the list in getProperties and its return value do not match.
      let props
      if (this.isActive === -1) props = this.getProperties()
      else props = this.renderList()[this.isActive]

      let object = {}
      if (props === undefined) {
        object = { name: '', days: [], weeks: '', dates: [], times: [] }
      }
      object.name = props.name !== undefined ? props.name : ''
      object.days = props.days !== undefined ? props.days : []
      object.weeks = props.weeks !== undefined ? props.weeks.join(', ') : ''
      object.dates = props.dates !== undefined ? props.dates : []
      object.times = props.times !== undefined ? props.times : []
      object.type = props.type

      if (props.type !== 'group') object.path = props.path ? props.path : ''

      this.editObject = object
    },
    back: function () {
      let _id = this.$route.params.id

      let findById = (parent) => {
        if (parent.children) {
          for (let child of parent.children) {
            if (child._id === _id) {
              // child we are editing
              return parent
            } else if (child.type === 'group') {
              // not the  child we are editing, but child is a group, therefore might contain what we are editing
              let res = findById(child) || null

              if (res) return res
            }
          }
        }
      }

      const parent = findById({ children: this.schedule, _id: 'MAIN_ENTRY' })

      if (parent && parent._id === 'MAIN_ENTRY') this.$router.push({ path: '/schedule' })
      else if (parent) this.$router.push({ path: '/schedule/' + parent._id + '/edit' })
    },

    createObject: function (type) {
      // find parent to attach object to
      const parentId = (this.$store.getters.findGroupOrParent(this.$route.params.id) || {})._id
      // commit object
      this.$store.dispatch('newEntry', { type: type, _id: parentId })
      // change view?
    },
  },
}
</script>

<style>
.left-panel {
  top: 64px;
  width: 50%;
  float: left;
  position: absolute;
  min-height: calc(100% - 64px);
}
.right-panel {
  top: 64px;
  width: 50%;
  display: block;
  height: calc(100% - 64px);
  overflow: scroll;
  right: 0;
  position: fixed;
  background: #fff;
}
.schedule-entry {
  cursor: pointer;
}
</style>
