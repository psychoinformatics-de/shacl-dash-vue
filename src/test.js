/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import TestApp from './TestApp.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(TestApp)

registerPlugins(app)

app.mount('#app');