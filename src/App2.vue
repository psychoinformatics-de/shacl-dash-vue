<template>
    <v-app>
        <AppHeader />
        <v-main v-if="showApp">
            <span v-if="appView">
                <shacl-vue :config="config"></shacl-vue>
            </span>
            <span v-else>
                <v-container fluid>
                    <div class="banner">
                        <div class="banner-column" style="text-align: left; margin-left: 8em;">
                            <h1 style="color: #3451B2">shacl-vue (alpha)</h1>
                            <h1>Automatic generation of user interfaces from SHACL</h1>
                            <br>
                            <div class="banner-buttons">
                            <v-btn
                                rounded="xl" size="large" style="margin-right: 1em"
                                @click="switchView()"
                            >Try it out 🚀</v-btn>
                            <v-btn
                                rounded="xl" size="large" style="margin-right: 1em"
                                href="https://psychoinformatics-de.github.io/shacl-vue/docs/"
                                target="_blank"
                            ><v-icon>mdi-text-box</v-icon>&nbsp;&nbsp;Docs</v-btn>
                            <v-btn
                                rounded="xl" size="large"
                                href="https://github.com/psychoinformatics-de/shacl-vue"
                                target="_blank"
                            ><v-icon>mdi-github</v-icon>&nbsp;&nbsp;Code</v-btn>
                            </div>
                        </div>
                        <div class="banner-column" style="margin-right: 6em;">
                            <v-img
                            class="mx-auto"
                            width="40%"
                            src="./assets/shacl_vue.svg"
                            ></v-img>
                        </div>
                    </div>   
                </v-container>
            </span>
        </v-main>      
  </v-app>
</template>


<script setup>
    import { ref, provide, onBeforeMount, watch } from 'vue';
    import { useConfig } from '@/composables/configuration';
    import ShaclVue from '@/components/ShaclVue.vue';

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
        },
        "id_iri": "https://concepts.datalad.org/s/thing/unreleased/id"
    }

    const { config, configFetched } = useConfig(default_config);
    const appView = ref(false)
    const showApp = ref(false)
    const switchView = ( () => {
        appView.value = true
    })
    watch(configFetched, async (newValue) => {
        if (newValue) {
            console.log("CHECK: configfetched")
            console.log(config.value)
            showApp.value = true;
        }
    }, { immediate: true });

    onBeforeMount(() => {
        console.log(`App2 is about to be mounted.`)
    })
</script>

<style scoped>
    .banner {
        display: flex;
        flex-direction: row;
        width: 100%;
        margin: auto;
    }
    .banner-column {
        display: flex;
        flex-direction: column;
        flex: 1;
        margin: 4em;
        color: #34495e;
    }
    .banner-column h1 {
        font-size: 2.5em;
    }
    .banner-buttons {
        display: flex;
        flex-direction: row;
        width: 100%;
        margin: auto;
        margin-top: 1em;
    }
</style>