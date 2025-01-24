/**
 * 
 */

import { RdfDataset } from '@/classes/RdfDataset'
import { SHACL, RDF } from '@/modules/namespaces';
import { ref } from 'vue';

export class ShapesDataset extends RdfDataset {
    
    constructor() {
        super()
        this.propertyGroups = ref({})
        this.nodeShapes = ref({})
        this.nodeShapeNames = ref({})
        this.nodeShapeNamesArray = ref([])
        this.nodeShapeIRIs = ref(null)
    }

    onDataFn(quad) {
        this.addQuad(quad)
        const subject = quad.subject.value;
        const predicate = quad.predicate.value;
        const object = quad.object;
        // Isolate sh:NodeShape instances
        if (predicate === RDF.type.value && object.value === SHACL.NodeShape.value) {
            this.nodeShapes.value[subject] = {properties: []};
        }
        // Get properties of node shapes
        if (predicate === SHACL.property.value) {
            this.nodeShapes.value[subject].properties.push(object);
        }
        // Get property groups, if any
        if (predicate === RDF.type.value && object.value === SHACL.PropertyGroup.value) {
            this.propertyGroups.value[subject] = {};
        }
    }

    async onDataEndFn() {
        // Loop through all nodeshapes to restructure them
        for (const [key, val] of Object.entries(this.nodeShapes.value)) {
            // Get attributes (other than 'properties') of the nodeshape
            this.graph.forEach(quad => {
                if (quad.subject.value === key && quad.predicate.value != SHACL.property.value) {
                    // Check if the object is a blank node and resolve it
                    if (quad.object.termType === 'BlankNode') {
                        this.nodeShapes.value[key][quad.predicate.value] = this.resolveBlankNode(quad.object);
                    } else {
                        this.nodeShapes.value[key][quad.predicate.value] = quad.object.value;
                    }
                }
            });
            // Loop through property elements, i.e. blank nodes, and set correct attributes
            for (var i = 0; i < val.properties.length; i++) {
                var node = val.properties[i];
                if (node.termType === "BlankNode") {
                    // If it's a blank node, resolve it
                    // console.log(`Resolving blank node: ${node.value}`);
                    val.properties[i] = this.resolveBlankNode(node);
                } else {
                    // Non-blank nodes are kept as they are, but eventually store only their `.value`
                    var new_node = {};
                    this.graph.forEach((quad) => {
                        if (quad.subject.value === node.value) {
                            new_node[quad.predicate.value] = quad.object.value; // Store only .value
                        }
                    });
                    val.properties[i] = new_node;
                }
            }
        }
        for (const iri of Object.keys(this.nodeShapes.value)) { 
            var parts = iri.split('/')
            this.nodeShapeNames.value[parts[parts.length - 1]] = iri
        }
        this.nodeShapeNamesArray.value = Object.keys(this.nodeShapeNames.value).sort()
        this.nodeShapeIRIs.value = Object.keys(this.nodeShapes.value).sort()
        // Now handle the (possibility of) property groups
        for (const [key, value] of Object.entries(this.propertyGroups.value)) {
            this.graph.forEach(quad => {
                if (quad.subject.value === key && quad.predicate.value != RDF.type.value ) {
                    this.propertyGroups.value[key][quad.predicate.value] = quad.object.value
                }
            });
        }
        this.serializedGraph.value = await this.serializeGraph()
        this.graphLoaded.value = true
    }
}