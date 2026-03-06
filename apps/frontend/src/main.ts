import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { setupApiInterceptors } from './api/client'
import { useAuthStore } from './stores/auth'
import { useCustomerStore } from './stores/customer'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Set up axios interceptors after stores are available
const authStore = useAuthStore()
const customerStore = useCustomerStore()

setupApiInterceptors(
  () => authStore.token,
  () => {
    authStore.token = null
    router.push('/login')
  },
  () => customerStore.token,
  () => {
    customerStore.token = null
    router.push('/customer/login')
  },
)

app.mount('#app')
