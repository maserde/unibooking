<template>
  <div class="text-center py-12">
    <div class="text-green-500 text-5xl mb-4">✓</div>
    <h2 class="text-2xl font-semibold text-gray-900">Booking Confirmed!</h2>
    <p class="text-gray-500 mt-2">Your booking has been received and payment processed.</p>
    <p v-if="email" class="text-sm text-gray-500 mt-1">A confirmation will be sent to {{ email }}</p>
    <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <RouterLink :to="`/customer/login`" class="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50">
        View my bookings
      </RouterLink>
      <RouterLink :to="`/s/${slug}`" class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
        Back to catalog
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = route.params.slug as string
const email = ref(sessionStorage.getItem('last_booking_email') ?? '')

onMounted(() => {
  sessionStorage.removeItem('last_booking_id')
  sessionStorage.removeItem('last_booking_email')
})
</script>
