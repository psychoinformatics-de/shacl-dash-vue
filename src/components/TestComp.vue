<template>

<v-sheet class="pa-4" border rounded elevation="2">

    <!-- <component
        :is="CustomSimple"
        v-model="formData[node_uid][0][triple_uid][0]"
        :property_shape="shape_obj"
        :node_uid="node_uid"
        :triple_uid="triple_uid"
        >
    </component> -->

    <v-btn @click="logStuff">Log stuff</v-btn>

    <v-switch v-model="kaas"></v-switch>

    <span v-if="kaas">
        <CustomSimple
            v-model="formData[node_uid][0][triple_uid][0]"
            :property_shape="shape_obj"
            :node_uid="node_uid"
            :triple_uid="triple_uid"
            >
        </CustomSimple>
    </span>

    <v-divider></v-divider>

    {{ formData }}

    <v-divider></v-divider>

    {{ formData[node_uid] }}

    <v-divider></v-divider>

    {{ formData[node_uid].at(-1) }}

    <v-divider></v-divider>

    bla: {{ formData[node_uid].at(-1)[triple_uid] }}

    <v-divider></v-divider>

    blabla: {{ formData[node_uid].at(-1)[triple_uid].at(-1) }}

    <v-divider></v-divider>


</v-sheet>

</template>

<script setup>
    import CustomSimple from '@/components/CustomSimple.vue';

    import { ref, inject, onBeforeMount} from 'vue'
    import { useShapeData } from '@/composables/shapedata';
    import { useFormData } from '@/composables/formdata';

    const simpledata = ref(null)
    const kaas = ref(false)

    const {
        formData,
        add_empty_node,
        add_empty_triple,
    } = useFormData()
    const shape_file_url = new URL("@/assets/shapesgraph.ttl", import.meta.url).href
    const {
        nodeShapes
    } = useShapeData(shape_file_url)

    
    const node_uid = 'https://concepts.datalad.org/s/prov/unreleased/Activity'
    const triple_uid = 'https://concepts.datalad.org/s/thing/unreleased/description'
    const shape_obj = nodeShapes.value[node_uid]


    onBeforeMount(() => {
        console.log("...BeforeMounet TestComp....")
        add_empty_node(node_uid)
        add_empty_triple(node_uid, triple_uid)
    })

    function logStuff() {
        console.log(formData)
        console.log(formData[node_uid])
        console.log(formData[node_uid].at(-1)[triple_uid].at(-1))
    }


</script>