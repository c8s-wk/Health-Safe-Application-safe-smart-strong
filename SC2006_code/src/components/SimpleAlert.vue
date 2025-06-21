<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Props for the component
const props = defineProps({
  title: {
    type: String,
    default: 'Alert'
  },
  message: {
    type: String,
    default: 'This is an alert message'
  },
  category: {
    type: String,
    default: 'info'
  },
  autoClose: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 5000 // 5 seconds
  }
})

// Show or hide the alert
const isVisible = ref(false)

// Close the alert
const closeAlert = () => {
  isVisible.value = false
}

// Show the alert with auto-close
onMounted(() => {
  isVisible.value = true
  
  if (props.autoClose) {
    setTimeout(() => {
      closeAlert()
    }, props.duration)
  }
})

// Get background color based on category
const getBgColor = () => {
  switch (props.category.toLowerCase()) {
    case 'danger':
    case 'error':
      return 'bg-red-100 border-red-500'
    case 'warning':
      return 'bg-yellow-100 border-yellow-500'
    case 'success':
      return 'bg-green-100 border-green-500'
    case 'info':
    default:
      return 'bg-blue-100 border-blue-500'
  }
}
</script>

<template>
  <transition name="fade">
    <div 
      v-if="isVisible" 
      :class="['fixed top-4 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg p-4 border-l-4 z-50', getBgColor()]"
    >
      <div class="flex justify-between items-start">
        <h3 class="font-semibold text-gray-800">{{ title }}</h3>
        <button 
          @click="closeAlert" 
          class="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
      <p class="text-sm text-gray-700 mt-1">{{ message }}</p>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style> 