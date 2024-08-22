<template>
    <BaseEditor
        v-model="internalValue" 
        :value-parser="parseValue"
        :value-combiner="combineValues"
    >
        <template #inputs="{ subValues }">
            <v-col cols="6">
                <v-text-field
                v-model="subValues.part1"
                label="Part 1"
                ></v-text-field>
            </v-col>
            <v-col cols="6">
                <v-select
                v-model="subValues.part2"
                :items="selectItems"
                label="Part 2"
                ></v-select>
            </v-col>
        </template>
    </BaseEditor>
    BaseEditor v-model value: {{ internalValue }}
</template>
  
<script setup>
  import BaseEditor from '@/components/BaseEditor.vue';
//   import { useBaseInput } from '@/composables/baseinput';
  import { ref, watch, onBeforeMount} from 'vue'
  
  const props = defineProps({
    modelValue: String,
    property_shape: Object,
    node_uid: String,
    triple_uid: String
    
  });
  const emit = defineEmits(['update:modelValue']);

  // Internal reactive state
    const internalValue = ref(props.modelValue);

    // Watch for changes in modelValue prop
    watch(() => props.modelValue, (newValue) => {
        internalValue.value = newValue;
    });
    // Emit updates to parent
    watch(internalValue, (newValue) => {
        emit('update:modelValue', newValue);
    });
//   const { internalValue } = useBaseInput(
//         props,
//         emit,
//         parseValue,
//         combineValues
//     );

  const selectItems = ["kaas", "koek", "moer"]

  onBeforeMount(() => {
        console.log("...BeforeMount CustomSimple....")
        console.log(props.modelValue)
    })
  
  // Parse the combined value into subcomponent values
  function parseValue(value) {
    if (value) {
        const [part1, part2] = value.split('-');
        return { part1: part1 || '', part2: part2 || '' };
    } else {
        return { part1: '', part2: '' };
    }
  }
  
  // Combine subcomponent values into a single value
  function combineValues(values) {
    return `${values.part1}-${values.part2}`;
  }

</script>
  