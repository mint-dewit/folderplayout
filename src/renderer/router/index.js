import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/dashboard',
      name: 'dashboard',
      component: require('../components/DashBoard').default,
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: require('../components/Schedule').default,
    },
    {
      path: '/schedule/:id',
      name: 'schedule',
      component: require('../components/Schedule').default,
      children: [
        {
          path: 'edit',
          component: require('../components/EditSchedule').default,
        },
      ],
    },
    {
      path: '/settings',
      name: 'settings',
      component: require('../components/Settings').default,
    },
    {
      path: '*',
      redirect: '/dashboard',
    },
  ],
})
