<template>
    <span v-if="myShaclVue.ready">
        <v-card height="100%">
            <v-tabs
                v-model="tab"
                align-tabs="left"
                color="deep-purple-accent-4"
            >
                <v-tab :value="1"> <v-icon icon="mdi-list-box-outline"></v-icon>&nbsp;&nbsp; Forms</v-tab>
                <v-tab :value="2"><v-icon icon="mdi-database"></v-icon>&nbsp;&nbsp; Data</v-tab>
            </v-tabs>
            <br>
            <v-tabs-window v-model="tab">
                <v-tabs-window-item :key="1" :value="1"> <MainForm/> </v-tabs-window-item>
                <v-tabs-window-item :key="2" :value="2"> <MainData/> </v-tabs-window-item>
            </v-tabs-window>
        </v-card>
    </span>
    <span v-else>

        BLAAAA

    </span>

</template>

<script setup>
    import { ref, provide, reactive, watch} from 'vue';
    import {ShaclVue} from '@/classes'
    import editorMatchers from '@/modules/editors';
    import defaultEditor from '@/components/UnknownEditor.vue';

    const props = defineProps({
        config: Object,
    })
    
    var tab = ref(0)
    
    const myShaclVue = new ShaclVue(props.config)
    myShaclVue.useReactiveMethods()

    const editMode = reactive({
        form: false,
        graph: false,
    })

    provide('myShaclVue', myShaclVue)
    provide('config', props.config)
    provide('editorMatchers', editorMatchers)
    provide('defaultEditor', defaultEditor)
    // only place where config is necessary other than in ShaclVue,
    // is in NodeshapeEditor to check form layout (tabs vs default)
    // TODO: just add that config variable somewhere else and don't
    // provide the whole config
    provide('editMode', editMode)

</script>