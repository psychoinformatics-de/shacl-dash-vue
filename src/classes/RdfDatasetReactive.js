/**
 * 
 */

import rdf from 'rdf-ext';
import { RdfDataset } from '@/classes/RdfDataset'
import { reactive, ref } from 'vue'

export class RdfDatasetReactive extends RdfDataset {
    
    constructor() {
        super()
    }

    createDataset() {
        console.log("CreateDataset function of RdfDatasetReactive")
        this.batchMode = ref(false)
        // This overrides the super method and is called in the constructor
        return this.createReactiveDataset()
    }

    createReactiveDataset() {
        const dataset = rdf.dataset();
        const self = this;
        const proxy = new Proxy(dataset, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (typeof value === 'function' &&
                    [
                        'add', 
                        'delete',
                        'deleteMatches',
                        'toCanonical',
                        'toStream',
                        'toString'
                    ].includes(prop)
                ) {
                    return function (...args) {
                        const result = value.apply(target, args);
                        if (!self.batchMode.value) {
                            // Trigger reactivity when dataset is mutated
                            self.triggerReactivity(); 
                        }
                        return result;
                    };
                }
                return value;
            }
        });
        // Initialize the dummy property to ensure reactivity
        proxy._dummy = false;
        return reactive(proxy);
    }
    
    beforeLoadFn() {
        this.graphLoaded.value = false
        this.batchMode.value = true
    }

    async onDataEndFn() {
        this.serializedGraph.value = await this.serializeGraph()
        this.triggerReactivity()
        this.batchMode.value = false
        this.graphLoaded.value = true
    }

    triggerReactivity() {
        // Toggle the dummy property to trigger reactivity
        this.graph._dummy = !this.graph._dummy;
    }
          
}