<template>
    <MobileSidebar :user="user" :config="config" :organization="organization" :organizations="organizations" :title="currentPageTitle" :displayCreateBtn="displayCreateBtn" :displayTopBar="viewTopBar"></MobileSidebar>

    <div class="md:mt-0 md:pt-0 flex md:h-screen w-full tracking-[0.3px] bg-gray-300/10" :class="viewTopBar === false ? 'mt-0 pt-0' : ''">
        <Sidebar :user="user" :config="config" :organization="organization" :organizations="organizations"></Sidebar>
        <div class="md:min-h-screen flex flex-col w-full min-w-0">
            <slot :user="user" :toggleNavBar="toggleTopBar" @testEmit="doSomething"></slot>
        </div>
    </div>
</template>
<script setup>
    import { usePage } from "@inertiajs/vue3";
    import Sidebar from "./Sidebar.vue";
    import { defineProps, ref, computed, watch } from 'vue';
    import { toast } from 'vue3-toastify';
    import MobileSidebar from "./MobileSidebar.vue";
    import 'vue3-toastify/dist/index.css';

    const viewTopBar = ref(true);
    const user = computed(() => usePage().props.auth.user);
    const config = computed(() => usePage().props.config);
    const organization = computed(() => usePage().props.organization);
    const organizations = computed(() => usePage().props.organizations);
    const currentPageTitle = computed(() => usePage().props.title);
    const displayCreateBtn = computed(() => usePage().props.allowCreate);

    watch(() => [usePage().props.flash, { deep: true }], () => {
        if(usePage().props.flash.status != null){
            toast(usePage().props.flash.status.message, {
                autoClose: 3000,
            });
        }
    });

    const toggleTopBar = () => {
        viewTopBar.value = !viewTopBar.value;
    };

    const doSomething = () => {
        alert('test');
    };
</script>