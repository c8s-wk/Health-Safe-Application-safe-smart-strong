<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../supabase'

import { fetchAllReports, updateReportStatus, type Report } from '../services/apiReport'
import { deletePostById } from '../services/apiPost'

const reports = ref<Report[]>([])
const allReports = ref<Report[]>([])
const activeFilter = ref<'pending' | 'resolved' | 'all'>('pending')
const loading = ref(false)
const errorMessage = ref('')
const debugInfo = ref('')

const router = useRouter()

const loadReports = async () => {
  try {
    loading.value = true
    debugInfo.value = 'Attempting to load reports...'

    const data = await fetchAllReports()
    allReports.value = data || []
    filterReports()
    debugInfo.value = `Loaded ${allReports.value.length} reports from database`
  } catch (error) {
    errorMessage.value = 'Failed to load reports: ' + (error as Error).message
  } finally {
    loading.value = false
  }
}

const filterReports = () => {
  if (activeFilter.value === 'pending') {
    reports.value = allReports.value.filter(report => report.status === 'PENDING')
  } else if (activeFilter.value === 'resolved') {
    reports.value = allReports.value.filter(report => report.status === 'RESOLVED')
  } else {
    reports.value = [...allReports.value]
  }
}

const setFilter = (filter: 'pending' | 'resolved' | 'all') => {
  activeFilter.value = filter
  filterReports()
}

// 删除帖子并标记为已解决
const processReport = async (report: Report) => {
  const confirmAction = confirm(`Are you sure to delete the reported post (ID: ${report.post_id}) and mark the report as resolved?`)
  if (!confirmAction) return

  try {
    loading.value = true
    await deletePostById(report.post_id)
    if(report.id){
      await updateReportStatus(report.id, 'RESOLVED')
    }
    alert('Post deleted and report marked as resolved.')
    await loadReports()
  } catch (error) {
    console.error('Error processing report:', error)
    errorMessage.value = 'Error processing report: ' + (error as Error).message
  } finally {
    loading.value = false
  }
}

// 只标记为已解决
const markResolved = async (report: Report) => {
  const confirmAction = confirm(`Mark report #${report.id} as resolved without deleting the post?`)
  if (!confirmAction) return

  try {
    loading.value = true
    if (report.id) {
      await updateReportStatus(report.id,'RESOLVED')
      alert('Report marked as resolved.')
      await loadReports()
    }
  } catch (error) {
    errorMessage.value = 'Error marking report as resolved: ' + (error as Error).message
  } finally {
    loading.value = false
  }
}

const formatDateTime = (timestamp: string) => new Date(timestamp).toLocaleString()

// Add function to view report details
const viewReportDetails = async (reportId: number) => {
  if (!reportId) return;

  try {
    // 使用 router.push 来导航到报告详情页面
    router.push(`/reports/${reportId}`);
  } catch (error) {
    console.error('Error viewing report details:', error);
  }
};

onMounted(async () => {
  await loadReports()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 border-b border-gray-200">
        <h2 class="text-2xl font-bold">User Reports</h2>
        <p class="mt-1 text-sm text-gray-600">
          Reports submitted by users for inappropriate content or issues.
          Administrators can review these reports and take necessary actions.
        </p>

        <!-- 筛选按钮 -->
        <div class="mt-4 flex space-x-2">
          <button 
            @click="setFilter('pending')"
            class="px-4 py-2 text-sm rounded-md font-medium transition-colors"
            :class="activeFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'">
            Pending
          </button>
          <button 
            @click="setFilter('resolved')"
            class="px-4 py-2 text-sm rounded-md font-medium transition-colors"
            :class="activeFilter === 'resolved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'">
            Resolved
          </button>
          <button 
            @click="setFilter('all')"
            class="px-4 py-2 text-sm rounded-md font-medium transition-colors"
            :class="activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'">
            All
          </button>
        </div>
      </div>

      <div class="px-4 py-5 space-y-6">
        <!-- 错误消息 -->
        <div v-if="errorMessage" class="bg-red-50 text-red-700 p-4 rounded-lg">
          {{ errorMessage }}
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="text-gray-500">Loading reports...</div>

        <!-- 状态显示 -->
        <div v-if="!loading" class="text-sm text-gray-500 italic">
          Showing 
          <span class="font-medium">
            {{ activeFilter === 'pending' ? 'pending' : activeFilter === 'resolved' ? 'resolved' : 'all' }}
          </span> 
          reports ({{ reports.length }})
        </div>

        <!-- 无报告时显示提示 -->
        <div v-if="!loading && reports.length === 0" class="p-4 bg-gray-50 text-center text-gray-500 rounded-lg">
          No reports found.
        </div>

        <!-- 显示报告列表 -->
        <div v-else-if="!loading && reports.length > 0" class="space-y-4">
          <div 
            v-for="report in reports" 
            :key="report.id"
            class="border-l-4 p-4 bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
          >
            <div @click="viewReportDetails(report.id)">
              <h3 class="font-semibold text-lg">
                {{ "Report #"+report.post_id || 'Untitled Report' }}
                <span class="text-xs font-normal text-gray-500 ml-2">({{ report.status }})</span>
              </h3>
              <p class="text-sm text-gray-700 mt-1">
                {{ report.reason || 'No details provided.' }}
              </p>
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <span v-if="report.created_at">{{ formatDateTime(report.created_at) }}</span>
              </div>
            </div>

            <!-- 操作按钮：两种选择 -->
            <div class="mt-2 flex gap-2">
              <button 
                @click.stop="markResolved(report)" 
                class="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
              >
                Mark as Resolved
              </button>
              <button 
                @click.stop="processReport(report)" 
                class="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Delete Post & Mark Resolved
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
