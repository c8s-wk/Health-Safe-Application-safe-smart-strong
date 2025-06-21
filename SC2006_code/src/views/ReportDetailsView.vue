<template>
    <div>
      <h2>Report Details</h2>
      <div v-if="report">
        <p><strong>Report ID:</strong> {{ report.id }}</p>
        <p><strong>Create Time:</strong> {{ report.created_at }}</p>
        <p><strong>Status:</strong> {{ report.status }}</p>
        <p><strong>Reason:</strong> {{ report.reason }}</p>
        <p><strong>Details:</strong> {{ report.details }}</p>
      </div>
    </div>
  </template>
  
  
<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import { useRoute } from 'vue-router';
    import { fetchReportById } from '../services/apiReport'; 
    import type { Report } from '../services/apiReport';

    const route = useRoute();
    const report = ref<Report | null>(null);
    
    const loadReportDetails = async () => {
        const reportId = parseInt(route.params.reportID as string);
        if (reportId) {
            try {
            const result = await fetchReportById(reportId);
            console.log('Fetched report:', result); 
            report.value = result;
            } catch (error) {
            console.error('Error loading report:', error);
            }
        }
    };



  // services/apiReport.ts

  onMounted(() => {
    loadReportDetails();
  });
</script>

  
  