<script setup lang="ts">
import { ref,onMounted } from 'vue'
import { useRouter } from 'vue-router';
import { Profile,getProfile,updateProfile } from '../services/apiProfile.ts'
import { useUserStore } from '../stores/userStore';

// const userProfile = ref({
//   name: '',
  // email: 'john.doe@example.com',
  // phone: '+65 9123 4567',
  // bloodGroup: 'O+',
  // address: '123 Singapore Street',
  // emergencyContact: {
  //   name: 'Jane Doe',
  //   phone: '+65 9876 5432',
  //   relationship: 'Spouse'
  // },
  // medicalConditions: ['Asthma', 'Allergies'],
  // medications: ['Ventolin inhaler']
// })
const router = useRouter()
const userProfile = ref<Profile>({
  created_at: '',
  id: -1,
  name: '',
  user_id: '',
  type: 'NORMAL'
})

const userStore = useUserStore();
const isEditing = ref(false)

// const userStore=useUserStore()
async function handleSave()  {
  isEditing.value = false
  // TODO: Implement profile update logic
  // await updateProfileByUserId(userStore.user.id,userProfile.value)
  await updateProfile({
    name: userProfile.value.name
  })
  await userStore.initUser();
  console.log('Saving profile:', userProfile.value)
}

onMounted(async () => {
  userProfile.value=await getProfile();

})


</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white shadow rounded-lg">
      <!-- Profile Header -->
      <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-2xl font-bold text-health-dark">User Profile</h3>
          <button
            @click="isEditing = !isEditing"
            class="btn btn-primary"
          >
            {{ isEditing ? 'Cancel' : 'Edit Profile' }}
          </button>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="px-4 py-5 sm:p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-health-dark">Basic Information</h4>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-600">Full Name</label>
                <input
                  v-if="isEditing"
                  v-model="userProfile.name"
                  type="text"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                />
                <p v-else class="mt-1 text-health-dark">{{ userProfile.name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-600">User Type:</label>
                <p class="mt-1 text-health-dark">{{ userProfile.type }}</p>
              </div>
              <!-- <div>
                <label class="block text-sm font-medium text-gray-600">Email</label>
                <input
                  v-if="isEditing"
                  v-model="userProfile.email"
                  type="email"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                />
                <p class="mt-1 text-health-dark">{{ userProfile.email }}</p>
              </div> -->
              <!-- <div>
                <label class="block text-sm font-medium text-gray-600">Phone Number</label>
                <input
                  v-if="isEditing"
                  v-model="userProfile.phone"
                  type="tel"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                />
                <p v-else class="mt-1 text-health-dark">{{ userProfile.phone }}</p>
              </div> -->
              <!-- <div>
                <label class="block text-sm font-medium text-gray-600">Blood Group</label>
                <select
                  v-if="isEditing"
                  v-model="userProfile.bloodGroup"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                >
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>O+</option>
                  <option>O-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                </select>
                <p v-else class="mt-1 text-health-dark">{{ userProfile.bloodGroup }}</p>
              </div> -->
            </div>
          </div>

          <!-- Medical Information -->
          <!-- <div class="space-y-4">
            <h4 class="text-lg font-semibold text-health-dark">Medical Information</h4>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-600">Medical Conditions</label>
                <div v-if="isEditing" class="mt-1 space-y-2">
                  <div v-for="(condition, index) in userProfile.medicalConditions" :key="index" class="flex gap-2">
                    <input
                      v-model="userProfile.medicalConditions[index]"
                      type="text"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                    />
                    <button
                      @click="userProfile.medicalConditions.splice(index, 1)"
                      class="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <button
                    @click="userProfile.medicalConditions.push('')"
                    class="text-health-primary hover:text-health-primary/80"
                  >
                    Add Condition
                  </button>
                </div>
                <ul v-else class="mt-1 list-disc list-inside text-health-dark">
                  <li v-for="condition in userProfile.medicalConditions" :key="condition">
                    {{ condition }}
                  </li>
                </ul>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-600">Current Medications</label>
                <div v-if="isEditing" class="mt-1 space-y-2">
                  <div v-for="(medication, index) in userProfile.medications" :key="index" class="flex gap-2">
                    <input
                      v-model="userProfile.medications[index]"
                      type="text"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                    />
                    <button
                      @click="userProfile.medications.splice(index, 1)"
                      class="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <button
                    @click="userProfile.medications.push('')"
                    class="text-health-primary hover:text-health-primary/80"
                  >
                    Add Medication
                  </button>
                </div>
                <ul v-else class="mt-1 list-disc list-inside text-health-dark">
                  <li v-for="medication in userProfile.medications" :key="medication">
                    {{ medication }}
                  </li>
                </ul>
              </div>
            </div>
          </div> -->
        </div>

        <!-- Save Button -->
        <div v-if="isEditing" class="mt-6 flex justify-end">
          <button
            @click="handleSave"
            class="btn btn-primary"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- Feedback Section -->
    <div class="mt-8 bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 class="text-xl font-bold text-health-dark">Submit Feedback</h3>
      </div>
      <div class="px-4 py-5 sm:p-6">
        <form @submit.prevent="() => console.log('Feedback submitted')">
          <div class="space-y-4">
            <div>
              <label for="feedback-type" class="block text-sm font-medium text-gray-600">Feedback Type</label>
              <select
                id="feedback-type"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
              >
                <option>General Feedback</option>
                <option>Bug Report</option>
                <option>Feature Request</option>
                <option>Complaint</option>
              </select>
            </div>
            <div>
              <label for="feedback-message" class="block text-sm font-medium text-gray-600">Your Message</label>
              <textarea
                id="feedback-message"
                rows="4"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                placeholder="Please share your thoughts..."
              ></textarea>
            </div>
            <div class="flex justify-end">
              <button type="submit" class="btn btn-primary">
                Submit Feedback
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    
    <div>
      <button
        @click="router.push('/forget-password')"
        class="btn bg-health-secondary text-white hover:bg-health-secondary/90"
      >
        Change Password
      </button>
    </div>
  </div>
</template>