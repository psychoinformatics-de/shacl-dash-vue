<!--
    This BaseEditor component is designed as a building block for creating custom
    input components. It provides a consistent API and structure for both the parent
    component that uses it and for developers who extend it. By extending this base
    component, developers can focus on the unique aspects of their custom components
    (such as a combination of specific input types or complex logic) while inheriting
    standardized behavior for common tasks like data synchronization, validation, and
    error management.

    Follow these steps to create a custom input component that extends the BaseEditor
    component. This assumes you are familiar with Vue.js and Vuetify, as well as the
    Composition API:

    - create a new .vue file in your components directory, for example: MyCustomEditor.vue
    - in the template section, use the BaseEditor component as the primary wrapper
    - pass the required props to BaseEditor that control its behavior: v-model,
      label, rules, value-parser, and value-combiner. These props allow the parent
      component to interact with your custom component.
    - define all of your custom components within the names "inputs" slot:
      `<template #inputs="{ subValues }"></template>`
    - subcomponent values should be v-modeled using unique keys on the named slot's
      `subValues` prop; for example v-model a v-text-field to `subValues.customTextField`
      - implement the valueParser and valueCombiner functions that transform the parent
      v-model value "internalValue" into subcomponent values and vice versa.
    - TODO: include description of rules and validation
    - TODO: include description of matching (although this is not influenced by the BaseEditor)

-->

<template>
    <!-- v-input is used as the wrapper component for all editor/input components -->
    <v-input
        v-model="internalValue"
        :error="computedError"
        :error-messages="computedErrorMessages"
        class="base-editor"
    >
        <!-- The default slot template provides scoped props for custom behaviour -->
        <template #default="{ isFocused, isDirty }">
            <v-row no-gutters>
                <!-- Custom inputs are passed in via the named slot "inputs".
                     This is the meat for extending the BaseEditor component -->
                <!-- Automatically binds the input handler to the input event -->
                <slot name="inputs" :subValues="subValues" :bind-input="bindInput"></slot>
            </v-row>
        </template>
    </v-input>
</template>
  
<script setup>
    import { useBaseInput } from '@/composables/baseinput';
    import { computed } from 'vue';

    /**
     * Props for the BaseEditor component.
     * @typedef {Object} BaseEditorProps
     * @property {string|number|Object} modelValue - The value bound to v-model.
     * @property {Array} [rules] - An array of validation rules for the input.
     * @property {Function} valueParser - A function to parse the modelValue into subcomponent values.
     * @property {Function} valueCombiner - A function to combine subcomponent values into the modelValue.
     */

    /**
     * Emits for the BaseEditor component.
     * @typedef {Object} BaseEditorEmits
     * @property {Function} update:modelValue - Emits when the value changes.
     */

    // Define props and emits
    const props = defineProps({
        modelValue: [String, Number, Object],
        rules: Array,
        valueParser: Function,
        valueCombiner: Function
    });
    const emit = defineEmits(['update:modelValue']);

    // Use the composable to manage the custom input logic
    const { subValues, internalValue, updateValue } = useBaseInput(
        props,
        emit,
        props.valueParser,
        props.valueCombiner
    );

    /**
     * Computes whether the input has validation errors based on the provided rules.
     * @returns {boolean} True if there's any validation error, otherwise false.
     */
    const computedError = computed(() => {
        return props.rules?.some(rule => rule(internalValue.value) !== true);
    });

    /**
     * Computes the list of error messages based on the validation rules.
     * @returns {Array} An array of error messages.
     */
    const computedErrorMessages = computed(() => {
        return props.rules?.map(rule => rule(internalValue.value)).filter(msg => msg !== true) || [];
    });

    /**
     * Automatically bind input events to the updateValue function for custom inputs.
     * @param {Object} element - The Vue component instance of the input element.
     */
    function bindInput(element) {
        if (element && element.props && !element.props.onInput) {
            element.props.onInput = updateValue;
        }
    }
</script>


<style scoped>
    .base-editor {
    /* Custom styling for the base component */
    }
</style>