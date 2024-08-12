<template>
    <AppLayout v-slot:default="slotProps">
        <div class="md:flex md:flex-grow md:overflow-hidden">
            <div class="md:w-[30%] md:flex flex-col h-full bg-white border-r border-l" :class="contact ? 'hidden' : ''">
                <ChatTable :rows="rows" :filters="props.filters" :rowCount="props.rowCount" :ticketingIsEnabled="ticketingIsEnabled" :status="props?.status" :chatSortDirection="props.chat_sort_direction"/>
            </div>
            <div class="min-w-0 bg-cover flex flex-col chat-bg"  :class="contact ? 'h-screen md:w-[70%]' : 'md:h-screen md:w-[70%]'">
                <ChatHeader v-if="contact" :ticketingIsEnabled="ticketingIsEnabled" :contact="contact" :displayContactInfo="displayContactInfo" :ticket="ticket" @toggleView="toggleContactView" @deleteThread="deleteThread" @closeThread="closeThread"/>
                <div v-if="contact" class="flex-1 overflow-y-auto" ref="scrollContainer2">
                    <ChatThread v-if="!displayContactInfo && !loadingThread" :rows="chatThread" />
                    <Contact v-if="displayContactInfo" class="bg-white h-full" :contact="contact" />
                </div>
                <div v-if="contact && !displayContactInfo && !formLoading" class="w-full py-4">
                    <ChatForm :contact="contact" :chatLimitReached="isChatLimitReached" @response="updateChatThread" />
                </div>
            </div>
            <!--<div v-if="contact" class="md:w-[25%] min-w-0 bg-cover flex flex-col bg-white border-l">
                <ChatContact v-if="contact" class="bg-white h-full" :contact="contact" />
            </div>-->
        </div>
        <button class="hidden" ref="toggleNavbarBtn" @click="slotProps.toggleNavBar"></button>
    </AppLayout>

    <audio ref="audioPlayer"></audio>
</template>
<script setup>
    import AppLayout from "./../Layout/App.vue";
    import axios from 'axios';
    import { router, useForm } from '@inertiajs/vue3';
    import { defineEmits, ref, onMounted, watch } from 'vue';
    import ChatForm from '@/Components/ChatComponents/ChatForm.vue';
    import ChatHeader from '@/Components/ChatComponents/ChatHeader.vue';
    import ChatTable from '@/Components/ChatComponents/ChatTable.vue';
    import ChatThread from '@/Components/ChatComponents/ChatThread.vue';
    import ChatContact from '@/Components/ChatComponents/ChatContact.vue';
    import Contact from '@/Components/ContactInfo.vue';
    import Echo from 'laravel-echo';
    import Pusher from 'pusher-js';

    const props = defineProps(['rows', 'rowCount', 'pusherSettings', 'organizationId', 'isChatLimitReached', 'toggleNavBar', 'state', 'demoNumber', 'settings', 'status', 'chatThread', 'contact', 'ticket', 'chat_sort_direction', 'filters']);
    const rows = ref(props.rows);
    const rowCount = ref(props.rowCount);
    const scrollContainer = ref(null);
    const scrollContainer2 = ref(null);
    const loadingThread = ref(false);
    const displayContactInfo = ref(false);
    const formLoading = ref(false);
    const isChatLimitReached = ref(props.isChatLimitReached);
    const toggleNavbarBtn = ref(null);
    const isOpen = ref(false);
    const config = ref(props.settings.metadata);
    const settings = ref(config.value ? JSON.parse(config.value) : null);
    const ticketingIsEnabled = ref(settings.value?.tickets?.active ?? false);
    const queryParamsString = window.location.search;
    const chatThread = ref(props.chatThread);
    const contact = ref(props.contact);
    const audioPlayer = ref(null);

    watch(() => props.rows, (newRows) => {
        rows.value = newRows;
        //rowCount.value = ref(props.rowCount);
    });

    const toggleDropdown = () => {
        isOpen.value = !isOpen.value;
    }

    function toggleContactView(value) {
        displayContactInfo.value = value;
    }

    const scrollToBottom = () => {
        const container = scrollContainer2.value;
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    const closeThread = () => {
        toggleNavbarBtn.value.click();
        contact.value = null;
    }

    const deleteThread = () => {
        chatThread.value = [];
        axios.delete('/chats/' + contact.value.uuid)
    }

    const updateChatThread = (chat) => {
        const wamId = chat[0].value.wam_id;
        const wamIdExists = chatThread.value.some(existingChat => existingChat[0].value.wam_id === wamId);

        if (!wamIdExists && chat[0].value.deleted_at == null) {
            chatThread.value.push(chat);
            setTimeout(scrollToBottom, 100);

            if(chat[0].value.type == 'inbound'){
                playSound();
            }
        }
    }

    const playSound = () => {
        if(settings.value && settings.value.notifications){
            if(settings.value.notifications?.enable_sound){
                audioPlayer.value.src = settings.value.notifications?.tone;
                audioPlayer.value.volume = settings.value.notifications?.volume;
                audioPlayer.value.play();
            }
        }
    };

    const updateSidePanel = async(chat) => {
        if(contact.value && contact.value.id == chat[0].value.contact_id){
            updateChatThread(chat);
        }

        const response = await axios.get('/chats');
        if (response) {
            rows.value = response.data.result;
        }
    }

    const onCloseDemoModal = () => {
        isDemoModalOpen.value = false;
    }

    onMounted(() => {
        //Pusher.logToConsole = true;
        if(props.pusherSettings['pusher_app_key'] != null && props.pusherSettings['pusher_app_cluster'] != null){
            window.Pusher = Pusher;

            window.Echo = new Echo({
                broadcaster: 'pusher',
                key: props.pusherSettings['pusher_app_key'],
                cluster: props.pusherSettings['pusher_app_cluster'],
                encrypted: true,
            });

            window.Echo.channel('chats.ch' + props.organizationId).listen('NewChatEvent', (event) => {
                updateSidePanel(event.chat);
            });
        }

        scrollToBottom();
    });
</script>
<style>
    .chat-bg {
        background-image: url('/images/whatsapp-bg-02.png');
    }

    .speech-bubble-right::before {
        content: "";
        width: 0px;
        height: 0px;
        position: absolute;
        border-left: 5px solid #d8fad4;
        border-right: 5px solid transparent;
        border-top: 5px solid #d8fad4;
        border-bottom: 5px solid transparent;
        right: -10px;
        top: 0;
    }

    .speech-bubble-left::before {
        content: "";
        width: 0px;
        height: 0px;
        position: absolute;
        border-left: 5px solid transparent;
        border-right: 5px solid white;
        border-top: 5px solid white;
        border-bottom: 5px solid transparent;
        left: -10px;
        top: 0;
    }
</style>