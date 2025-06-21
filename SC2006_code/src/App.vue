<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import AlertNotificationSystem from './components/AlertNotificationSystem.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Allow window.alertSystem for TypeScript
declare global {
  interface Window {
    alertSystem?: any;
  }
}
</script>

<template>
  <div class="min-h-screen bg-health-light">
    <NavBar />
    <AlertNotificationSystem />
    <div id="dynamicAlerts"></div>
    <keep-alive include="PostsView,PostDetailView">
      <RouterView />
    </keep-alive>
  </div>
</template>