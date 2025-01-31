<template>
    <v-autocomplete
        density="compact"
        variant="outlined"
        label="select an item"
        v-model="triple_object"
        :items="instanceItems"
        validate-on="lazy input"
        :rules="rules"
        item-value="value"
        item-text="title"
        return-object
        ref="fieldRef"
        :id="inputId"
    >

        <template v-slot:item="data">
            <!-- Show the "Add Item" button first -->
            <div v-if="data.item.props.isButton">
                <v-list-item @click.stop>
                    <v-list-item-title>
                        <v-menu v-model="menu" location="end">
                            <template v-slot:activator="{ props }">
                                <v-btn variant="tonal" v-bind="props">{{ data.item.title }} &nbsp;&nbsp; <v-icon icon="item.icon">mdi-play</v-icon></v-btn>
                            </template>

                            <v-list ref="addItemList">
                                <v-list-item v-for="item in propClassList" @click.stop="handleAddItemClick(item)">
                                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>

                    </v-list-item-title>
                </v-list-item>
            </div>
            <!-- Then show all other items -->
            <div v-else>
                <v-list-item @click="selectItem(data.item)">
                    <div style="display: flex;">
                        <div>
                            <v-list-item-title>{{ data.item.title }}</v-list-item-title>
                            <v-list-item-subtitle>{{ data.item.props.subtitle }}</v-list-item-subtitle>
                        </div>
                        <div style="margin-left: auto;">
                            <v-tooltip location="end" min-width="480px">
                                <template v-slot:activator="{ props }">
                                    <v-icon
                                        v-bind="props"
                                        small
                                        class="ml-2 info-tooltip"
                                        color="primary"
                                    >
                                        mdi-information-outline
                                    </v-icon>
                                </template>
                                <v-container>
                                    <span v-for="(value, key, index) in data.item.props">
                                        <v-row v-if="['title', 'subtitle', 'name', 'value'].indexOf(key) < 0">
                                            <v-col cols="5">{{ key }}</v-col>
                                            <v-col>{{ value }}</v-col>
                                        </v-row>
                                    </span>
                                </v-container>
                            </v-tooltip>
                        </div>
                    </div>
                </v-list-item>
            </div>
        </template>
    </v-autocomplete>

    <v-dialog v-model="dialog" max-width="700">
        <template v-slot:default="{ isActive }">
            <FormEditor :key="selectedShapeIRI" :shape_iri="selectedShapeIRI" :node_idx="newNodeIdx"></FormEditor>
        </template>
    </v-dialog>



</template>

