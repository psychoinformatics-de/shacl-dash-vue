import { SHACL, RDF, XSD } from '../modules/namespaces'
import rdf from 'rdf-ext';


export function toCURIE(IRI, prefixes, return_type) {
	// prefixes is an object with prefix as keys and the resolved prefix IRI as the value
	// console.log("inside toCURIRE")
	// console.log(IRI)
	// console.log(prefixes)
	// console.log(return_type)
	if (!IRI) {
		return null
	}
	if (!prefixes) {
		console.log("no prefixes passed!!")
	}
	const longToShort = Object.values(prefixes).sort((a, b) => b.length - a.length);
	for (const iri of longToShort) {
		if (IRI.indexOf(iri) >= 0) {
			const prefix = objectFlip(prefixes)[iri]
			const property = IRI.substring(iri.length)
			if (return_type == "parts") {
				return {
					"prefix": prefix,
					"property": property,
				}
			} else {
				return prefix + ':' + property
			}
		}
	}
	return IRI
}


export function toIRI(CURIE, prefixes) {
	// prefixes is an object with prefix as keys and the resolved prefix IRI as the value
	if (!CURIE) {
		return null
	}
	if (!prefixes) {
		console.error("no prefixes passed!!")
		return null
	}
	if (CURIE.indexOf(':') < 0) {
		console.log("not a valid curie, returning")
		return CURIE
	}
	var parts = CURIE.split(':')
	var pref = parts[0]
	var prop = parts[1]
	if (Object.keys(prefixes).indexOf(pref) < 0) {
		console.log("unknown prefix in curie, returning")
		return CURIE
	}
	return prefixes[pref] + prop
}


export function nameOrCURIE(shape, prefixes) {
	if (shape.hasOwnProperty(SHACL.name.value)) {
		return shape[SHACL.name.value]
	} else {
		return toCURIE(shape[SHACL.path.value], prefixes)
	}
}


export function orderArrayOfObjects(array, key) {
	// Returns an array of objects ordered by the value of a specific key 
	return array.sort((a, b) => a[key] - b[key])
}


function objectFlip(obj) {
	// Flip the keys and values of an object
	return Object.keys(obj).reduce((ret, key) => {
		ret[obj[key]] = key;
		return ret;
	}, {});
}


export function isObject(val) {
	return typeof val === 'object' && !Array.isArray(val) && val !== null
}


export function isEmptyObject(obj) {
	for (const prop in obj) {
		if (Object.hasOwn(obj, prop)) {
			return false;
		}
	}
	return true;
}

export function dlJSON(jsonObject) {
	// Data
	const jsonString = JSON.stringify(jsonObject);
	const blob = new Blob([jsonString], { type: "application/json" });
	// Create a link element
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "data.json";
	document.body.appendChild(link);
	// Click to download, and remove
	link.click();
	document.body.removeChild(link);
}

export function dlTTL(ttlstring) {
	// Data
	const blob = new Blob([ttlstring], { type: "text/turtle" });
	// Create a link element
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = "graphdata.ttl";
	document.body.appendChild(link);
	// Click to download, and remove
	link.click();
	document.body.removeChild(link);
}


export function downloadTSV(data, filename) {
	const blob = new Blob([data], { type: 'text/tsv;charset=utf-8;' });
	const link = document.createElement('a');
	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}