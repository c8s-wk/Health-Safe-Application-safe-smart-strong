<template>
    <div class="min-h-screen flex items-center justify-center bg-health-light py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-health-dark">
            Forget Password / Change Password
          </h2>
        </div>
        <form class="mt-8 space-y-6" @submit.prevent="handleGetResetLink">
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
          </div>
  
          <div>
            <button
              type="submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-health-primary hover:bg-health-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-health-primary"
            >
              Get Reset Link
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
  
  const handleGetResetLink = async () => {
    try {
      await userStore.resetUserPassword(email.value);
      alert('Reset link has been sent to your email address')
    } catch (error) {
      if (userStore.error) {
        alert(userStore.error) 
      } else {
        alert('An unknown error occurred during resetting password')
      }
    }
  }
  </script>