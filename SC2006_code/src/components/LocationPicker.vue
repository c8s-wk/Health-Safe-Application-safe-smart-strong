<!-- LocationPicker.vue -->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

const props = defineProps({
  modelValue: {
    type: Object as () => { lat: number; lng: number } | null,
    default: null
  },
  apiKey: {
    type: String,
    required: true
  },
  defaultCenter: {
    type: Object as () => { lat: number; lng: number },
    default: () => ({ lat: 1.3521, lng: 103.8198 }) // 新加坡默认位置
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const map = ref<google.maps.Map | null>(null)
const marker = ref<google.maps.Marker | null>(null)
const mapLoaded = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)

// 初始化地图
const initializeMap = async () => {
  try {
    const loader = new Loader({
      apiKey: props.apiKey,
      version: 'weekly',
      libraries: ['places']
    })

    await loader.load()
    
    const mapElement = document.getElementById('map')
    if (!mapElement) return

    // 创建地图实例
    map.value = new google.maps.Map(mapElement, {
      center: props.modelValue || props.defaultCenter,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER
      }
    })

    // 初始化标记
    if (props.modelValue) {
      createMarker(props.modelValue)
    }

    // 添加地图点击事件
    map.value.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        updatePosition({
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        })
      }
    })

    mapLoaded.value = true
    loading.value = false
  } catch (err) {
    error.value = '无法加载Google地图'
    loading.value = false
    console.error('地图初始化失败:', err)
  }
}

// 创建标记
const createMarker = (position: { lat: number; lng: number }) => {
  if (marker.value) {
    marker.value.setMap(null)
  }
  
  marker.value = new google.maps.Marker({
    position,
    map: map.value,
    draggable: true
  })

  // 添加标记拖动事件
  marker.value.addListener('dragend', (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      updatePosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      })
    }
  })
}

// 更新位置
const updatePosition = (position: { lat: number; lng: number }) => {
  emit('update:modelValue', position)
  createMarker(position)
  if (map.value) {
    map.value.panTo(position)
  }
}

// 获取当前位置
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updatePosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (err) => {
        error.value = '无法获取当前位置'
        console.error('定位失败:', err)
      }
    )
  } else {
    error.value = '浏览器不支持定位功能'
  }
}

// 确认选择
const confirmSelection = () => {
  if (props.modelValue) {
    emit('confirm', props.modelValue)
  }
}

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  if (newVal && map.value) {
    map.value.panTo(newVal)
    createMarker(newVal)
  }
})

onMounted(initializeMap)
</script>

<template>
  <div class="location-picker">
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">地图加载中...</div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- 地图容器 -->
    <div v-show="mapLoaded" class="map-container">
      <div id="map" class="map-element"></div>
      
      <div class="control-panel">
        <button 
          type="button"
          class="control-button"
          @click="getCurrentLocation"
          title="Use Current Location"
        >
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06c-4.17.46-7.48 3.77-7.94 7.94H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
          </svg>
        </button>
        
        <!-- <button 
          type="button"
          class="control-button confirm-button"
          :disabled="!modelValue"
          @click="confirmSelection"
        >
          Confirm Location
        </button> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-picker {
  position: relative;
  height: 400px;
  z-index: auto; /* 修复堆叠上下文 */
}

.map-container {
  position: relative;
  height: 100%;
}

.map-element {
  height: 100%;
  width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 新增地图容器层级控制 */
::v-deep .gm-style {
  z-index: 0;
  position: relative;
}

.control-panel {
  z-index: 1000; /* 确保高于地图 */
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 12px;
  color: #666;
}

.error-message {
  padding: 20px;
  color: #e74c3c;
  background: #f8d7da;
  border-radius: 4px;
  margin: 10px;
}

.control-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.control-button {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.control-button:hover {
  background: #f8f9fa;
  border-color: #ccc;
}

.control-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-button {
  background: #3498db;
  color: white;
  border-color: transparent;
}

.confirm-button:hover {
  background: #2980b9;
}

.icon {
  width: 20px;
  height: 20px;
  fill: #555;
}
</style>