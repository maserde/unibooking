<template>
  <div class="text-center py-12">
    <div class="text-green-500 text-5xl mb-4">✓</div>
    <h2 class="text-2xl font-semibold text-gray-900">Pemesanan Dikonfirmasi!</h2>
    <p class="text-gray-500 mt-2">Pemesanan Anda telah diterima dan pembayaran diproses.</p>
    <p v-if="email" class="text-sm text-gray-500 mt-1">Konfirmasi akan dikirim ke {{ email }}</p>
    <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
      <RouterLink :to="`/customer/${slug}/login`" class="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50">
        Lihat pemesanan saya
      </RouterLink>
      <RouterLink :to="`/store/${slug}`" class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
        Kembali ke katalog
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
