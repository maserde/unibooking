<template>
  <div class="flex h-screen overflow-hidden bg-gray-50">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center px-6 py-5 border-b border-gray-200">
        <span class="text-lg font-bold text-primary-600">Unibooking</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main</p>
        <RouterLink v-for="item in mainNav" :key="item.to" :to="item.to" :class="navClass(item.to)" @click="sidebarOpen = false">
          {{ item.label }}
        </RouterLink>

        <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">Manage</p>
        <RouterLink v-for="item in manageNav" :key="item.to" :to="item.to" :class="navClass(item.to)" @click="sidebarOpen = false">
          {{ item.label }}
        </RouterLink>

        <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">Account</p>
        <RouterLink v-for="item in accountNav" :key="item.to" :to="item.to" :class="navClass(item.to)" @click="sidebarOpen = false">
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User -->
      <div class="px-4 py-4 border-t border-gray-200">
        <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.user?.full_name }}</p>
        <p class="text-xs text-gray-500">{{ authStore.user?.role }}</p>
        <button type="button" class="mt-2 text-xs text-red-600 hover:underline" @click="handleLogout">Sign out</button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="sidebarOpen = false" />

    <!-- Main -->
    <div class="flex-1 flex flex-col lg:pl-64 min-w-0">
      <!-- Mobile header -->
      <div class="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
        <button type="button" class="text-gray-500" @click="sidebarOpen = true">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="font-semibold text-primary-600">Unibooking</span>
      </div>

      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)

const mainNav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/bookings', label: 'Bookings' },
  { to: '/dashboard/catalog', label: 'Catalog' },
]

const manageNav = [
  { to: '/dashboard/customers', label: 'Customers' },
  { to: '/dashboard/promos', label: 'Promo Codes' },
]

const accountNav = [{ to: '/dashboard/settings', label: 'Settings' }]

function navClass(to: string) {
  const active = to === '/dashboard' ? route.path === to : route.path.startsWith(to)
  return [
    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
    active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  ]
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
