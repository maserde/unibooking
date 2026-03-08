<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-900">Pengaturan</h1>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex gap-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'pb-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.key
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700',
          ]"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Profile Tab -->
    <div v-if="activeTab === 'profile'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Profil Bisnis">
        <AppAlert v-if="profileError" type="error" :message="profileError" class="mb-4" />
        <AppAlert v-if="profileSuccess" type="success" message="Profil berhasil diperbarui" class="mb-4" />
        <form class="space-y-4" @submit.prevent="saveProfile">
          <!-- Logo upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Logo Perusahaan</label>
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  v-if="authStore.merchant?.logo_url"
                  :src="authStore.merchant.logo_url"
                  :alt="authStore.merchant.name"
                  class="w-full h-full object-contain"
                />
                <svg v-else class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <AppButton variant="secondary" size="sm" type="button" :loading="logoLoading" @click="logoInput?.click()">
                  {{ authStore.merchant?.logo_url ? 'Ganti logo' : 'Unggah logo' }}
                </AppButton>
                <p class="text-xs text-gray-500 mt-1">PNG, JPG atau WebP · maks 5 MB</p>
              </div>
            </div>
            <AppAlert v-if="logoError" type="error" :message="logoError" class="mt-2" />
            <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="onLogoSelect" />
          </div>

          <AppInput v-model="profile.name" label="Nama bisnis" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL Storefront</label>
            <a
              v-if="authStore.merchant?.storefront_url"
              :href="authStore.merchant.storefront_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:underline bg-gray-50 border border-gray-200 rounded-md px-3 py-2 block truncate"
            >{{ authStore.merchant.storefront_url }}</a>
          </div>
          <AppInput v-model="profile.phone" label="Telepon" type="tel" />
          <AppInput v-model="profile.address" label="Alamat" />
          <AppInput v-model="profile.upfront_fee_percentage" label="Biaya DP %" type="number" hint="Persentase total yang dikenakan di awal (misal 30)" />
          <AppButton type="submit" :loading="profileLoading">Simpan perubahan</AppButton>
        </form>
      </AppCard>

      <AppCard title="Ubah Kata Sandi">
        <AppAlert v-if="passwordError" type="error" :message="passwordError" class="mb-4" />
        <AppAlert v-if="passwordSuccess" type="success" message="Kata sandi berhasil diperbarui" class="mb-4" />
        <form class="space-y-4" @submit.prevent="savePassword">
          <AppInput v-model="passwords.current" label="Kata sandi saat ini" type="password" />
          <AppInput v-model="passwords.new" label="Kata sandi baru" type="password" hint="Minimal 8 karakter" />
          <AppInput v-model="passwords.confirm" label="Konfirmasi kata sandi baru" type="password" />
          <AppButton type="submit" :loading="passwordLoading">Perbarui kata sandi</AppButton>
        </form>
      </AppCard>
    </div>

    <!-- Payment Tab -->
    <div v-if="activeTab === 'payment'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Pengaturan Pembayaran">
        <AppAlert v-if="paymentError" type="error" :message="paymentError" class="mb-4" />
        <AppAlert v-if="paymentSuccess" type="success" message="API key diperbarui" class="mb-4" />
        <form class="space-y-4" @submit.prevent="savePayment">
          <AppInput v-model="mayarKey" label="Mayar API Key" type="password" hint="Key Anda dienkripsi sebelum disimpan" />
          <AppButton type="submit" :loading="paymentLoading">Perbarui API key</AppButton>
        </form>
      </AppCard>

      <AppCard title="Integrasi Webhook">
        <AppSpinner v-if="webhookLoading" size="sm" />
        <div v-else class="space-y-3">
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Webhook URL</p>
            <p class="text-sm font-mono bg-gray-50 border border-gray-200 rounded-md px-3 py-2 break-all select-all">
              {{ webhookInfo?.webhook_url ?? '—' }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
            <span
              v-if="webhookInfo?.webhook_status === 'SUCCESS'"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
            >Terdaftar</span>
            <span
              v-else-if="webhookInfo?.webhook_status === 'FAILED'"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
            >Gagal</span>
            <span
              v-else
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
            >Belum terdaftar</span>
          </div>
<AppAlert v-if="webhookRetryError" type="error" :message="webhookRetryError" />
          <AppAlert v-if="webhookRetrySuccess" type="success" message="Webhook berhasil didaftarkan" />
          <AppButton
            variant="secondary"
            :loading="webhookRetrying"
            @click="retryWebhook"
          >Sambungkan Ulang Webhook</AppButton>
        </div>
      </AppCard>
    </div>

    <!-- Staff Tab -->
    <div v-if="activeTab === 'staff'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-gray-900">Anggota Staf</h2>
        <AppButton @click="staffModalOpen = true">+ Undang Staf</AppButton>
      </div>
      <AppCard :no-padding="true">
        <AppTable :columns="staffColumns" :rows="staffRows" :loading="staffLoading">
          <template #cell-actions="{ row }">
            <AppButton
              v-if="(row as StaffRow).id !== authStore.user?.id"
              variant="danger"
              size="sm"
              @click="confirmRemoveStaff(row as StaffRow)"
            >
              Hapus
            </AppButton>
          </template>
          <template #empty>
            <AppEmptyState title="Belum ada staf" description="Undang anggota tim untuk membantu mengelola pemesanan." />
          </template>
        </AppTable>
      </AppCard>

      <StaffFormModal v-model="staffModalOpen" @saved="fetchStaff" />

      <AppConfirmDialog
        v-model="removeDialogOpen"
        title="Hapus Staf"
        :description="`Hapus ${removingStaff?.full_name}?`"
        confirm-label="Hapus"
        danger
        :loading="removing"
        @confirm="doRemoveStaff"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { merchantApi } from '@/api/merchant'
import { staffApi } from '@/api/staff'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/composables/useApiError'
import { useToast } from '@/composables/useToast'
import type { MerchantUser } from '@/types/models'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import StaffFormModal from '@/components/StaffFormModal.vue'

interface StaffRow extends MerchantUser { [key: string]: unknown }

const authStore = useAuthStore()
const { extractError } = useApiError()
const toast = useToast()
const activeTab = ref<'profile' | 'payment' | 'staff'>('profile')

const tabs = [
  { key: 'profile' as const, label: 'Profil' },
  { key: 'payment' as const, label: 'Pembayaran' },
  { key: 'staff' as const, label: 'Staf' },
]

// Logo
const logoLoading = ref(false)
const logoError = ref('')
const logoInput = ref<HTMLInputElement | null>(null)

async function onLogoSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''
  logoLoading.value = true
  logoError.value = ''
  try {
    const res = await merchantApi.uploadLogo(file)
    authStore.setMerchant(res.data.data)
    toast.success('Logo diperbarui')
  } catch (e) {
    logoError.value = extractError(e)
  } finally {
    logoLoading.value = false
  }
}

