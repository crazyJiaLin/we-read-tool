import { RouteRecordRaw } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Notes from '../views/Notes.vue'
import AI from '../views/AI.vue'
import BookSummary from '../views/BookSummary.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '统计概览' }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: Notes,
    meta: { title: '笔记整理' }
  },
  {
    path: '/ai',
    name: 'AI',
    component: AI,
    meta: { title: 'AI问答' }
  }
]

export default routes 