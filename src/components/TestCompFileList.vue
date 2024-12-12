<template>
    <v-container fluid>
        <v-btn 
            prepend-icon="mdi-folder"
            @click="selectDirectory"
        >Annotate data</v-btn>

        <input
        ref="fileInput"
        type="file"
        webkitdirectory
        multiple
        hidden
        @change="handleFiles"
        />

        <ul>
            <li v-for="file in files" :key="file">{{ file }}</li>
        </ul>
    </v-container>
</template>

<script setup>
    import {ref} from 'vue'
    import { useRules } from '../composables/rules'
    import { useRegisterRef } from '../composables/refregister';
    import { useBaseInput } from '@/composables/base';

    const fileInput = ref(null)
    const files = ref([])

    function selectDirectory() {
        console.log("bla")
        fileInput.value.click()
    }

    function handleFiles(event) {
        console.log("handling files")
      const fileList = Array.from(event.target.files);
      files.value = fileList.map((file) => file.webkitRelativePath);
    }

    async function listAllFilesAndDirs(dirHandle) {
        const files = [];
        for await (let [name, handle] of dirHandle) {
            const {kind} = handle;
            if (handle.kind === 'directory') {
                files.push({name, handle, kind});
                files.push(...await listAllFilesAndDirs(handle));
            } else {
                files.push({name, handle, kind});
            }
        }
        return files;
    }

    async function onClickHandler(e) {
        try {
            const directoryHandle = await window.showOpenFilePicker()
            const files = await listAllFilesAndDirs(directoryHandle);
            console.log('files', files);
        }catch(e) {
            console.log(e);
        }
    }

</script>

