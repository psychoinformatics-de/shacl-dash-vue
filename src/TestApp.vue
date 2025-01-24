<template>
    <v-app>
        <AppHeader />
        <v-main v-if="configFetched">
            <span v-if="appView">
                Hello
            </span>
        </v-main>      
  </v-app>
</template>


<script setup>
    import { ref, provide, onBeforeMount, watch } from 'vue';
    import { useConfig } from '@/composables/configuration';
    import { ShaclVue, RdfDataset, ShapesDataset} from '@/classes'

    const default_config = {
        "shapes_url": "shapesgraph.ttl",
        "use_default_shapes": false,
        "data_url": "distribution-penguins.ttl",
        "use_default_data": false,
        "class_url": "linkml_owl.ttl",
        "use_default_classes": false,
        "group_layout": "",
        "defaultPropertyGroup": {
            key: "https://concepts.datalad.org/DefaultPropertyGroup",
            value: {
                "http://www.w3.org/2000/01/rdf-schema#comment": "",
                "http://www.w3.org/2000/01/rdf-schema#label": "Default Properties",
                "http://www.w3.org/ns/shacl#order": 100,
            }
        }
    }

    const { config, configFetched } = useConfig(default_config);
    const appView = ref(true)
    const switchView = ( () => {
        appView.value = !appView.value
    })

    watch(configFetched, async (newValue) => {
        if (newValue) {
            console.log("CHECK: configfetched")
            console.log(config.value)
            const ds = new ShapesDataset()
            if (config.value.shapes_url) {
                ds.loadRDF(config.value.shapes_url)
            } else {
                ds.graphLoaded.value = true
                ds.prefixesLoaded.value = true
            }
        }
    }, { immediate: true });

    onBeforeMount(() => {
        console.log(`Test App is about to be mounted.`)
    })
</script>