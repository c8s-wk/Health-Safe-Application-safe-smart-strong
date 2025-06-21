<template>
  <div class="min-h-screen flex items-center justify-center bg-health-light py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-health-dark">
          Create your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSignUp">
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
          <div>
            <label for="confirm-password" class="sr-only">Confirm Password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              name="confirm-password"
              type="password"
              required
              class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-health-primary focus:border-health-primary focus:z-10 sm:text-sm"
              placeholder="Confirm Password"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-health-primary hover:bg-health-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-health-primary"
          >
            Sign up
          </button>
        </div>

        <div class="text-center">
          <router-link
            to="/login"
            class="font-medium text-health-primary hover:text-health-primary/90"
          >
            Already have an account? Sign in
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '../services/apiUserAuth.ts';

const router = useRouter();
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const handleSignUp = async () => {
  if (password.value!== confirmPassword.value) {
    alert('Passwords do not match');
    return;
  }
  if (email.value.trim() === '' || password.value.trim() === '') {
    alert('Please fill in all fields');
    return;
  }
  try {
    await register(email.value, password.value);
    alert('Registration successful. Please check your email for verification. You will be redirected to the login page.');
    router.push('/login');
  } catch (e) {
    if (e instanceof Error) {
      alert(e.message);
    }
    return;
  }
};
</script>