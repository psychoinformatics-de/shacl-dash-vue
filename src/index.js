// Component export for Vue-based usage
import ShaclVue from '@/components/ShaclVue.vue'
export { ShaclVue }

// Default export for Vue-based plugin installation
export default {
    install(app) {
        app.component('ShaclVue', ShaclVue);
    },
};

// Export function for Custom Element usage
export { registerShaclVue } from '@/elements';