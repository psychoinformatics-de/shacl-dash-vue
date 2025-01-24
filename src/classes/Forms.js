/**
 * 
 */

import { reactive, toRaw } from 'vue'
import rdf from 'rdf-ext';
import { isEmptyObject } from '@/modules/utils';
import {SHACL, RDF } from '@/modules/namespaces'

export class Forms {

	constructor() {
		this.content = reactive({})
	}

	add_node(nodeshape_iri, node_iri) {
		// if the node shape IRI does not exist in the formData lookup object yet, add it
		// if the node shape IRI already exists in the formData lookup object:
		// - if the specific iri does not exists, add it
		// - if the specific iri exists do nothing
		if (Object.keys(this.content).indexOf(nodeshape_iri) < 0) {
			// The added value is an object; to allow adding multiple of the same node type,
			// unique subject IRIs (from named or blank nodes) will be the unique keys of the object
			this.content[nodeshape_iri] = reactive({})
		}
		if (Object.keys(this.content[nodeshape_iri]).indexOf(node_iri) < 0) {
			// The added value is an object with keys == predicates and values being arrays
			// that can take multiple object values
			// TODO: this needs to be trialed because unsure whether this or alternative is more suitable
			// alternative could be having an object with both keys and values being the object, or
			// keys being numeric and sequential, and values being object values
			this.content[nodeshape_iri][node_iri] = reactive({})
		}
	}

	remove_node(nodeshape_iri, node_iri) {
		// Error: if the node shape iri does not exist in the lookup object
		if (Object.keys(this.content).indexOf(nodeshape_iri) < 0) {
			console.error(`Trying to delete a node of a shape that does not exist in form data:\n${nodeshape_iri}`)
		}
		// Error: if the node iri does not exist in the lookup object
		else if (Object.keys(this.content[nodeshape_iri]).indexOf(node_iri) < 0) {
			console.error(`Trying to delete a node that does not exist in form data:\n${nodeshape_iri} - ${node_iri}`)
		}
		// remove node instance at provided iri
		// if node object is empty after instance removal, remove node key as well
		else {
			delete this.content[nodeshape_iri][node_iri]
			if (isEmptyObject(this.content[nodeshape_iri])) { delete this.content[nodeshape_iri] }
		}
	}


	clear_node(nodeshape_iri, node_iri) {
		// Error: if the node key does not exist in the lookup object
		if (Object.keys(this.content).indexOf(nodeshape_iri) < 0) {
			console.error(`Trying to clear a node of a shape that does not exist in form data:\n${nodeshape_iri}`)
		}
		// Error: if the node idx does not exist in the lookup object
		else if (Object.keys(this.content[nodeshape_iri]).indexOf(node_iri) < 0) {
			console.error(`Trying to clear a node that does not exist in form data:\n${nodeshape_iri} - ${node_iri}`)
		}
		// clear node instance at provided index
		else {
			this.objectKeysToNull(this.content[nodeshape_iri][node_iri])
		}
	}


