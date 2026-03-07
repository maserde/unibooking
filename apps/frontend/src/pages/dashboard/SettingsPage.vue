<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-gray-900">Settings</h1>

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
    <div v-if="activeTab === 'profile'" class="max-w-lg">
      <AppCard title="Business Profile">
        <AppAlert v-if="profileError" type="error" :message="profileError" class="mb-4" />
        <AppAlert v-if="profileSuccess" type="success" message="Profile updated successfully" class="mb-4" />
        <form class="space-y-4" @submit.prevent="saveProfile">
          <AppInput v-model="profile.name" label="Business name" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Storefront URL</label>
            <a
              v-if="authStore.merchant?.storefront_url"
              :href="authStore.merchant.storefront_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:underline bg-gray-50 border border-gray-200 rounded-md px-3 py-2 block truncate"
            >{{ authStore.merchant.storefront_url }}</a>
          </div>
          <AppInput v-model="profile.phone" label="Phone" type="tel" />
          <AppInput v-model="profile.address" label="Address" />
          <AppInput v-model="profile.upfront_fee_percentage" label="Upfront fee %" type="number" hint="Percentage of total charged upfront (e.g., 30)" />
          <AppButton type="submit" :loading="profileLoading">Save changes</AppButton>
        </form>
      </AppCard>

      <AppCard title="Payment Setup" class="mt-4">
        <AppAlert v-if="paymentError" type="error" :message="paymentError" class="mb-4" />
        <AppAlert v-if="paymentSuccess" type="success" message="API key updated" class="mb-4" />
        <form class="space-y-4" @submit.prevent="savePayment">
          <AppInput v-model="mayarKey" label="Mayar API Key" type="password" hint="Your key is encrypted before storage" />
          <AppButton type="submit" :loading="paymentLoading">Update API key</AppButton>
        </form>
      </AppCard>
    </div>

    <!-- Staff Tab -->
    <div v-if="activeTab === 'staff'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-gray-900">Staff Members</h2>
        <AppButton @click="staffModalOpen = true">+ Invite Staff</AppButton>
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
              Remove
            </AppButton>
          </template>
          <template #empty>
            <AppEmptyState title="No staff yet" description="Invite team members to help manage bookings." />
          </template>
        </AppTable>
      </AppCard>

      <StaffFormModal v-model="staffModalOpen" @saved="fetchStaff" />

      <AppConfirmDialog
        v-model="removeDialogOpen"
        title="Remove Staff"
        :description="`Remove ${removingStaff?.full_name}?`"
        confirm-label="Remove"
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
import { useAuthStore } from '@/stores/auth'
import { useApiError } from '@/composables/useApiError'
import type { MerchantUser } from '@/types/models'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import StaffFormModal from '@/components/StaffFormModal.vue'

interface StaffRow extends MerchantUser { [key: string]: unknown }

const authStore = useAuthStore()
const { extractError } = useApiError()
const activeTab = ref<'profile' | 'staff'>('profile')

const tabs = [
  { key: 'profile' as const, label: 'Profile' },
  { key: 'staff' as const, label: 'Staff' },
]

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
  { key: 'full_name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
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

onMounted(fetchStaff)
</script>
