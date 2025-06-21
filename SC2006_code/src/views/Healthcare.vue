<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

// We'll use a placeholder for the API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAyoeuhTGg7f62-aQYELMdVcV0zYCx8W6s'

interface Facility {
  id: number
  name: string
  type: string
  location: { lat: number, lng: number }
  address: string
  phone: string
  specialties?: string[]
}

const facilities = ref<Facility[]>([
  {
    id: 1,
    name: 'Singapore General Hospital',
    type: 'Hospital',
    location: { lat: 1.2789, lng: 103.8336 },
    address: 'Outram Road, Singapore 169608',
    phone: '+65 6222 3322',
    specialties: ['General Medicine', 'Cardiology', 'Oncology']
  },
  {
    id: 2,
    name: 'Tan Tock Seng Hospital',
    type: 'Hospital',
    location: { lat: 1.3217, lng: 103.8470 },
    address: '11 Jalan Tan Tock Seng, Singapore 308433',
    phone: '+65 6256 6011',
    specialties: ['General Surgery', 'Neurology', 'Infectious Diseases']
  },
  {
    id: 3,
    name: 'KK Women\'s and Children\'s Hospital',
    type: 'Hospital',
    location: { lat: 1.3103, lng: 103.8451 },
    address: '100 Bukit Timah Road, Singapore 229899',
    phone: '+65 6225 5554',
    specialties: ['Obstetrics', 'Gynecology', 'Pediatrics']
  },
  {
    id: 4,
    name: 'Clementi Polyclinic',
    type: 'Polyclinic',
    location: { lat: 1.3151, lng: 103.7649 },
    address: 'Blk 451 Clementi Ave 3, Singapore 120451',
    phone: '+65 6872 7088'
  },
  {
    id: 5,
    name: 'Changi General Hospital',
    type: 'Hospital',
    location: { lat: 1.3404, lng: 103.9490 },
    address: '2 Simei Street 3, Singapore 529889',
    phone: '+65 6788 8833',
    specialties: ['General Medicine', 'Orthopedics', 'Gastroenterology']
  },
  {
    id: 6,
    name: 'National University Hospital',
    type: 'Hospital',
    location: { lat: 1.2944, lng: 103.7833 },
    address: '5 Lower Kent Ridge Road, Singapore 119074',
    phone: '+65 6779 5555',
    specialties: ['General Medicine', 'Pediatrics', 'Oncology']
  },
  {
    id: 7,
    name: 'Ang Mo Kio Polyclinic',
    type: 'Polyclinic',
    location: { lat: 1.3702, lng: 103.8452 },
    address: 'Blk 723 Ang Mo Kio Ave 8, Singapore 560723',
    phone: '+65 6355 3000'
  },
  {
    id: 8,
    name: 'Bedok Polyclinic',
    type: 'Polyclinic',
    location: { lat: 1.3252, lng: 103.9303 },
    address: '11 Bedok North Street 1, Heartbeat@Bedok #02-01, Singapore 469662',
    phone: '+65 6343 1121'
  }
])

const selectedFacility = ref<Facility | null>(null)
const map = ref<google.maps.Map | null>(null)
const markers = ref<google.maps.Marker[]>([])
const infoWindow = ref<google.maps.InfoWindow | null>(null)
const mapError = ref<string | null>(null)
const searchQuery = ref('')
const filteredFacilities = ref<Facility[]>([])
const facilityTypes = ref([
  { id: 'all', name: 'All Facilities', active: true },
  { id: 'hospital', name: 'Hospitals', active: false },
  { id: 'polyclinic', name: 'Polyclinics', active: false }
])
const activeTypeId = ref('all')

// Filter facilities based on search query and type
const filterFacilities = () => {
  const query = searchQuery.value.toLowerCase()
  const type = activeTypeId.value
  
  filteredFacilities.value = facilities.value.filter(facility => {
    const matchesQuery = facility.name.toLowerCase().includes(query) || 
                         facility.address.toLowerCase().includes(query)
    const matchesType = type === 'all' || 
                        facility.type.toLowerCase() === type.toLowerCase()
    
    return matchesQuery && matchesType
  })
}

// Watch for changes in search query or active type
const updateFilters = () => {
  filterFacilities()
  updateMarkers()
}

// Load Google Maps
onMounted(() => {
  // Initialize filtered facilities
  filteredFacilities.value = [...facilities.value]
  
  // If no API key is provided, show example data without loading Google Maps
  if (!GOOGLE_MAPS_API_KEY) {
    mapError.value = 'Google Maps API key not configured. Showing simulated data.'
    // We'll still initialize a basic map container for demonstration
    setTimeout(() => {
      initFallbackMap()
    }, 100)
    return
  }

  const loader = new Loader({
    apiKey: GOOGLE_MAPS_API_KEY,
    version: 'weekly',
    libraries: ['places']
  })

  loader.load().then(() => {
    initMap()
  }).catch(e => {
    console.error('Error loading Google Maps API:', e)
    mapError.value = 'Failed to load Google Maps. Showing simulated data.'
    initFallbackMap()
  })
})

