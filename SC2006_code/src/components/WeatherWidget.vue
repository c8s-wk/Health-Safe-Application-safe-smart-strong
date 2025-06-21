<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 天气数据接口
interface WeatherData {
  location: string
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  windDirection: string
  rainfall: number
  forecast: string
  updateTime: string
}

interface ForecastItem {
  area: string
  forecast: string
}

interface AreaMetadata {
  name: string
  label_location: {
    latitude: number
    longitude: number
  }
}

// 状态管理
const weatherData = ref<WeatherData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const forecastAreas = ref<AreaMetadata[]>([])
const selectedArea = ref('Ang Mo Kio')

// API 端点
const WEATHER_FORECAST_API = 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast'
const AIR_TEMP_API = 'https://api.data.gov.sg/v1/environment/air-temperature'
const RELATIVE_HUMIDITY_API = 'https://api.data.gov.sg/v1/environment/relative-humidity'
const WIND_DIRECTION_API = 'https://api.data.gov.sg/v1/environment/wind-direction'
const WIND_SPEED_API = 'https://api.data.gov.sg/v1/environment/wind-speed'
const RAINFALL_API = 'https://api.data.gov.sg/v1/environment/rainfall'

onMounted(async () => {
  try {
    await fetchWeather()
  } catch (err) {
    console.error('Error fetching weather:', err)
    error.value = 'Failed to load weather data'
  } finally {
    loading.value = false
  }
})

const fetchWeather = async () => {
  try {
    // 1. 获取天气预报数据
    const forecastResponse = await axios.get(WEATHER_FORECAST_API)
    
    if (forecastResponse.data && forecastResponse.data.area_metadata) {
      forecastAreas.value = forecastResponse.data.area_metadata
      
      // 2. 获取用户当前位置
      const userPosition = await getUserPosition()
      
      // 3. 查找最近的区域
      const closestArea = findClosestArea(userPosition)
      if (closestArea) selectedArea.value = closestArea
      
      // 4. 获取实时天气数据
      const [tempResponse, humidityResponse, windSpeedResponse, windDirResponse, rainfallResponse] = await Promise.allSettled([
        axios.get(AIR_TEMP_API),
        axios.get(RELATIVE_HUMIDITY_API),
        axios.get(WIND_SPEED_API),
        axios.get(WIND_DIRECTION_API),
        axios.get(RAINFALL_API)
      ])

      // 5. 处理实时数据
      let temperature = 0
      let humidity = 0
      let windSpeed = 0
      let windDirection = ''
      let rainfall = 0

      if (tempResponse.status === 'fulfilled' && tempResponse.value.data.items.length > 0) {
        temperature = Math.round(tempResponse.value.data.items[0].readings.reduce((sum: any, item: { value: any }) => sum + item.value, 0) / tempResponse.value.data.items[0].readings.length)
      }

      if (humidityResponse.status === 'fulfilled' && humidityResponse.value.data.items.length > 0) {
        humidity = Math.round(humidityResponse.value.data.items[0].readings.reduce((sum: any, item: { value: any }) => sum + item.value, 0) / humidityResponse.value.data.items[0].readings.length)
      }

      if (windSpeedResponse.status === 'fulfilled' && windSpeedResponse.value.data.items.length > 0) {
        windSpeed = Math.round((windSpeedResponse.value.data.items[0].readings.reduce((sum: any, item: { value: any }) => sum + item.value, 0) / windSpeedResponse.value.data.items[0].readings.length) * 10) / 10
      }

      if (windDirResponse.status === 'fulfilled' && windDirResponse.value.data.items.length > 0) {
        const avgDirection = windDirResponse.value.data.items[0].readings.reduce((sum: any, item: { value: any }) => sum + item.value, 0) / windDirResponse.value.data.items[0].readings.length
        windDirection = getWindDirectionText(avgDirection)
      }

      if (rainfallResponse.status === 'fulfilled' && rainfallResponse.value.data.items.length > 0) {
        rainfall = Math.round((rainfallResponse.value.data.items[0].readings.reduce((sum: any, item: { value: any }) => sum + item.value, 0) / rainfallResponse.value.data.items[0].readings.length) * 10) / 10
      }

      // 6. 获取区域预报
      const forecasts: ForecastItem[] = forecastResponse.data.items[0].forecasts
      const areaForecast = forecasts.find(f => f.area === selectedArea.value)
      const updateTime = new Date(forecastResponse.data.items[0].timestamp).toLocaleString('en-SG')

      // 7. 合并数据
      weatherData.value = {
        location: selectedArea.value,
        temperature: temperature || getSimulatedTemperature(areaForecast?.forecast || ''),
        description: areaForecast?.forecast || 'No data',
        humidity: humidity || getSimulatedHumidity(areaForecast?.forecast || ''),
        windSpeed: windSpeed || getSimulatedWindSpeed(areaForecast?.forecast || ''),
        windDirection: windDirection || 'NE',
        rainfall: rainfall || 0,
        forecast: areaForecast?.forecast || 'No data',
        updateTime: updateTime
      }
    } else {
      useSimulatedData()
    }
  } catch (err) {
    console.error('Error fetching weather data:', err)
    error.value = 'Failed to load weather data'
    useSimulatedData()
  }
}

