<template>
  <Component :is="layout">
    <RouterView />
  </Component>
  <AppToast />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import StorefrontLayout from '@/layouts/StorefrontLayout.vue'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import AppToast from '@/components/ui/AppToast.vue'

const route = useRoute()

const layouts = {
  auth: AuthLayout,
  dashboard: DashboardLayout,
  storefront: StorefrontLayout,
  customer: CustomerLayout,
}

const layout = computed(() => {
  const key = (route.meta.layout as keyof typeof layouts) ?? 'auth'
  return layouts[key] ?? AuthLayout
})
</script>
