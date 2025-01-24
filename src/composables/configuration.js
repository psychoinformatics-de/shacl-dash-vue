// composables/configuration.js
/**
 * Composable for managing the application configuration
 */


import { ref, onMounted} from 'vue'
const basePath = import.meta.env.BASE_URL || '/';

export function useConfig(default_config = {}) {
    const configURL = `${basePath}config.json`
    const config = ref(null);
    const configFetched = ref(false);

    onMounted(async () => {
        try {
            const response = await fetch(configURL, {cache: "no-cache"});
            if (!response.ok) {
                config.value = default_config
                configFetched.value = true;
                throw new Error(`Error fetching config file: ${response.statusText}\nUsing default config.`);
            }
            config.value = await response.json();
            configFetched.value = true;
        } catch (error) {
            config.value = default_config
            configFetched.value = true;
            console.error(`Error fetching config file: ${error}\nUsing default config.`);
            throw error;
        }
    });
    return {
        config,
        configFetched,
    };
}