// Profile
const profile = reactive({
  name: authStore.merchant?.name ?? '',
  phone: authStore.merchant?.phone ?? '',
  address: authStore.merchant?.address ?? '',
  upfront_fee_percentage: String(authStore.merchant?.upfront_fee_percentage ?? 30),
})
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref(false)
const mayarKey = ref('')
const paymentLoading = ref(false)
const paymentError = ref('')
const paymentSuccess = ref(false)

const passwords = reactive({ current: '', new: '', confirm: '' })
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

const webhookInfo = ref<{ webhook_url: string; webhook_status: 'SUCCESS' | 'FAILED' | null; has_api_key: boolean } | null>(null)
const webhookLoading = ref(false)
const webhookRetrying = ref(false)
const webhookRetryError = ref('')
const webhookRetrySuccess = ref(false)

async function saveProfile() {
  profileLoading.value = true
  profileError.value = ''
  profileSuccess.value = false
  try {
    const res = await merchantApi.updateProfile({
      name: profile.name,
      phone: profile.phone,
      address: profile.address,
      upfront_fee_percentage: Number(profile.upfront_fee_percentage),
    })
    authStore.setMerchant(res.data.data)
    profileSuccess.value = true
  } catch (e) {
    profileError.value = extractError(e)
  } finally {
    profileLoading.value = false
  }
}

async function savePassword() {
  passwordError.value = ''
  passwordSuccess.value = false
  if (passwords.new !== passwords.confirm) {
    passwordError.value = 'Kata sandi baru tidak cocok'
    return
  }
  passwordLoading.value = true
  try {
    await authApi.changePassword({ current_password: passwords.current, new_password: passwords.new })
    passwords.current = ''
    passwords.new = ''
    passwords.confirm = ''
    passwordSuccess.value = true
  } catch (e) {
    passwordError.value = extractError(e)
  } finally {
    passwordLoading.value = false
  }
}

async function fetchWebhookInfo() {
  webhookLoading.value = true
  try {
    const res = await merchantApi.getWebhookInfo()
    webhookInfo.value = res.data.data
  } finally {
    webhookLoading.value = false
  }
}

async function retryWebhook() {
  webhookRetryError.value = ''
  webhookRetrySuccess.value = false
  webhookRetrying.value = true
  try {
    const res = await merchantApi.retryWebhook()
    webhookInfo.value = { ...webhookInfo.value!, webhook_status: res.data.data.webhook_status }
    if (res.data.data.webhook_status === 'SUCCESS') {
      webhookRetrySuccess.value = true
    } else {
      webhookRetryError.value = 'Pendaftaran gagal. Pastikan APP_URL Anda bisa diakses publik oleh Mayar.'
    }
  } catch (e) {
    webhookRetryError.value = extractError(e)
  } finally {
    webhookRetrying.value = false
  }
}

async function savePayment() {
  if (!mayarKey.value) return
  paymentLoading.value = true
  paymentError.value = ''
  paymentSuccess.value = false
  try {
    await merchantApi.setupPayment({ mayar_api_key: mayarKey.value })
    mayarKey.value = ''
    paymentSuccess.value = true
  } catch (e) {
    paymentError.value = extractError(e)
  } finally {
    paymentLoading.value = false
  }
}

// Staff
const staffLoading = ref(false)
const staffList = ref<MerchantUser[]>([])
const staffModalOpen = ref(false)
const removeDialogOpen = ref(false)
const removingStaff = ref<MerchantUser | null>(null)
const removing = ref(false)

const staffColumns = [
  { key: 'full_name', label: 'Nama' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Peran' },
  { key: 'actions', label: '' },
]

const staffRows = ref<StaffRow[]>([])

async function fetchStaff() {
  staffLoading.value = true
  try {
    const res = await staffApi.list()
    staffList.value = res.data.data
    staffRows.value = res.data.data as StaffRow[]
  } finally {
    staffLoading.value = false
  }
}

function confirmRemoveStaff(staff: StaffRow) {
  removingStaff.value = staff
  removeDialogOpen.value = true
}

async function doRemoveStaff() {
  if (!removingStaff.value) return
  removing.value = true
  try {
    await staffApi.remove(removingStaff.value.id)
    removeDialogOpen.value = false
    fetchStaff()
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  fetchStaff()
  fetchWebhookInfo()
})
</script>
