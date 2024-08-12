<script setup>
    import axios from 'axios';
    import { ref, watchEffect, computed } from 'vue';

    const props = defineProps(['contact', 'chatLimitReached']);
    const processingForm = ref(null);
    const formTextInput = ref(null);
    const form = ref({
        'uuid' : props.contact.uuid,
        'message' : null,
        'type' : null,
        'file' : null
    })

    watchEffect(() => {
        form.value.uuid = props.contact.uuid;
    });

    const emit = defineEmits(['response']);

    const sendMessage = async() => {
        form.value.message = formTextInput.value;
        const formData = new FormData();

        formData.append('message', form.value.message);
        formData.append('type', form.value.type);
        formData.append('uuid', form.value.uuid);

        if (form.value.file) {
            formData.append('file', form.value.file);
        }

        processingForm.value = true;

        try {
            const response = await axios.post('/chats', formData);

            form.value.message = null;
            formTextInput.value = null;
            form.value.file = null;

            processingForm.value = false;
        } catch (error) {
            // Handle the error
            // console.error('Error:', error);
        }

        /*form.post('/chats', {
            onSuccess: () => {
                form.reset();
            },
            preserveState: false,
            preserveScroll: true
        });*/
    }

    const textInputRef = ref(null);
    const adjustTextareaHeight = () => {
        const textInput = textInputRef.value;
        textInput.style.height = 'auto';
        textInput.style.height = textInput.scrollHeight + 'px';
    };

    const handleEnterKey = (event) => {
        if (formTextInput.value != null && formTextInput.value.trim() != '') {
            sendMessage();
        }
    };

    const isInboundChatWithin24Hours = computed(() => {
        if (props.contact.last_inbound_chat) {
            const lastInboundChatTime = new Date(props.contact.last_inbound_chat.created_at);
            const currentTime = new Date();
            const timeDifference = currentTime - lastInboundChatTime;

            return timeDifference < 24 * 60 * 60 * 1000;
        }

        return false;
    });

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            form.value.file = file;
            sendMessage();
        };
        reader.readAsDataURL(file);
    }

    const getAcceptedFileTypes = () => {
        switch (form.value.type) {
            case 'image':
                return '.jpg, .png';
            case 'document':
                return '.txt, .pdf, .ppt, .doc, .xls, .docx, .pptx, .xlsx';
            case 'audio':
                return '.mp3, .ogg';
            case 'video':
                return '.mp4';
            default:
                return ''; // Empty string allows all file types
        }
    }
