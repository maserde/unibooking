<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Lacak pemesanan Anda</h2>
      <p class="text-sm text-gray-500 mb-8">Masukkan email Anda untuk menerima tautan ajaib.</p>

      <div v-if="sent" class="text-center py-6">
        <div class="text-green-600 text-5xl mb-4">✉</div>
        <h3 class="text-lg font-semibold text-gray-900">Cek email Anda</h3>
        <p class="text-sm text-gray-500 mt-2">Kami telah mengirim tautan ajaib ke <span class="font-medium text-gray-700">{{ form.email }}</span></p>
      </div>

      <template v-else>
        <AppAlert v-if="errorMsg" type="error" :message="errorMsg" class="mb-5" />
        <form class="space-y-5" @submit.prevent="requestLink">
          <AppInput v-model="form.email" label="Email" type="email" placeholder="your@email.com" :error="errors.email" />
          <AppButton type="submit" class="w-full" :loading="loading">Kirim tautan ajaib</AppButton>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useCustomerStore } from '@/stores/customer'
import { useApiError } from '@/composables/useApiError'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const route = useRoute()
const customerStore = useCustomerStore()
const { extractError } = useApiError()

const slug = route.params.slug as string
const form = reactive({ email: '' })
const errors = reactive({ email: '' })
const loading = ref(false)
const errorMsg = ref('')
const sent = ref(false)

async function requestLink() {
  errors.email = ''
  if (!form.email) { errors.email = 'Wajib diisi'; return }

  loading.value = true
  errorMsg.value = ''
  try {
    await customerStore.requestMagicLink(form.email, slug)
    sent.value = true
  } catch (e) {
    errorMsg.value = extractError(e)
  } finally {
    loading.value = false
  }
}
</script>
