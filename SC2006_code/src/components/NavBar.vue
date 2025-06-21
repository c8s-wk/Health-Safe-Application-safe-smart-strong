<template>
  <nav class="bg-health-primary">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <RouterLink to="/" class="text-white text-xl font-bold">SG Health Portal</RouterLink>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <RouterLink
                to="/"
                class="text-white hover:bg-health-primary/80 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </RouterLink>

              <RouterLink
                to="/posts"
                class="text-white hover:bg-health-primary/80 px-3 py-2 rounded-md text-sm font-medium"
              >
                Posts
              </RouterLink>

              <!-- News Dropdown -->
              <div class="relative" ref="newsDropdownRef">
                <button 
                  @click="toggleNewsDropdown"
                  class="text-white hover:bg-health-primary/80 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  News
                  <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown Options -->
                <div 
                  v-if="showNewsDropdown"
                  class="absolute z-50 mt-2 w-48 bg-health-primary/80 rounded-md shadow-lg py-1"
                >
                  <RouterLink
                    to="/healthcare"
                    class="block px-4 py-2 text-sm font-medium text-white hover:bg-health-primary/60 transition-colors duration-200"
                  >
                    Healthcare Facilities
                  </RouterLink>
                  <RouterLink
                    to="/blog"
                    class="block px-4 py-2 text-sm font-medium text-white hover:bg-health-primary/60 transition-colors duration-200"
                  >
                    Health Blog
                  </RouterLink>
                </div>
              </div>

              

              <!-- 管理按钮（仅 MODERATOR/ADMIN 可见） -->
              <div v-if="userRole && ['MODERATOR', 'ADMIN'].includes(userRole)" class="relative" ref="managementDropdownRef">
                <button 
                  @click="toggleManagementDropdown"
                  class="text-white hover:bg-health-primary/80 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  Management
                  <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- 下拉选项 -->
                <div 
                  v-if="showManagementDropdown"
                  class="absolute z-50 mt-2 w-48 bg-health-primary/80 rounded-md shadow-lg py-1 right-0"
                >
                  <!-- 管理员和版主共有的菜单项 -->
                  <RouterLink
                    v-if="userRole && ['MODERATOR', 'ADMIN'].includes(userRole)"
                    to="/reports"
                    class="block px-4 py-2 text-sm font-medium text-white hover:bg-health-primary/60 transition-colors duration-200"
                  >
                    Reports Management
                  </RouterLink>

                  <!-- 管理员专属菜单项 -->
                  <RouterLink
                    v-if="userRole && ['ADMIN'].includes(userRole)"
                    to="/manage-usertype"
                    class="block px-4 py-2 text-sm font-medium text-white hover:bg-health-primary/60 transition-colors duration-200"
                  >
                    User Management
                  </RouterLink>

                  <!-- 版主专属菜单项 -->
                  <RouterLink
                    v-if="userRole && ['MODERATOR'].includes(userRole)"
                    to="/manage-usertype-moderator"
                    class="block px-4 py-2 text-sm font-medium text-white hover:bg-health-primary/60 transition-colors duration-200"
                  >
                    User Management (Moderator)
                  </RouterLink>
                </div>
              </div>

              <!-- Alert Button -->
              <div class="relative" ref="alertDropdownRef" margin-right="20px">
                <button 
                  @click="toggleAlertDropdown"
                  class="text-white hover:bg-health-primary/80 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                
                </button>

                <!-- Alert Dropdown -->
                <div 
                  v-if="showAlertDropdown"
                  class="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg py-1 z-50"
                >
                  <div class="px-4 py-2 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">Recent Alerts</h3>
                  </div>
                  <div class="max-h-96 overflow-y-auto">
                    <AlertHistory />
                  </div>
                  <div class="px-4 py-2 border-t border-gray-200">
                    <RouterLink 
                      to="/alerts"
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      @click="closeAlertDropdown"
                    >
                      View All Alerts
                    </RouterLink>
                  </div>
                  <!-- ✅ new：只有 MODERATOR, ADMIN 可见的 Send Alerts 按钮 -->
                  <div 
                    v-if="userRole === 'ADMIN'|| userRole === 'MODERATOR'"
                    class="px-4 py-2 border-t border-gray-200"
                  >
                    <RouterLink 
                      to="/send-alerts"
                      class="text-red-600 hover:text-red-800 text-sm font-medium"
                      @click="closeAlertDropdown"
                    >
                      Send Alerts
                    </RouterLink>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        <div class="hidden md:block">
          <template v-if="userStore.user">
            <div class="flex items-center space-x-4">
              <RouterLink
                to="/profile"
                class="text-white hover:bg-health-primary/80 px-3 py-2 rounded-md text-sm font-medium"
                :title="userProfileName ?? undefined"
                >
                {{ userProfileName }}
              </RouterLink>

              <button
                @click="handleLogout"
                class="btn bg-health-secondary text-white hover:bg-health-secondary/90"
              >
                Sign Out
              </button>
              
            </div>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="btn bg-health-secondary text-white hover:bg-health-secondary/90"
            >
              Sign In
            </RouterLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { RouterLink } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { getProfileByUserId,getProfile,Profile } from '../services/apiProfile'; // 引入 getProfileByUserId 函数
import { useRouter } from 'vue-router';
import AlertHistory from './AlertHistory.vue';

const userStore = useUserStore();
const router = useRouter()
const userProfileName = ref<string | null>(null);
const userRole = ref<string | null>(null);

const showAlertDropdown = ref(false)
const alertDropdownRef = ref(null);

const showManagementDropdown = ref(false)
const managementDropdownRef = ref(null);

const showNewsDropdown = ref(false)
const newsDropdownRef = ref(null);

const toggleNewsDropdown = () => {
  showNewsDropdown.value = !showNewsDropdown.value
}

const closeNewsDropdown = () => {
  showNewsDropdown.value = false
}

const toggleManagementDropdown = () => {
  showManagementDropdown.value = !showManagementDropdown.value
}

const closeManagementDropdown = () => {
  showManagementDropdown.value = false
}

const handleClickOutsideDropdown = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (managementDropdownRef.value && !(managementDropdownRef.value as HTMLElement).contains(target)) {
    showManagementDropdown.value = false
  }
  if (newsDropdownRef.value && !(newsDropdownRef.value as HTMLElement).contains(target)) {
    showNewsDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutsideDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideDropdown)
})

const fetchUserProfileName = async () => {
  try {
    const profileData:Profile = await getProfile();
    if (profileData) {
      userProfileName.value = profileData.name;
      userRole.value = profileData.type || null;
      console.log(profileData);
    } else {
      userProfileName.value = null;
      userRole.value = null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
  
};

const toggleAlertDropdown = () => {
  showAlertDropdown.value = !showAlertDropdown.value
}

const closeAlertDropdown = () => {
  showAlertDropdown.value = false
}

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (alertDropdownRef.value && !(alertDropdownRef.value as HTMLElement).contains(target)) {
    showAlertDropdown.value = false;
  }
}

const handleLogout = async () => {
  await userStore.logoutUser();
  userProfileName.value = null;
  userRole.value = null;
  router.push('/'); 
};

onMounted(async () => {
  // 页面加载时获取用户信息
  await fetchUserProfileName();

  // 监听 userStore 的 user 状态变化
  watch(() => userStore.user, async (newUser) => {
    if (newUser) {
      await fetchUserProfileName();
    } else {
      userProfileName.value = null;
    }
  });

  // Add click outside listener
  document.addEventListener('click', handleClickOutside);
});

// Clean up event listener
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.router-link-active {
  color: #ffffff;
  font-weight: 600;
}
</style>