	objectKeysToNull(obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
			obj[key] = reactive([null])
			}
		}
	}


	add_empty_triple(nodeshape_iri, node_iri, triple_uid) {
		// console.log(`Adding empty triple:\nnodeshape_iri: ${nodeshape_iri}\nnode_iri: ${node_iri}\ntriple_uid: ${triple_uid}`)
		// if the node shape+iri exist and the triple uid (predicate) does not exist, add it
		// if the node shape+iri exist and the triple uid already exists, add empty value to array
		// if the node shape+iri do not exist, print console error because this should not be possible
		if (Object.keys(this.content).indexOf(nodeshape_iri) >= 0 && Object.keys(this.content[nodeshape_iri]).indexOf(node_iri) >= 0) {
			// Current node being edited at IRI
			if (Object.keys(this.content[nodeshape_iri][node_iri]).indexOf(triple_uid) < 0) {
				this.content[nodeshape_iri][node_iri][triple_uid] = reactive([null])
			} else {
				this.content[nodeshape_iri][node_iri][triple_uid].push(null)
			}
		} else {
			console.error(`Node shape and/or node IRI not in this.content yet:\n${nodeshape_iri} - ${node_iri}\nCannot add triple to non-existing node.`)
		}
	}


	remove_triple(nodeshape_iri, node_iri, triple_uid, triple_idx) {
		if (Object.keys(this.content).indexOf(nodeshape_iri) >= 0 && Object.keys(this.content[nodeshape_iri]).indexOf(node_iri) >= 0) {
			// Current node being edited at index
			if (Object.keys(this.content[nodeshape_iri][node_iri]).indexOf(triple_uid) < 0) {
				console.error(`Triple UID ${triple_uid} not in specific node IRI instance in this.content:\n${nodeshape_iri} - ${node_iri}\nCannot remove non-existing triple.`)
			} else {
				this.content[nodeshape_iri][node_iri][triple_uid].splice(triple_idx, 1)
			}
		} else {
			console.error(`Node shape and/or node IRI not in this.content yet:\n${nodeshape_iri} - ${node_iri}\nCannot remove triple from non-existing node.`)
		}
	}


	save_node(nodeshape_iri, node_iri, nodeShapes, graphData, editMode, ID_IRI) {
		// Check if the node exists beforehand
		console.log(`Saving node of shape: ${nodeshape_iri}`)
		var changeNodeIdx = false
		var rereferenceTriples = false
		var subject_iri = null
		if (this.content[nodeshape_iri]) {
			// console.log("Node has entry in this.content")
			// console.log(`Current node value: ${this.content[nodeshape_iri].at(-1)}`)

			// If we are in edit more, the first step is to delete existing quads from graphData
			if (editMode) {
				console.log("saving while in edit mode -> delete preexisting quads from dataset")
				graphData.graph.deleteMatches(rdf.namedNode(node_iri), null, null, null)
			}

			var shape = nodeShapes[nodeshape_iri]
			// console.log(`Node shape: ${shape}`)
			var properties = shape.properties
			// Subject should either be a named node or blank node
			// - named node if any of the properties is an ID (as defined by some IRI as constant or from config, see declarations above)
			// - blank node if no ID found
			var subject
			if (Object.keys(this.content[nodeshape_iri][node_iri]).indexOf(ID_IRI) >= 0) {
				// console.log(`\t- node instance has ID field: ${this.content[nodeshape_iri][node_iri][ID_IRI][0]}`)
				subject_iri = this.content[nodeshape_iri][node_iri][ID_IRI][0]
				subject = rdf.namedNode(subject_iri)
				changeNodeIdx = true
			} else {
				// console.log(`\t- node instance DOES NOT have ID field`)
				subject = rdf.blankNode(node_iri) // node_iri is created with crypto.randomUUID(), so it is unique
			}
			// Add the first quad, specifying rdf-type of the node
			let firstQuad = rdf.quad(subject, rdf.namedNode(RDF.type.value), rdf.namedNode(nodeshape_iri))
			console.log(`Adding quad to data graph:\n${firstQuad.toString()}`)
			graphData.graph.add(firstQuad)
			// Now: loop through all keys, i.e. properties of shape, i.e. triple predicates
			for (var pred of Object.keys(this.content[nodeshape_iri][node_iri])) {
				// console.log(`\t- processing predicate: ${pred}`)
				// Only process entered values
				if (Array.isArray(this.content[nodeshape_iri][node_iri][pred]) &&
					this.content[nodeshape_iri][node_iri][pred].length == 1 &&
					this.content[nodeshape_iri][node_iri][pred][0] === null) {
					// console.log("Node predicate has no value, skipping")
					continue;
				}
				// Don't add ID quad:
				if (pred == ID_IRI) {
					continue;
				}
				var predicate = rdf.namedNode(pred)
				// Find associated property shape, for information about nodekind
				var property_shape = properties.find((prop) => prop[SHACL.path.value] == pred)
				var nodeFunc = null
				var dt = null
				if (property_shape.hasOwnProperty(SHACL.nodeKind.value)) {
					// options = sh:BlankNode, sh:IRI, sh:Literal, sh:BlankNodeOrIRI, sh:BlankNodeOrLiteral, sh:IRIOrLiteral
					// sh:nodeKind == sh:Literal
					if (property_shape[SHACL.nodeKind.value] == SHACL.Literal.value) {
						nodeFunc = rdf.literal
						// sh:datatype exists
						if (property_shape.hasOwnProperty(SHACL.datatype.value)) {
							dt = property_shape[SHACL.datatype.value]
						}
					} else if ([SHACL.IRI.value, SHACL.BlankNodeOrIRI.value].includes(property_shape[SHACL.nodeKind.value])) {
						nodeFunc = rdf.namedNode
					} else {
						console.error(`\t- NodeKind not supported: ${property_shape[SHACL.nodeKind.value]}\n\t\tAdding triple with literal object to graphData`)
						nodeFunc = rdf.literal
					}
				} else if (property_shape.hasOwnProperty(SHACL.in.value)) {
					// This is a temporary workaround; should definitely not be permanent
					// Assume Literal nodekind for any arrays
					nodeFunc = rdf.literal

				}
				else {
					console.error(`\t- NodeKind not found for property shape: ${pred}\n\tCannot add triple to graphData. Here's the full property shape:`)
					console.error(property_shape)
				}

				// Loop through all elements of the array with triple objects
				for (var obj of this.content[nodeshape_iri][node_iri][pred]) {
					let triple_object
					if (dt) {
						triple_object = nodeFunc(String(obj), dt)
					} else {
						triple_object = nodeFunc(obj)
					}
					let quad = rdf.quad(subject, predicate, triple_object)
					// console.log(`Adding quad to data graph:\n${quad.toString()}`)
					graphData.graph.add(quad)
				}
			}
			// If this was in editmode and the node IRI has been altered,
			// i.e. node_iri is not the same as the new value in this.content,
			// then we need to RE-reference existing triples in the graph that has the current node_iri as object.
			// This is only necessary for namedNodes where the IRI changed. The process is:
			// - only do the following if the node is a namedNode and if the IRI changed during editing
			// - find all triples with the node IRI as object -> oldTriples
			// - for each triple in oldTriples: create a new one with same subject and predicate
			//   and with new IRI as object, then delete the old triple
			if (editMode && subject_iri !== null && subject_iri !== node_iri) {
				var objectQuads = graphData.getObjectTriples(rdf.namedNode(node_iri))
				objectQuads.forEach((quad) => {
					let new_quad = rdf.quad(quad.subject, quad.predicate, subject)
					graphData.graph.delete(quad)
					graphData.graph.add(new_quad)
				});
			}

			// Change this.content node_iri to the actual id, if this was present:
			if (changeNodeIdx && subject_iri !== node_iri) {
				this.content[nodeshape_iri][subject_iri] = reactive(structuredClone(toRaw(this.content[nodeshape_iri][node_iri])))
				delete this.content[nodeshape_iri][node_iri]
			}
			// at the end, what to do with current data in this.content? delete node element?
		} else {
			console.error(`\t- Node ${nodeshape_iri} does not exist`)
		}
	}


	quadsToFormData(nodeshape_iri, subject_term, graphData, ID_IRI) {
		// Subject term should be namedNode or blankNode
		var node_iri = subject_term.value
		this.add_node(nodeshape_iri, node_iri)
		// Get all triples with the term as subject, and add to this.content
		// NOTE: these triples added to this.content are only the ones that exist in graphData
		// i.e. only the values that the subject has been annotated with. The node shape
		// defines all properties that the node could have, of which the actual existing
		// properties are only a subset. This means that the `add_empty_triple` call below
		// is not populating all possible empty properties for the node, such that the form
		// can be edited in full. At the moment, this task is left to the `add_empty_triple`
		// call that is done in `onMounted` of the `PropertyShapeEditor` component. It is
		// to be determined whether this is the best way forward. But it works for now.
		// TODO ^^

		// Another TODO: the ID property of the node is not necessarily existing explicitly
		// as a triple in the graph. Refer to the `save_node` function above, where the quad
		// with the ID_IRI as predicate is not added to the graph when this.content is saved.
		// For the current `quadsTothis.content` function, the reverse process is important
		// to keep in mind, i.e. because the ID_IRI quad does not exist in the graph,
		// the corresponding field in this.content has to be set explicitly from the subject_term,
		// because it won't be covered in the `quadArray.forEach` loop.
		var quadArray = graphData.getSubjectTriples(subject_term)
		var IdQuadExists = false
		quadArray.forEach((quad) => {
			var triple_uid = quad.predicate.value
			if (triple_uid === ID_IRI) {
				IdQuadExists = true
			}
			this.add_empty_triple(nodeshape_iri, node_iri, triple_uid)
			var length = this.content[nodeshape_iri][node_iri][triple_uid].length
			this.content[nodeshape_iri][node_iri][triple_uid][length - 1] = quad.object.value
		});
		// Here we deal with explicitly adding the ID_IRI quad, if necessary
		if (subject_term.termType === "NamedNode" && !IdQuadExists) {
			this.add_empty_triple(nodeshape_iri, node_iri, ID_IRI)
			var l = this.content[nodeshape_iri][node_iri][ID_IRI].length
			this.content[nodeshape_iri][node_iri][ID_IRI][l - 1] = node_iri
		}
	}

}