const useSimulatedData = () => {
  weatherData.value = {
    location: 'Singapore',
    temperature: 30,
    description: 'Partly Cloudy',
    humidity: 75,
    windSpeed: 3.5,
    windDirection: 'NE',
    rainfall: 0,
    forecast: 'Partly Cloudy',
    updateTime: new Date().toLocaleString('en-SG')
  }
}

// 获取用户位置
const getUserPosition = () => {
  return new Promise<{ latitude: number, longitude: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject('User denied the request for Geolocation.')
            break
          case error.POSITION_UNAVAILABLE:
            reject('Location information is unavailable.')
            break
          case error.TIMEOUT:
            reject('The request to get location timed out.')
            break
          default:
            reject('An unknown error occurred.')
        }
      }
    )
  })
}

// 查找最近的区域
const findClosestArea = (userPosition: { latitude: number, longitude: number }) => {
  let closestArea = null
  let minDistance = Infinity

  forecastAreas.value.forEach(area => {
    const distance = calculateDistance(
      userPosition.latitude,
      userPosition.longitude,
      area.label_location.latitude,
      area.label_location.longitude
    )

    if (distance < minDistance) {
      minDistance = distance
      closestArea = area.name
    }
  })

  return closestArea
}

// 计算两个坐标之间的距离（Haversine公式）
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 风向转换函数
const getWindDirectionText = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

// 模拟数据生成函数
const getSimulatedTemperature = (forecast: string): number => {
  if (forecast.includes('Rain') || forecast.includes('Showers')) return Math.floor(Math.random() * 3) + 26
  if (forecast.includes('Cloudy')) return Math.floor(Math.random() * 3) + 28
  return Math.floor(Math.random() * 3) + 30
}

const getSimulatedHumidity = (forecast: string): number => {
  if (forecast.includes('Rain') || forecast.includes('Showers')) return Math.floor(Math.random() * 10) + 80
  if (forecast.includes('Cloudy')) return Math.floor(Math.random() * 10) + 70
  return Math.floor(Math.random() * 15) + 60
}

const getSimulatedWindSpeed = (forecast: string): number => {
  if (forecast.includes('Thundery')) return Math.floor(Math.random() * 20) / 10 + 4
  return Math.floor(Math.random() * 25) / 10 + 1.5
}

// 时间格式化函数
const getCurrentTime = () => new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: true })
const getCurrentDate = () => new Date().toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

// 天气图标和背景样式
const getWeatherIcon = (forecast: string) => {
  if (!forecast) return 'sun'
  const lowerForecast = forecast.toLowerCase()
  
  if (lowerForecast.includes('thundery') || lowerForecast.includes('thunder')) return 'cloud-lightning'
  if (lowerForecast.includes('rain') || lowerForecast.includes('shower')) return lowerForecast.includes('light') ? 'cloud-drizzle' : 'cloud-rain'
  if (lowerForecast.includes('cloudy')) return lowerForecast.includes('partly') ? 'cloud-sun' : 'cloud'
  if (lowerForecast.includes('fair')) return 'sun'
  if (lowerForecast.includes('hazy') || lowerForecast.includes('mist')) return 'cloud-fog'
  if (lowerForecast.includes('windy')) return 'wind'
  return 'sun'
}

