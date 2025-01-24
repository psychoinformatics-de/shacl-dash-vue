/**
 * 
 */

import rdf from 'rdf-ext';
import { readRDF } from '@/modules/io'
import { RDF, XSD } from '@/modules/namespaces';
import { toCURIE } from '@/modules/utils';
import { ref, reactive} from 'vue';
import formatsPretty from '@rdfjs/formats/pretty.js'

export class RdfDataset {

    constructor() {
        this.rdfPretty = rdf.clone()
        this.rdfPretty.formats.import(formatsPretty)
        this.prefixes = reactive({})
        this.serializedGraph = ref('')
        this.graphLoaded = ref(false)
        this.prefixesLoaded = ref(false)
        this.graph = this.createDataset()
    }

    createDataset() {
        return rdf.dataset()
    }
    
    async loadRDF(url) {
        this.beforeLoadFn()
        readRDF(url)
		.then(quadStream => {
			// Load prefixes
			quadStream.on('prefix', (prefix, ns) => {
                this.onPrefixFn(prefix, ns)
			}).on('end', () => {
                this.onPrefixEndFn()
			})
			// Load data
			quadStream.on('data', quad => {
				this.onDataFn(quad)
			}).on('end', async () => {
                await this.onDataEndFn()
            });
		})
		.catch(error => {
			console.error('Error reading RDF data:', error);
		});
    }

    beforeLoadFn() {
        this.graphLoaded.value = false
    }

    onPrefixFn(prefix, ns) {
        this.prefixes[prefix] = ns.value;
    }

    onPrefixEndFn() {
        this.prefixesLoaded.value = true
    }

    onDataFn(quad) {
        this.addQuad(quad)
    }

    addQuad(quad) {
        this.graph.add(quad)
    }

    async onDataEndFn() {
        this.serializedGraph.value = await this.serializeGraph()
        this.graphLoaded.value = true
    }

    async serializeGraph() {
        return (await this.rdfPretty.io.dataset.toText('text/turtle', this.graph)).trim()
    }

    isRdfList(node) {
        // Check if a node is an RDF list (rdf:first and rdf:rest)
        let hasFirst = false;
        let hasRest = false;
        this.graph.forEach((quad) => {
            if (quad.subject.equals(node)) {
                if (quad.predicate.value === RDF.first.value) hasFirst = true;
                if (quad.predicate.value === RDF.rest.value) hasRest = true;
            }
        });
        return hasFirst && hasRest;
    };
    
    rdfListToArray(startNode) {
        // Convert an RDF list into an array
        const listItems = [];
        let currentNode = startNode;
    
        while (currentNode && currentNode.value !== RDF.nil.value) {
            let listItem = null;
    
            // Get the first element in the RDF list
            this.graph.forEach((quad) => {
                if (quad.subject.equals(currentNode) && quad.predicate.value === RDF.first.value) {
                    // Resolve blank nodes recursively, but handle literals and IRIs separately
                    if (quad.object.termType === "BlankNode") {
                        listItem = this.resolveBlankNode(quad.object, this.graph);
                    } else if (quad.object.termType === "Literal") {
                        listItem = quad.object.value; // Store literal value
                    } else if (quad.object.termType === "NamedNode") {
                        listItem = quad.object.value; // Store IRI as a string
                    }
                }
            });
            if (listItem !== null) {
                listItems.push(listItem);
            }
            // Move to the next item in the list (rdf:rest)
            let nextNode = null;
            this.graph.forEach((quad) => {
                if (quad.subject.equals(currentNode) && quad.predicate.value === RDF.rest.value) {
                    nextNode = quad.object;
                }
            });
            currentNode = nextNode;
        }
        return listItems;
    };
    
    resolveBlankNode(blankNode) {
        let resolvedObject = {};
        this.graph.forEach((quad) => {
            if (quad.subject.equals(blankNode)) {
                const predicate = quad.predicate.value;
                const object = quad.object;
    
                // If the object is a blank node, resolve it recursively
                if (object.termType === "BlankNode") {
                    // Check if it's an RDF list and convert it to an array
                    if (this.isRdfList(object)) {
                        resolvedObject[predicate] = this.rdfListToArray(object);
                    } else {
                        resolvedObject[predicate] = this.resolveBlankNode(object);
                    }
                } else if (object.termType === "Literal") {
                    resolvedObject[predicate] = object.value; // Handle literal values
                } else if (object.termType === "NamedNode") {
                    resolvedObject[predicate] = object.value; // Handle IRIs as strings
                }
            }
        });
        return resolvedObject;
    }

    getLiteralAndNamedNodes(predicate, propertyClass, prefixes) {
        var propClassCurie = toCURIE(propertyClass, prefixes)
        // a) use the literal node with xsd data type
        const literalNodes = rdf.grapoi({ dataset: this.graph })
            .hasOut(predicate, rdf.literal(String(propClassCurie), XSD.anyURI))
            .quads();
        // b) and the named node
        const uriNodes = rdf.grapoi({ dataset: this.graph })
            .hasOut(predicate, rdf.namedNode(propertyClass))
            .quads();
        // return as a concatenated array of quads
        return Array.from(literalNodes).concat(Array.from(uriNodes))
    }
    
    getSubjectTriples(someTerm) {
        const quads = rdf.grapoi({ dataset: this.graph, term: someTerm }).out().quads();
        return Array.from(quads)
    }
    
    getObjectTriples(someTerm) {
        const quads = rdf.grapoi({ dataset: this.graph, term: someTerm }).in().quads();
        return Array.from(quads)
    }
}
