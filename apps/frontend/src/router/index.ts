import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCustomerStore } from '@/stores/customer'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Auth
    { path: '/login', component: () => import('@/pages/auth/LoginPage.vue'), meta: { layout: 'auth', guest: true } },
    { path: '/register', component: () => import('@/pages/auth/RegisterPage.vue'), meta: { layout: 'auth', guest: true } },
    { path: '/verify-email', component: () => import('@/pages/auth/VerifyEmailPage.vue'), meta: { layout: 'auth' } },
    { path: '/onboarding', component: () => import('@/pages/auth/OnboardingWizardPage.vue'), meta: { layout: 'auth', requiresMerchantAuth: true } },

    // Dashboard
    { path: '/dashboard', component: () => import('@/pages/dashboard/DashboardHomePage.vue'), meta: { layout: 'dashboard', requiresMerchantAuth: true } },
    { path: '/dashboard/bookings', component: () => import('@/pages/dashboard/BookingsPage.vue'), meta: { layout: 'dashboard', requiresMerchantAuth: true } },
    { path: '/dashboard/bookings/:id', component: () => import('@/pages/dashboard/BookingDetailPage.vue'), meta: { layout: 'dashboard', requiresMerchantAuth: true } },
    { path: '/dashboard/catalog', component: () => import('@/pages/dashboard/CatalogPage.vue'), meta: { layout: 'dashboard', requiresMerchantAuth: true } },
    { path: '/dashboard/customers', component: () => import('@/pages/dashboard/CustomersPage.vue'), meta: { layout: 'dashboard', requiresMerchantAuth: true } },
    { path: '/dashboard/customers/:id', component: () => import('@/pages/dashboard/CustomerDetailPage.vue'), meta: { layout: 'dashboard', requiresMerchantAuth: true } },
    { path: '/dashboard/promos', component: () => import('@/pages/dashboard/PromosPage.vue'), meta: { layout: 'dashboard', requiresMerchantAuth: true } },
    { path: '/dashboard/settings', component: () => import('@/pages/dashboard/SettingsPage.vue'), meta: { layout: 'dashboard', requiresMerchantAuth: true } },

    // Public storefront
    { path: '/s/:slug', component: () => import('@/pages/storefront/StorefrontPage.vue'), meta: { layout: 'storefront' } },
    { path: '/s/:slug/checkout', component: () => import('@/pages/storefront/CheckoutPage.vue'), meta: { layout: 'storefront' } },
    { path: '/s/:slug/booking-success', component: () => import('@/pages/storefront/BookingSuccessPage.vue'), meta: { layout: 'storefront' } },

    // Customer portal
    { path: '/customer/login', component: () => import('@/pages/customer/CustomerLoginPage.vue'), meta: { layout: 'customer' } },
    { path: '/customer/verify/:token', component: () => import('@/pages/customer/CustomerVerifyPage.vue'), meta: { layout: 'customer' } },
    { path: '/customer/bookings', component: () => import('@/pages/customer/CustomerBookingsPage.vue'), meta: { layout: 'customer', requiresCustomerAuth: true } },
    { path: '/customer/bookings/:id', component: () => import('@/pages/customer/CustomerBookingDetailPage.vue'), meta: { layout: 'customer', requiresCustomerAuth: true } },

    // Root redirect
    { path: '/', redirect: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const customerStore = useCustomerStore()

  // Hydrate merchant if token exists but merchant not yet loaded (handles page refresh + re-login)
  if (authStore.token && !authStore.merchant) {
    await authStore.fetchMe()
  }

  // Guest route: redirect authenticated merchant away
  if (to.meta.guest && authStore.isAuthenticated) {
    return next(authStore.needsOnboarding ? '/onboarding' : '/dashboard')
  }

  // Requires merchant auth
  if (to.meta.requiresMerchantAuth) {
    if (!authStore.isAuthenticated) return next('/login')
    if (authStore.needsOnboarding && to.path !== '/onboarding') return next('/onboarding')
    if (!authStore.needsOnboarding && to.path === '/onboarding') return next('/dashboard')
  }

  // Requires customer auth
  if (to.meta.requiresCustomerAuth && !customerStore.isAuthenticated) {
    return next('/customer/login')
  }

  next()
})

export default router
