<!-- ADMINUserManagementView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { searchProfileByName, changeUserTypeByUserId } from '../services/apiProfile.ts'
import { useUserStore } from '../stores/userStore.ts'
import type { Ref } from 'vue'
import type { Profile } from '../services/apiProfile.ts'

const profiles: Ref<Profile[]> = ref([])

const selectedTypes = ref<{ [key: string]: Profile['type'] }>({})
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    profiles.value = await searchProfileByName('') // 获取所有用户
    profiles.value.forEach(profile => {
      selectedTypes.value[profile.user_id] = profile.type
    })
    profiles.value = profiles.value.filter(profile => profile.type === 'NORMAL' || profile.type === 'RESTRICTED' || profile.type ==='MODERATOR') // 只显示 NORMAL 和 RESTRICTED 用户
    profiles.value.forEach(profile => {
      selectedTypes.value[profile.user_id] = profile.type
    })
    profiles.value.sort((a, b) => a.type.localeCompare(b.type)) // 按用户名排序
  } catch (e) {
    error.value = (e as Error).message
  }
})

const updateType = async (userId: string) => {
  try {
    const selfId = useUserStore().user?.id
    if (userId === selfId) {
      alert('Cannot change your usertype！')
      return
    }

    loading.value = true
    await changeUserTypeByUserId(userId, selectedTypes.value[userId])
    alert('usertype is updated')
  } catch (e) {
    alert('failed to change usertype：' + (e as Error).message)
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">User Management</h1>
    <div v-if="error">{{ error }}</div>
    <div v-if="loading">loading...</div>
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>User Type</th>
          <th>Change Type</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="profile in profiles" :key="profile.user_id">
          <td>{{ profile.name }}</td>
          <td>{{ profile.type }}</td>
          <td>
            <select v-model="selectedTypes[profile.user_id]">
              <option value="NORMAL">NORMAL</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="RESTRICTED">RESTRICTED</option>
            </select>
            <button @click="updateType(profile.user_id)">Submit</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>