/**
 * 
 */

import { ClassDataset, Forms, RdfDatasetReactive, ShapesDataset } from '@/classes';
import { computed, onBeforeMount, onMounted, reactive, ref, watch} from 'vue';

export class ShaclVue {
    
    constructor(config = {}) {

        console.log("Constructing ShaclVue instance")
        console.log(`config argument:`)
        console.log(config)
        console.log(`config argument value: ${config.value}`)
        console.log(`config argument type: ${typeof config}`)
        
        this.config = config
        console.log(this.config)

    
        this.data = new RdfDatasetReactive()
        if (config.data_url) { 
            this.data.loadRDF(config.data_url)
        } else {
            this.data.graphLoaded.value = true
            this.data.prefixesLoaded.value = true
        }
        this.classes = new ClassDataset()
        if (config.class_url) {
            this.classes.loadRDF(config.class_url)
        } else {
            this.classes.graphLoaded.value = true
            this.classes.prefixesLoaded.value = true
        }
        this.shapes = new ShapesDataset()
        if (config.shapes_url) {
            this.shapes.loadRDF(config.shapes_url)
        } else {
            this.shapes.graphLoaded.value = true
            this.shapes.prefixesLoaded.value = true
        }
        this.forms = new Forms()
        this.prefixes = reactive({})
        this.ready = ref(false)
    }

    useReactiveMethods() {

        onBeforeMount( () => {
            console.log("onBeforeMount shaclvue")
            console.log(this)
        })

        onMounted( () => {
            console.log("onMounted shaclvue")
            console.log(this.config)
        })

        // const ready = ref(false)

        this.prefixesReady = computed(() => {
            return this.data.prefixesLoaded.value &&
            this.classes.prefixesLoaded.value &&
            this.shapes.prefixesLoaded.value
        });
        this.graphsReady = computed(() => {
            return this.data.graphLoaded.value &&
            this.classes.graphLoaded.value &&
            this.shapes.graphLoaded.value
        });

        watch(
            this.prefixesReady,
            (newValue, oldValue) => {
                console.log("prefixesReady changed")
                if (newValue) {
                    Object.assign(this.prefixes,
                        this.shapes.prefixes, this.data.prefixes, this.classes.prefixes
                    )
                    console.log("Prefixes ready")
                    console.log(this.prefixes)
                }
            }
        );
        watch(
            this.prefixesReady && this.graphsReady,
            (newValue, oldValue) => {
                if (newValue) {
                    this.ready.value = true
                }
            }
        );
        watch(
            this.ready,
            (newValue, oldValue) => {
                if (newValue) {
                    console.log("shaclvue ready")
                }
            }
        );
    }
}


/*

The purpose of shacl-vue is to render user interfaces from SHACL. It can:
- generate an editor (form) from a `sh:NodeShape`
- generate a viewer (display) from a `sh:NodeShape` and RDF data
- generate browser (catalog) from multiple `sh:NodeShape`s and RDF data
- allow the interplay between these functionalities, e.g. browse, select a data item, view it, edit it, save it.

To achieve this, it works with:
- for rdf data: a JS-based, in browser RDF store based on `rdf.dataset()` from the `rdf-ext` package
- for storing form inputs: an internal JS-object-based representation of RDF data



Startup process:
1. Data: load data graph from ttl
    - create a reactive rdf.dataset (with batch mode flag; and reactivity trigger)
    - load data into reactive rdf.dataset
    - save al prefixes into JS object
    - trigger reactivity at the end, and switch off batch mode
2. Classes: load class hierarchy from ttl
    - load data into rdf.dataset, only if triple predicate is rdfs:subClassOf
    - save al prefixes into JS object
3. Shapes: load shapes graph from ttl
    - load shapes into rdf.dataset
    - save al prefixes into JS object
    - work through all node shapes and get related property shapes
    - put nodes and related properties into JS object
    - put property groups into JS object
4. Forms:
    - create a reactive object
    - has many methods to be used during operation of shacl-vue


Structure of classes:

ShaclVue:
- attributes:
    - data (RDFDatasetReactive)
    - classes (RDFdataset)
    - shapes (RDFdataset)
    - forms (Reactive object)
    - prefixes (Reactive object)
- methods:
    - collectPrefixes (computed)


FormVue:
- attributes:
    - forms
- methods:
    - add_node
    - remove_node
    - clear_node
    - add_empty_triple
    - remove_triple
    - save_node (interacts with ShaclVue.data)
    - quadsToFormData (interacts with ShaclVue.data)

RDFdataset:
- attributes:
    - reactive: boolean
    - graph: rdf.dataset
    - prefixes: js object
- methods
    - create RDF dataset
    - load RDF data
        - argument for exclusion/inclusion criteria
    - many query functionalities

RDFDatasetReactive
- inherits from RDFdataset
- attributes:
    - batch_mode: boolean
- methods:
    - create reactive RDF dataset
    - trigger reactivity

ShapesDataset
- inherits from RDFdataset
- attributes:
    - propertyGroups: js object
    - nodeShapes: js object
- methods:
    - loadNodeShapes
    - findPropertyShapes
    - loadPropertyGroups

*/