</script>
<template>
    <div v-if="props.chatLimitReached" class="flex justify-center items-center w-full px-6 md:px-4">
        <div class="flex items-start space-x-4 bg-orange-100 rounded-lg p-2 mb-2 px-4">
            <span class="text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 36 36"><path fill="currentColor" d="M18 21.32a1.3 1.3 0 0 0 1.3-1.3V14a1.3 1.3 0 1 0-2.6 0v6a1.3 1.3 0 0 0 1.3 1.32Z" class="clr-i-outline clr-i-outline-path-1"/><circle cx="17.95" cy="24.27" r="1.5" fill="currentColor" class="clr-i-outline clr-i-outline-path-2"/><path fill="currentColor" d="M30.33 25.54L20.59 7.6a3 3 0 0 0-5.27 0L5.57 25.54A3 3 0 0 0 8.21 30h19.48a3 3 0 0 0 2.64-4.43Zm-1.78 1.94a1 1 0 0 1-.86.49H8.21a1 1 0 0 1-.88-1.48l9.74-17.94a1 1 0 0 1 1.76 0l9.74 17.94a1 1 0 0 1-.02.99Z" class="clr-i-outline clr-i-outline-path-3"/><path fill="none" d="M0 0h36v36H0z"/></svg>
            </span>
            <div>
                <div class="text-sm">{{ $t('Maximum chat limit reached') }}</div>
                <div class="text-sm">{{ $t('You have reached the maximum chat limit for your subscription! Please upgrade to send/receive more messages') }}</div>
            </div>
        </div>
    </div>
    <div v-if="!isInboundChatWithin24Hours && !props.chatLimitReached" class="flex justify-center items-center w-full px-6 md:px-4">
        <div class="flex items-start space-x-4 bg-orange-100 rounded-lg p-2 mb-2 px-4">
            <span class="text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 36 36"><path fill="currentColor" d="M18 21.32a1.3 1.3 0 0 0 1.3-1.3V14a1.3 1.3 0 1 0-2.6 0v6a1.3 1.3 0 0 0 1.3 1.32Z" class="clr-i-outline clr-i-outline-path-1"/><circle cx="17.95" cy="24.27" r="1.5" fill="currentColor" class="clr-i-outline clr-i-outline-path-2"/><path fill="currentColor" d="M30.33 25.54L20.59 7.6a3 3 0 0 0-5.27 0L5.57 25.54A3 3 0 0 0 8.21 30h19.48a3 3 0 0 0 2.64-4.43Zm-1.78 1.94a1 1 0 0 1-.86.49H8.21a1 1 0 0 1-.88-1.48l9.74-17.94a1 1 0 0 1 1.76 0l9.74 17.94a1 1 0 0 1-.02.99Z" class="clr-i-outline clr-i-outline-path-3"/><path fill="none" d="M0 0h36v36H0z"/></svg>
            </span>
            <div>
                <div class="text-sm">{{ $t('24 hour limit') }}</div>
                <div class="text-sm">{{ $t('Whatsapp does not allow sending messages 24 hours after they last messaged you. However, you can send them a template message') }}</div>
            </div>
        </div>
    </div>
    <form v-if="isInboundChatWithin24Hours && !props.chatLimitReached" @submit.prevent="sendMessage()" class="flex items-center px-2 md:px-10 space-x-2">
        <div class="flex items-center w-full rounded-lg py-4 md:py-2 pl-2 pr-2" :class="processingForm ? 'bg-gray-200' : 'bg-white'">
            <textarea 
                ref="textInputRef" 
                @focus="form.type = 'text'"
                @keydown.enter.exact.prevent="handleEnterKey" 
                class="w-full ml-3 outline-none resize-none text-sm md:text-base" 
                :class="processingForm ? 'bg-gray-200' : 'bg-white'"
                v-model="formTextInput" 
                @input="adjustTextareaHeight" 
                type="text" 
                rows="1" 
                :placeholder="$t('Type your message...')" 
                :disabled="processingForm">
            </textarea>
            <input
                type="file"
                class="sr-only"
                :accept="getAcceptedFileTypes()"
                id="file-upload"
                @change="handleFileUpload($event)"
            />
            <label @click="form.type = 'image'" for="file-upload" class="text-slate-500 mr-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M6.5 8a2 2 0 1 0 4 0a2 2 0 0 0-4 0Zm14.427 1.99c-6.61-.908-12.31 4-11.927 10.51"/><path d="M3 13.066c2.78-.385 5.275.958 6.624 3.1"/><path d="M3 12c0-4.243 0-6.364 1.318-7.682C5.636 3 7.758 3 12 3c4.243 0 6.364 0 7.682 1.318C21 5.636 21 7.758 21 12c0 4.243 0 6.364-1.318 7.682C18.364 21 16.242 21 12 21c-4.243 0-6.364 0-7.682-1.318C3 18.364 3 16.242 3 12Z"/></g></svg>
            </label>
            <label @click="form.type = 'document'" for="file-upload" class="text-slate-500 mr-1 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 10c0-3.771 0-5.657 1.172-6.828C5.343 2 7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172C21 4.343 21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828C18.657 22 16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172C3 19.657 3 17.771 3 14v-4Z"/><path stroke-linecap="round" d="M8 10h8m-8 4h5"/></g></svg>
            </label>
            <label @click="form.type = 'audio'" for="file-upload" class="text-slate-500 mr-1 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 1024 1024"><path fill="currentColor" d="M842 454c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8c0 140.3-113.7 254-254 254S258 594.3 258 454c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8c0 168.7 126.6 307.9 290 327.6V884H326.7c-13.7 0-24.7 14.3-24.7 32v36c0 4.4 2.8 8 6.2 8h407.6c3.4 0 6.2-3.6 6.2-8v-36c0-17.7-11-32-24.7-32H548V782.1c165.3-18 294-158 294-328.1M512 624c93.9 0 170-75.2 170-168V232c0-92.8-76.1-168-170-168s-170 75.2-170 168v224c0 92.8 76.1 168 170 168m-94-392c0-50.6 41.9-92 94-92s94 41.4 94 92v224c0 50.6-41.9 92-94 92s-94-41.4-94-92z"/></svg>
            </label>
            <label @click="form.type = 'video'" for="file-upload" class="text-slate-500 mr-4 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 32 32"><path fill="currentColor" d="M6.5 5.5A4.5 4.5 0 0 0 2 10v12a4.5 4.5 0 0 0 4.5 4.5h12A4.5 4.5 0 0 0 23 22v-1.5l4.2 3.15c1.153.865 2.8.042 2.8-1.4V9.75c0-1.442-1.647-2.265-2.8-1.4L23 11.5V10a4.5 4.5 0 0 0-4.5-4.5zM23 14l5-3.75v11.5L23 18zm-2-4v12a2.5 2.5 0 0 1-2.5 2.5h-12A2.5 2.5 0 0 1 4 22V10a2.5 2.5 0 0 1 2.5-2.5h12A2.5 2.5 0 0 1 21 10"/></svg>
            </label>
            <button class="flex items-center" type="submit" :disabled="formTextInput === null || formTextInput.trim() === '' || processingForm">
                <svg v-if="!processingForm" :class="formTextInput === null || formTextInput.trim() === '' ? 'text-slate-300' : 'text-black'" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 16 16"><path fill="currentColor" d="M1.724 1.053a.5.5 0 0 0-.714.545l1.403 4.85a.5.5 0 0 0 .397.354l5.69.953c.268.053.268.437 0 .49l-5.69.953a.5.5 0 0 0-.397.354l-1.403 4.85a.5.5 0 0 0 .714.545l13-6.5a.5.5 0 0 0 0-.894l-13-6.5Z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="2" r="0" fill="currentColor"><animate attributeName="r" begin="0" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"/></circle><circle cx="12" cy="2" r="0" fill="currentColor" transform="rotate(45 12 12)"><animate attributeName="r" begin="0.125s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"/></circle><circle cx="12" cy="2" r="0" fill="currentColor" transform="rotate(90 12 12)"><animate attributeName="r" begin="0.25s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"/></circle><circle cx="12" cy="2" r="0" fill="currentColor" transform="rotate(135 12 12)"><animate attributeName="r" begin="0.375s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"/></circle><circle cx="12" cy="2" r="0" fill="currentColor" transform="rotate(180 12 12)"><animate attributeName="r" begin="0.5s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"/></circle><circle cx="12" cy="2" r="0" fill="currentColor" transform="rotate(225 12 12)"><animate attributeName="r" begin="0.625s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"/></circle><circle cx="12" cy="2" r="0" fill="currentColor" transform="rotate(270 12 12)"><animate attributeName="r" begin="0.75s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"/></circle><circle cx="12" cy="2" r="0" fill="currentColor" transform="rotate(315 12 12)"><animate attributeName="r" begin="0.875s" calcMode="spline" dur="1s" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" repeatCount="indefinite" values="0;2;0;0"/></circle></svg>
            </button>
        </div>
    </form>
</template>