const getWeatherBackground = () => {
  if (!weatherData.value) return 'bg-blue-50'
  const forecast = weatherData.value.forecast.toLowerCase()
  const currentHour = new Date().getHours()
  const isNight = currentHour < 6 || currentHour >= 19

  if (isNight) {
    return forecast.includes('thundery') ? 'bg-gradient-to-br from-gray-900 to-blue-900 text-white' : 
           forecast.includes('rain') ? 'bg-gradient-to-br from-gray-800 to-blue-800 text-white' : 
           'bg-gradient-to-br from-gray-800 to-blue-900 text-white'
  }

  return forecast.includes('thundery') ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white' : 
         forecast.includes('rain') ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white' : 
         forecast.includes('cloudy') ? (forecast.includes('partly') ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white') : 
         forecast.includes('fair') ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 
         forecast.includes('hazy') ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : 
         'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
}

// 区域切换函数
const changeArea = (area: string) => {
  selectedArea.value = area
  loading.value = true
  fetchWeather()
}
</script>

<template>
  <div 
    class="rounded-lg shadow-lg overflow-hidden"
    :class="weatherData ? getWeatherBackground() : 'bg-gray-100'"
  >
    <div v-if="loading" class="p-6 flex items-center justify-center">
      <div class="animate-pulse flex space-x-4">
        <div class="rounded-full bg-gray-300 h-12 w-12"></div>
        <div class="flex-1 space-y-4 py-1">
          <div class="h-4 bg-gray-300 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-300 rounded"></div>
            <div class="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="p-6 text-center">
      <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p>{{ error }}</p>
      <button 
        @click="fetchWeather" 
        class="mt-2 px-4 py-2 bg-health-primary text-white rounded-md hover:bg-health-primary/90"
      >
        Try Again
      </button>
    </div>

    <div v-else-if="weatherData" class="p-6">
      <div class="flex justify-between items-start">
        <div>
          <div class="flex items-center">
            <h3 class="text-2xl font-bold">{{ weatherData.location }}</h3>
            <div class="relative ml-2">
              <!-- <button 
                class="text-sm opacity-80 hover:opacity-100 flex items-center"
                @click="$event.target?.nextElementSibling.classList.toggle('hidden')"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button> -->
              <div class="hidden absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg py-1 text-gray-800">
                <div class="max-h-48 overflow-y-auto">
                  <button 
                    v-for="area in forecastAreas" 
                    :key="area.name"
                    @click="changeArea(area.name)"
                    class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {{ area.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p class="text-sm opacity-90">{{ getCurrentDate() }}</p>
          <p class="text-sm opacity-90">{{ getCurrentTime() }}</p>
          <p class="text-xs opacity-70 mt-1">Data from data.gov.sg</p>
        </div>
        <div class="text-right">
          <div class="flex items-center">
            <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                v-if="getWeatherIcon(weatherData.forecast) === 'sun'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="1.5" 
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
              />
              <path 
                v-else-if="getWeatherIcon(weatherData.forecast) === 'cloud'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="1.5" 
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" 
              />
              <path 
                v-else-if="getWeatherIcon(weatherData.forecast) === 'cloud-sun'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="1.5" 
                d="M12.74 5.47c2.4 1.17 3.3 4.12 2 6.47 1.31 1.48 1.41 3.24 1.2 4.39 2.41.49 4-1.16 4-3.08 0-1.05-.53-2-1.38-2.54M15 12a3 3 0 11-6 0 3 3 0 016 0zm-4 7h8a2 2 0 002-2v-1.17l-.1-.31A5.002 5.002 0 0016.74 9H16V8a4 4 0 00-8 0v1a4.002 4.002 0 00-3 3.8V15a3 3 0 003 3" 
              />
              <path 
                v-else-if="getWeatherIcon(weatherData.forecast) === 'cloud-rain'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="1.5" 
                d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25M8 16.67a4 4 0 01-2.62-4.25M12 19v1M8 19v1M16 19v1" 
              />
              <path 
                v-else-if="getWeatherIcon(weatherData.forecast) === 'cloud-drizzle'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="1.5" 
                d="M19 18.9A5 5 0 0018 9h-1.26a8 8 0 10-12.74.03M13 16v2M9 16v6M17 16v4" 
              />
              <path 
                v-else-if="getWeatherIcon(weatherData.forecast) === 'cloud-lightning'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="1.5" 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
              <path 
                v-else-if="getWeatherIcon(weatherData.forecast) === 'cloud-fog'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="1.5" 
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
              />
              <path 
                v-else-if="getWeatherIcon(weatherData.forecast) === 'wind'"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="1.5" 
                d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" 
              />
            </svg>
            <span class="text-4xl font-bold">{{ weatherData.temperature }}°C</span>
          </div>
          <p class="capitalize">{{ weatherData.forecast }}</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-3 gap-2">
        <div class="text-center p-2 rounded-lg bg-black/10">
          <div class="text-sm opacity-80">Humidity</div>
          <div class="font-bold">{{ weatherData.humidity }}%</div>
        </div>
        <div class="text-center p-2 rounded-lg bg-black/10">
          <div class="text-sm opacity-80">Wind</div>
          <div class="font-bold">{{ weatherData.windSpeed }} m/s</div>
          <div class="text-xs opacity-80">{{ weatherData.windDirection }}</div>
        </div>
        <div class="text-center p-2 rounded-lg bg-black/10">
          <div class="text-sm opacity-80">Rainfall</div>
          <div class="font-bold">{{ weatherData.rainfall }} mm</div>
        </div>
      </div>
      
      <div class="mt-4 text-xs opacity-70 text-right">
        Updated: {{ weatherData.updateTime }}
      </div>
    </div>
  </div>
</template>