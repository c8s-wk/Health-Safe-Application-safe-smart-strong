import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Healthcare from '../views/Healthcare.vue'
import PostsView from '../views/PostsView.vue'
import Login from '../views/Login.vue'
import SignUp from '../views/SignUp.vue'
import UserProfile from '../views/UserProfile.vue'
import CreatePostView from '../views/CreatePostView.vue'
import ResetPassword from '../views/ResetPassword.vue'
import ForgetPassword from '../views/ForgetPassword.vue'
import NewsView from '../views/NewsView.vue'
import AlertsView from '../views/AlertsView.vue'
import PostDetailView from '../views/PostDetailView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/healthcare',
      name: 'healthcare',
      component: Healthcare
    },
    {
      path: '/blog',
      name: 'blog',
      component: NewsView
    },
    {
      path: '/posts',
      name: 'posts',
      component: PostsView
    },
    {
      path: '/posts/create',
      name: 'create-post',
      component: CreatePostView,
      meta: { requiresAuth: true }
    },
    {
      path: '/posts/:id',
      name: 'PostDetail',
      component: PostDetailView
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignUp
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPassword
    },
    {
      path: '/forget-password',
      name: 'forget-password',
      component: ForgetPassword
    },
    {
      path: '/profile',
      name: 'profile',
      component: UserProfile,
      meta: { requiresAuth: true }
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: AlertsView
    },
    {
      path: '/alerts/details',
      name: 'alert-details',
      component: () => import('../views/AlertDetail.vue')
    },
    {
      path: '/reports',
      name: 'ReportsView',
      component: () => import('../views/ReportsView.vue')
    },
    {
      path: '/manage-usertype',
      name: 'UserManagement',
      component: () => import('../views/ADMINUserManagementView.vue')
    },
    {
      path: '/manage-usertype-moderator',
      name: 'UserManagementModerator',
      component: () => import('../views/MODERATORUsertypeChange.vue')
    },
    {
      path: '/send-alerts',
      name: 'SendAlerts',
      component: () => import('../views/CreateAlert.vue')
    },
    {
      path: '/reports/:reportID',
      name: 'ReportsDetails',
      component: () => import('../views/ReportDetailsView.vue')
    }
  ]
})

export default router
