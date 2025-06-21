import { seedSampleAlerts } from './Sampledata'

// Run the seed function
seedSampleAlerts()
  .then(() => console.log('Sample alerts seeded successfully'))
  .catch(error => console.error('Error seeding sample alerts:', error)) 