onBeforeUnmount(() => {
  // Clean up map instance when component is destroyed
  if (map.value) {
    // Clean up event listeners if needed
  }
})

const initFallbackMap = () => {
  // Create a fallback map container with simulated data
  const mapContainer = document.getElementById('healthcare-map')
  if (!mapContainer) return
  
  mapContainer.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full bg-gray-100 rounded-lg">
      <div class="text-center p-6 max-w-md">
        <h3 class="text-xl font-semibold text-health-primary mb-4">Healthcare Facilities</h3>
        <p class="mb-4">Showing simulated healthcare facility data for Singapore.</p>
        <div class="bg-white p-4 rounded shadow-sm">
          <p class="font-medium">Available facilities:</p>
          <ul class="list-disc list-inside mt-2">
            ${facilities.value.map(f => `<li>${f.name} (${f.type})</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  `
}

const initMap = () => {
  // Check if map container exists
  const mapContainer = document.getElementById('healthcare-map')
  if (!mapContainer) return
  
  // Singapore coordinates
  const singaporeCenter = { lat: 1.3521, lng: 103.8198 }
  
  // Initialize Google Map
  map.value = new google.maps.Map(mapContainer, {
    center: singaporeCenter,
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_RIGHT,
    },
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
    },
    scaleControl: true,
    streetViewControl: true,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM,
    },
    fullscreenControl: true
  })
  
  // Create a single info window to reuse
  infoWindow.value = new google.maps.InfoWindow()
  
  // Add markers for each facility
  addFacilityMarkers()
}