<script setup>
    import { inject, watch, onBeforeMount, ref, provide, computed} from 'vue'
    import { useRules } from '../composables/rules'
    import rdf from 'rdf-ext'
    import {SHACL, RDF, RDFS } from '@/modules/namespaces'
    import { toCURIE, getLiteralAndNamedNodes, getSubjectTriples} from '../modules/utils';
    import { useRegisterRef } from '../composables/refregister';

    // ----- //
    // Props //
    // ----- //

    const props = defineProps({
        modelValue: String,
        property_shape: Object,
        node_uid: String,
        node_idx: String,
        triple_uid: String,
        triple_idx: Number,
    })

    // ---- //
    // Data //
    // ---- //
    const localNodeUid = ref(props.node_uid)
    const newNodeIdx = ref(null)
    const formData = inject('formData');
    const graphData = inject('graphData');
    const add_empty_node = inject('add_empty_node');
    const allPrefixes = inject('allPrefixes');
    const classData = inject('classData');
    const { rules } = useRules(props.property_shape)
    var propClass = ref(null)
    const inputId = `input-${Date.now()}`;
    const { fieldRef } = useRegisterRef(inputId, props);
    const addItemList = ref(null)
    const dialog = ref(false)
    const menu = ref(false)
    const selectedShapeIRI = ref(null)
    const instanceItems = ref([])

    const cancelDialogForm = () => {
        // console.log("Canceling from form in dialog")
        dialog.value = false;
        newNodeIdx.value = null
    };
    provide('cancelFormHandler', cancelDialogForm);
    const saveDialogForm = () => {
        // console.log("Saving from form in dialog")
        dialog.value = false;
        newNodeIdx.value = null
    };
    provide('saveFormHandler', saveDialogForm);
    
    // ------------------- //
    // Computed properties //
    // ------------------- //

    const triple_object = computed({
        get() {
            return formData[localNodeUid.value][props.node_idx][props.triple_uid][props.triple_idx];
        },
        set(value) {
            formData[localNodeUid.value][props.node_idx][props.triple_uid][props.triple_idx] = value;
        }
    });

    // ----------------- //
    // Lifecycle methods //
    // ----------------- //

    onBeforeMount(() => {
        // TODO: what should the correct default value be here?
        propClass.value = props.property_shape[SHACL.class.value] ?? false
        getInstanceItems()
    })

    function getInstanceItems() {
        // ---
        // The goal of this method is to populate the list of items for the
        // InstancesSelectEditor
        // ---
        // console.log("(Re)calculating instance items")
        // find nodes with predicate rdf:type and object being the property class
        // console.log("find nodes with predicate rdf:type and object being the property class:")
        var quads = getLiteralAndNamedNodes(
            graphData,
            rdf.namedNode(RDF.type),
            propClass.value,
            allPrefixes
        )
        // then find nodes with predicate rdfs:subClassOf and object being the property class
        // TODO: here we are only using a named node for the object because this is how the
        // tools/gen_owl_minimal.py script outputs the triples in the ttl file. This should be
        // generalised
        const subClasses = rdf.grapoi({ dataset: classData })
            .hasOut(rdf.namedNode(RDFS.subClassOf.value), rdf.namedNode(propClass.value))
            .quads();
        // For each subclass, find the quads in graphData that has the class name as object
        // and RDF.type as predicate
        var myArr = []
        Array.from(subClasses).forEach(quad => {
            const cl = quad.subject.value
            // console.log(`\t - getting quads with class: ${cl}`)
            // console.log(`\t - (size of data graph: ${graphData.size})`)
            myArr = myArr.concat(getLiteralAndNamedNodes(graphData, rdf.namedNode(RDF.type), cl, allPrefixes))
        });
        // Then combine all quad arrays
        // const combinedQuads = quads.concat(savedQuads).concat(myArr);
        const combinedQuads = quads.concat(myArr);
        // Finally, create list items from quads
        var instanceItemsArr = []
        instanceItemsArr.push(
            {
                title: "Add New Item",
                props: { isButton: true, },
            }
        )
        combinedQuads.forEach(quad => {
            var extra = ''
            if (quad.subject.termType === 'BlankNode') {
                extra = ' (BlankNode)'
            }
            var relatedTrips = getSubjectTriples(graphData, quad.subject)
            var item = {
                title: quad.subject.value + extra,
                value: quad.subject.value,
                props: { subtitle: toCURIE(quad.object.value, allPrefixes) },
            }
            relatedTrips.forEach(quad => {
                item.props[toCURIE(quad.predicate.value, allPrefixes)] = toCURIE(quad.object.value, allPrefixes)
            })
            instanceItemsArr.push(item)
        });
        instanceItems.value = instanceItemsArr
    }

    watch(graphData, () => {
        // console.log("CHECK: graphdata instanceselecteditor")
        getInstanceItems()
    }, { deep: true });

    const propClassList = computed(() => {
        var items = []
        // first add main property class
        items.push(
            {
                title: toCURIE(propClass.value, allPrefixes),
                value: propClass.value
            }
        )
        const subClasses = rdf.grapoi({ dataset: classData })
            .hasOut(rdf.namedNode(RDFS.subClassOf.value), rdf.namedNode(propClass.value))
            .quads();
        
        Array.from(subClasses).forEach(quad => {
            items.push(
                {
                    title: toCURIE(quad.subject.value, allPrefixes),
                    value: quad.subject.value
                }
            )
        });
        return items
    })

    // --------- //
    // Functions //
    // --------- //

    function selectItem(item) {
        triple_object.value = item.value;
        fieldRef.value.blur();
    }

    function handleAddItemClick(item) {
        selectedShapeIRI.value = item.value
        menu.value = false;
        newNodeIdx.value = '_:' + crypto.randomUUID()
        add_empty_node(item.value, newNodeIdx.value)
        dialog.value = true;
    }

</script>

<!-- Component matching logic -->

<script>
    import { SHACL } from '@/modules/namespaces'
    export const matchingLogic = (shape) => {
        // sh:nodeKind exists
        if ( shape.hasOwnProperty(SHACL.nodeKind.value) ) {
            // sh:nodeKind == sh:IRI ||
            // sh:nodeKind == sh:BlankNodeOrIRI ||
            return [SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(shape[SHACL.nodeKind.value])
        }
        return false
    };
</script>


<style scoped>
.info-tooltip {
  cursor: pointer;
}
</style>