<!-- Map display for post location -->
<template>
<div v-if="post?.latitude && post?.longitude" class="p-6 border-b border-gray-200">
    <h3 class="text-lg font-medium text-gray-900 mb-2">Location</h3>
    <div 
      ref="mapContainer" 
      class="bg-gray-100 rounded-lg h-96 relative"
    >
      <!-- 加载状态 -->
      <div 
        v-if="mapLoading" 
        class="absolute inset-0 flex items-center justify-center bg-gray-100/50"
      >
        <div class="flex flex-col items-center text-gray-500">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-health-primary mb-2"></div>
          <span>Loading map...</span>
        </div>
      </div>

      <!-- 错误提示 -->
      <div 
        v-if="mapError"
        class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
      >
        <div class="text-red-500 mb-2">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p class="text-red-600 font-medium">{{ mapError }}</p>
        <p class="text-sm text-gray-600 mt-2">Coordinates: {{ post.latitude.toFixed(4) }}, {{ post.longitude.toFixed(4) }}</p>
      </div>

      <!-- API密钥缺失提示 -->
      <div 
        v-if="!apiKey"
        class="absolute inset-0 flex items-center justify-center bg-yellow-50 p-4"
      >
        <div class="text-center">
          <p class="text-yellow-700">
            Google Maps API key not configured. 
            <a 
              href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
              target="_blank" 
              class="underline hover:text-yellow-600"
            >
              Get API key
            </a>
          </p>
        </div>
      </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

interface Post {
  latitude: number
  longitude: number
  // 其他需要的属性
}

const props = defineProps<{
  post: Post
}>()

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const mapLoader = ref<Loader | null>(null)
const mapLoading = ref(false)
const mapError = ref<string | null>(null)
const mapContainer = ref<HTMLElement | null>(null)
const map = ref<google.maps.Map | null>(null)

// 使用 computed 确保响应式
const canShowMap = computed(() => {
  return props.post?.latitude && props.post?.longitude
})


const initMap = async () => {
  if (!canShowMap.value) return
  
  mapLoading.value = true
  mapError.value = null

  try {
    if (!apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    mapLoader.value = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"]
    })

    await mapLoader.value.load()

    if (mapContainer.value) {
      map.value = new google.maps.Map(mapContainer.value, {
        center: { 
          lat: props.post.latitude, 
          lng: props.post.longitude 
        },
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false
      })

      new google.maps.Marker({
        position: { 
          lat: props.post.latitude, 
          lng: props.post.longitude 
        },
        map: map.value,
        title: "Post Location"
      })
    }
  } catch (error) {
    console.error('Error loading Google Maps:', error)
    mapError.value = 'Failed to load map. ' + (error instanceof Error ? error.message : 'Please try again later.')
  } finally {
    mapLoading.value = false
  }
}

const cleanupMap = () => {
  if (map.value) {
    const container = map.value.getDiv()
    container.style.height = '0' // 防止内存泄漏
    google.maps.event.clearInstanceListeners(map.value)
    container.parentNode?.removeChild(container)
    map.value = null
  }
  if (mapLoader.value) {
    mapLoader.value = null
  }
}

onBeforeUnmount(() => {
  cleanupMap()
})

watch(() => props.post, async (newPost) => {
  if (newPost?.latitude && newPost?.longitude) {
    await initMap()
  }
}, { immediate: true })
onMounted(() => {
  if (canShowMap.value) {
    initMap()
  }
})
</script>