<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import WeatherWidget from '../components/WeatherWidget.vue'
import { getAllPosts, findHotPointsFromPosts, Coordinate, Post } from '../services/apiPost'
import { useRouter } from 'vue-router'

const router = useRouter()
const isTestMode = import.meta.env.MODE === 'test'
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const categories = ref([
  { id: 1, name: 'Post Locations', active: true },
  { id: 2, name: 'Hotspots', active: false },
])

const map = ref<google.maps.Map | null>(null)
const postMarkers = ref<google.maps.Marker[]>([])
const hotspotMarkers = ref<google.maps.Circle[]>([])
const hotspotList = ref<{ index: number; coords: { latitude: number; longitude: number } }[]>([])
const mapLoaded = ref(false)
const mapError = ref<string | null>(null)
const activeLayerId = ref(1)
const infoWindows = ref<google.maps.InfoWindow[]>([])

onMounted(() => {
  if (!GOOGLE_MAPS_API_KEY) {
    mapError.value = 'Google Maps API key not configured. Showing simulated data.'
    return
  }

  const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY, version: 'weekly', libraries: ['places'] })
  loader.load().then(() => {
    mapLoaded.value = true
    initMap()
    loadPostData()
  }).catch(e => {
    console.error('Error loading Google Maps API:', e)
    mapError.value = 'Failed to load Google Maps. Showing simulated data.'
  })
})

const initMap = () => {
  const mapContainer = document.getElementById('map')
  if (!mapContainer) return

  const singaporeCenter = { lat: 1.3521, lng: 103.8198 }
  map.value = new google.maps.Map(mapContainer, {
    center: singaporeCenter,
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  })
}

const loadPostData = async () => {
  if (!map.value) return

  try {
    const allPosts = await getAllPosts()
    console.log('Loaded posts:', allPosts)

    clearAllMarkers()
    renderPostMarkers(allPosts)
    renderHotspots(allPosts)
    updateHotspotList()
  } catch (error) {
    console.error('Error loading posts:', error)
  }
}

const renderPostMarkers = (posts: any[]) => {
  posts.forEach((post, index) => {
    if (!post.latitude || !post.longitude || !map.value) return

    const marker = new google.maps.Marker({
      position: { lat: post.latitude, lng: post.longitude },
      map: map.value,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new google.maps.Size(20, 20)
      }
    })

    const infoWindowContent = document.createElement('div')
    infoWindowContent.innerHTML = `
      <div style="padding: 2px;">
        <p><strong>${ post.content.slice(0, 10) + (post.content.length>10?'...':'')}</strong></p>
        <p><strong>Coordinates:</strong> ${post.latitude.toFixed(5)}, ${post.longitude.toFixed(5)}</p>
        <button class="view-details-btn">View Details</button>
      </div>
    `
    const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent })

    marker.addListener('click', () => infoWindow.open(map.value, marker))

    const btn = infoWindowContent.querySelector('button.view-details-btn')
    if (btn) {
      btn.addEventListener('click', () => handlePostClick(post.id))
    }

    postMarkers.value.push(marker)
    infoWindows.value.push(infoWindow)
  })
}

const handlePostClick = (postId: number) => {
  const path = `/posts/${postId}`
  console.log('Navigating to:', path)
  router.push(path)
}

const renderHotspots = (posts: any[]) => {
  const hotspots = findHotPointsFromPosts(posts, 5)

  hotspots.forEach((hotspot, index) => {
    const circle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.2,
      map: map.value,
      center: { lat: hotspot.latitude, lng: hotspot.longitude },
      radius: 1000
    })

    circle.addListener('click', () => panToHotspot(hotspot))

    hotspotMarkers.value.push(circle)
  })
}

const updateHotspotList = () => {
  const coordinates:Coordinate[] = []
  for (let i = 0; i < postMarkers.value.length; i++) {
    const marker = postMarkers.value[i]
    const position = marker.getPosition()
    if (position) {
      coordinates.push({ latitude: position.lat(), longitude: position.lng() })
    }
  }

  const hotspots = findHotPointsFromPosts(coordinates.slice(0, 5))

  hotspotList.value = hotspots.map((coords, index) => ({ index: index + 1, coords }))
}

const panToHotspot = (coords: { latitude: number; longitude: number }) => {
  if (map.value) {
    map.value.panTo({ lat: coords.latitude, lng: coords.longitude })
    map.value.setZoom(14)
  }
}

