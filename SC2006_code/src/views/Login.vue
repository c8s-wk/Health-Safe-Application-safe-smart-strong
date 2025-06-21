<template>
  <div class="min-h-screen flex items-center justify-center bg-health-light py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-health-dark">
          Sign in to your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-health-primary focus:border-health-primary focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-health-primary focus:border-health-primary focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-health-primary hover:bg-health-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-health-primary"
          >
            Sign in
          </button>
        </div>

        <div class="text-center">
          <router-link
            to="/signup"
            class="font-medium text-health-primary hover:text-health-primary/90"
          >
            Don't have an account? Sign up
          </router-link>
        </div>
        <div class="text-center">
          <router-link
            to="/forget-password"
            class="font-medium text-health-primary hover:text-health-primary/90"
          >
            Forget password?
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore.ts' // 引入 userStore

const router = useRouter()
const userStore = useUserStore() // 获取 userStore 实例
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await userStore.loginUser(email.value, password.value) // 调用 userStore 中的 loginUser 方法
    router.push('/') // 登录成功后跳转到首页
  } catch (error) {
    if (userStore.error) {
      alert(userStore.error) // 显示登录错误信息
    } else {
      alert('An unknown error occurred during login')
    }
  }
}
</script>