const addFacilityMarkers = () => {
  if (!map.value) return
  
  // Clear existing markers
  markers.value.forEach(marker => {
    marker.setMap(null)
  })
  markers.value = []
  
  // Add markers for each facility
  filteredFacilities.value.forEach(facility => {
    if (!map.value) return
    
    // Create custom marker icon based on facility type
    const icon = {
      url: facility.type === 'Hospital' 
        ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      scaledSize: new google.maps.Size(32, 32)
    }
    
    const marker = new google.maps.Marker({
      position: facility.location,
      map: map.value,
      title: facility.name,
      icon: icon,
      animation: google.maps.Animation.DROP
    })
    
    // Create info window content
    const contentString = `
      <div class="p-2">
        <h3 class="font-bold text-lg">${facility.name}</h3>
        <p class="text-sm text-gray-600">${facility.type}</p>
        <p class="text-sm mt-1">${facility.address}</p>
        <p class="text-sm mt-1">${facility.phone}</p>
        ${facility.specialties ? 
          `<div class="mt-2">
            <p class="font-medium text-sm">Specialties:</p>
            <ul class="list-disc list-inside text-sm">
              ${facility.specialties.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>` : ''
        }
      </div>
    `
    
    // Add click event to show info window
    marker.addListener('click', () => {
      if (infoWindow.value && map.value) {
        infoWindow.value.setContent(contentString)
        infoWindow.value.open({
          anchor: marker,
          map: map.value
        })
        selectFacility(facility)
      }
    })
    
    markers.value.push(marker)
  })
}

const updateMarkers = () => {
  // Update markers based on filtered facilities
  addFacilityMarkers()
  
  // If there's a selected facility that's no longer in the filtered list, clear selection
  if (selectedFacility.value && !filteredFacilities.value.some(f => f.id === selectedFacility.value?.id)) {
    selectedFacility.value = null
  }
}

const selectFacility = (facility: Facility) => {
  selectedFacility.value = facility
  
  if (map.value) {
    // Center map on selected facility
    map.value.setCenter(facility.location)
    map.value.setZoom(15)
    
    // Find the marker for this facility and open its info window
    const marker = markers.value.find(m => m.getTitle() === facility.name)
    if (marker && infoWindow.value) {
      const contentString = `
        <div class="p-2">
          <h3 class="font-bold text-lg">${facility.name}</h3>
          <p class="text-sm text-gray-600">${facility.type}</p>
          <p class="text-sm mt-1">${facility.address}</p>
          <p class="text-sm mt-1">${facility.phone}</p>
          ${facility.specialties ? 
            `<div class="mt-2">
              <p class="font-medium text-sm">Specialties:</p>
              <ul class="list-disc list-inside text-sm">
                ${facility.specialties.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>` : ''
          }
        </div>
      `
      
      infoWindow.value.setContent(contentString)
      infoWindow.value.open({
        anchor: marker,
        map: map.value
      })
    }
  }
}

const filterByType = (typeId: string) => {
  // Update active type
  facilityTypes.value = facilityTypes.value.map(type => ({
    ...type,
    active: type.id === typeId
  }))
  
  activeTypeId.value = typeId
  updateFilters()
}

const getDirections = (facility: Facility) => {
  // Open Google Maps directions in a new tab
  const destination = `${facility.location.lat},${facility.location.lng}`
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank')
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Facilities List -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Healthcare Facilities</h2>
        
        <!-- Search and Filter -->
        <div class="mb-4">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search facilities..."
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
              @input="updateFilters"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <!-- Facility Type Filter -->
        <div class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="type in facilityTypes"
            :key="type.id"
            :class="[
              'px-3 py-1 text-sm rounded-full',
              type.active
                ? 'bg-health-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
            @click="filterByType(type.id)"
          >
            {{ type.name }}
          </button>
        </div>
        
        <!-- Facilities List -->
        <div class="space-y-2 max-h-[400px] overflow-y-auto">
          <button
            v-for="facility in filteredFacilities"
            :key="facility.id"
            class="w-full text-left p-4 rounded-md hover:bg-health-light transition-colors"
            :class="{ 'bg-health-light': selectedFacility?.id === facility.id }"
            @click="selectFacility(facility)"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0 mt-1">
                <div 
                  class="w-3 h-3 rounded-full" 
                  :class="facility.type === 'Hospital' ? 'bg-red-500' : 'bg-blue-500'"
                ></div>
              </div>
              <div class="ml-3">
                <h3 class="font-medium">{{ facility.name }}</h3>
                <p class="text-sm text-gray-500">{{ facility.type }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ facility.address }}</p>
              </div>
            </div>
          </button>
        </div>
        
        <!-- Legend -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <h3 class="text-sm font-medium mb-2">Legend</h3>
          <div class="flex items-center mb-1">
            <div class="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span class="text-sm">Hospital</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span class="text-sm">Polyclinic</span>
          </div>
        </div>
      </div>

      <!-- Map and Facility Details -->
      <div class="md:col-span-2 space-y-6">
        <!-- Map -->
        <div class="bg-white p-4 rounded-lg shadow">
          <div id="healthcare-map" class="h-[400px] rounded-lg"></div>
        </div>

        <!-- Facility Details -->
        <div v-if="selectedFacility" class="bg-white p-6 rounded-lg shadow">
          <div class="flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-bold mb-1">{{ selectedFacility.name }}</h2>
              <div class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                :class="selectedFacility.type === 'Hospital' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'">
                {{ selectedFacility.type }}
              </div>
            </div>
            <button 
              @click="getDirections(selectedFacility)"
              class="btn btn-primary flex items-center"
            >
              <svg class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </button>
          </div>
          
          <div class="mt-4 space-y-4">
            <div>
              <h3 class="text-lg font-semibold mb-2">Contact Information</h3>
              <p class="text-gray-600">{{ selectedFacility.address }}</p>
              <p class="text-gray-600">{{ selectedFacility.phone }}</p>
            </div>
            
            <div v-if="selectedFacility.specialties">
              <h3 class="text-lg font-semibold mb-2">Specialties</h3>
              <ul class="list-disc list-inside text-gray-600">
                <li v-for="specialty in selectedFacility.specialties" :key="specialty">
                  {{ specialty }}
                </li>
              </ul>
            </div>
            
            <div>
              <h3 class="text-lg font-semibold mb-2">Services</h3>
              <div class="grid grid-cols-2 gap-2">
                <div class="bg-health-light p-2 rounded text-sm">
                  <span class="font-medium">Emergency Services</span>
                  <span v-if="selectedFacility.type === 'Hospital'" class="ml-2 text-green-600">✓</span>
                  <span v-else class="ml-2 text-red-600">✗</span>
                </div>
                <div class="bg-health-light p-2 rounded text-sm">
                  <span class="font-medium">Outpatient Care</span>
                  <span class="ml-2 text-green-600">✓</span>
                </div>
                <div class="bg-health-light p-2 rounded text-sm">
                  <span class="font-medium">Lab Services</span>
                  <span class="ml-2 text-green-600">✓</span>
                </div>
                <div class="bg-health-light p-2 rounded text-sm">
                  <span class="font-medium">Pharmacy</span>
                  <span class="ml-2 text-green-600">✓</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="text-lg font-semibold mb-2">Operating Hours</h3>
              <div class="grid grid-cols-2 gap-x-4 text-sm">
                <div>
                  <p class="font-medium">Weekdays</p>
                  <p class="text-gray-600">8:30 AM - 5:30 PM</p>
                </div>
                <div>
                  <p class="font-medium">Weekends</p>
                  <p v-if="selectedFacility.type === 'Hospital'" class="text-gray-600">24 hours</p>
                  <p v-else class="text-gray-600">8:30 AM - 12:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- No Selection State -->
        <div v-else class="bg-white p-6 rounded-lg shadow text-center">
          <svg class="h-12 w-12 text-health-primary mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 class="mt-2 text-lg font-medium text-health-dark">Select a facility</h3>
          <p class="mt-1 text-sm text-gray-500">
            Click on a healthcare facility from the list or on the map to view detailed information.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Ensure the map container has proper z-index */
#healthcare-map {
  position: relative;
  z-index: 1;
}
</style>