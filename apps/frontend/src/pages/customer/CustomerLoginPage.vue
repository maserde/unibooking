<template>
  <div class="max-w-sm mx-auto py-16 px-4">
    <div class="bg-white border border-gray-200 rounded-lg p-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Track your booking</h2>
      <p class="text-sm text-gray-500 mb-6">Enter your email to receive a magic link.</p>

      <div v-if="sent" class="text-center py-4">
        <div class="text-green-600 text-4xl mb-3">✉</div>
        <h3 class="font-medium text-gray-900">Check your email</h3>
        <p class="text-sm text-gray-500 mt-1">We sent a magic link to {{ form.email }}</p>
      </div>

      <template v-else>
        <AppAlert v-if="errorMsg" type="error" :message="errorMsg" class="mb-4" />
        <form class="space-y-4" @submit.prevent="requestLink">
          <AppInput v-model="form.email" label="Email" type="email" :error="errors.email" />
          <AppInput v-if="!slugFromQuery" v-model="form.slug" label="Merchant slug" :error="errors.slug" hint="Found in your booking confirmation" />
          <AppButton type="submit" class="w-full" :loading="loading">Send magic link</AppButton>
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

const slugFromQuery = route.query.slug as string | undefined
const form = reactive({ email: '', slug: slugFromQuery ?? '' })
const errors = reactive({ email: '', slug: '' })
const loading = ref(false)
const errorMsg = ref('')
const sent = ref(false)

async function requestLink() {
  errors.email = ''
  errors.slug = ''
  if (!form.email) { errors.email = 'Required'; return }
  if (!form.slug) { errors.slug = 'Required'; return }

  loading.value = true
  errorMsg.value = ''
  try {
    await customerStore.requestMagicLink(form.email, form.slug)
    sent.value = true
  } catch (e) {
    errorMsg.value = extractError(e)
  } finally {
    loading.value = false
  }
}
</script>
