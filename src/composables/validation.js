/**
 * @module validation.js
 * @description This composable 
 */

import rdfDataModel from '@rdfjs/data-model'
import { Validator } from 'shacl-engine'
// import { reactive, ref, onBeforeMount} from 'vue'
// import { readRDF } from '@/modules/io'
// import {SHACL, RDF} from '@/modules/namespaces';

export function useValidation() {

    async function validateData(dataGraph, shapesGraph) {
        const validator = new Validator(shapesGraph, { factory: rdfDataModel, coverage: true });

        console.log("Constructed validator:")

        console.log(validator)
        const report = await validator.validate({dataset: dataGraph});
        if (report.conforms) {
            console.log('valid data');
        } else {
            console.log('validation failed:');
            for (const result of report.results) {
                console.log(result)    
            console.log(`Focus Node: ${result.focusNode.value}`);
            console.log(`Severity: ${result.severity.value}`);
            console.log(`Message: ${result.message ? result.message.value : 'no message'}`);
            console.log(result.message)
            }
        }
    }

    function validateForm(dataGraph, shapesGraph) {
        validateData(dataGraph, shapesGraph)
            .then(() => console.log('Validation complete'))
            .catch((error) => console.error('Validation error:', error));
    }
    // ------- //
    // Returns //
    // ------- //
	return {
        validateForm
    }

}