const clearAllMarkers = () => {
  postMarkers.value.forEach(marker => marker.setMap(null))
  hotspotMarkers.value.forEach(circle => circle.setMap(null))
  infoWindows.value.forEach(win => win.close())
  postMarkers.value = []
  hotspotMarkers.value = []
  infoWindows.value = []
  hotspotList.value = []
}

const switchLayer = (categoryId: number) => {
  categories.value = categories.value.map(cat => ({ ...cat, active: cat.id === categoryId }))
  activeLayerId.value = categoryId
  clearAllMarkers()
  loadPostData()
}

onBeforeUnmount(() => {
  clearAllMarkers()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
    <!-- Weather Widget -->
    <div class="mb-6">
      <WeatherWidget />
    </div>

    <!-- Error message if map loading fails -->
    <div v-if="mapError" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">
            {{ mapError }}
            <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" class="font-medium underline text-yellow-700 hover:text-yellow-600">
              Learn how to set up Google Maps API
            </a>
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Sidebar -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Data Layers</h2>
        <div class="space-y-2">
          <button
            v-for="category in categories"
            :key="category.id"
            :class="[
              'w-full text-left px-4 py-2 rounded-md',
              category.active ? 'bg-health-primary text-white' : 'hover:bg-health-light'
            ]"
            @click="switchLayer(category.id)"
          >
            {{ category.name }}
          </button>
        </div>

        <div class="mt-8">
          <h3 class="text-lg font-semibold mb-2">Active Layer: {{ categories.find(c => c.active)?.name }}</h3>

          <!-- Post Location Legend -->
          <div class="space-y-2">
            <div class="flex items-center">
              <div class="flex-shrink-0 w-5 h-5 bg-no-repeat bg-center bg-contain mr-2" 
                   style="background-image: url('https://maps.google.com/mapfiles/ms/icons/blue-dot.png')"></div>
              <span>Post Location</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 rounded-full bg-red-500 mr-2 opacity-20 border border-red-500"></div>
              <span>Hotspot Area (K-Means Clustering)</span>
            </div>
          </div>
        </div>

        <!-- Hotspot Coordinates List moved to sidebar -->
        <div v-if="mapLoaded && hotspotList.length > 0" class="mt-8">
          <h3 class="text-lg font-semibold mb-4">Hotspot Coordinates</h3>
          <ul class="space-y-2">
            <li v-for="item in hotspotList" :key="item.index" class="flex items-center justify-between bg-gray-100 p-3 rounded-lg cursor-pointer hover:bg-gray-200">
              <span>{{ item.coords.latitude.toFixed(5) }}, {{ item.coords.longitude.toFixed(5) }}</span>
              <button 
                @click="panToHotspot(item.coords)"
                class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </li>
          </ul>
        </div>

        
      </div>

      <!-- Map Container -->
      <div class="md:col-span-3 bg-white p-4 rounded-lg shadow">
        <div id="map" class="h-[600px] rounded-lg"></div>
      </div>
    </div>
    
    <!-- Health Tips Section -->
    <div class="mt-10">
      <h2 class="text-2xl font-bold text-health-dark mb-6">Health Tips & Resources</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-health-primary/20 text-health-primary mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">COVID-19 Updates</h3>
          <p class="text-gray-600 mb-4">
            Stay informed about the latest COVID-19 measures, vaccination programs, and health advisories.
          </p>
          <a href="#" class="text-health-primary hover:text-health-primary/80 font-medium flex items-center">
            Learn more
            <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-health-secondary/20 text-health-secondary mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Wellness Programs</h3>
          <p class="text-gray-600 mb-4">
            Discover community wellness programs, fitness activities, and mental health resources.
          </p>
          <a href="#" class="text-health-primary hover:text-health-primary/80 font-medium flex items-center">
            Find programs
            <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center justify-center w-12 h-12 rounded-full bg-health-accent/20 text-health-accent mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Health Screening</h3>
          <p class="text-gray-600 mb-4">
            Learn about recommended health screenings and find affordable screening programs.
          </p>
          <a href="#" class="text-health-primary hover:text-health-primary/80 font-medium flex items-center">
            Check eligibility
            <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <p class="text-sm text-gray-600">
        Data provided by Singapore Government APIs, Google Maps, and simulated for demonstration purposes.
      </p>
    </div>
  </div>
</template>

<style>
#map {
  position: relative;
  z-index: 1;
}

.info-window-button {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
</style>