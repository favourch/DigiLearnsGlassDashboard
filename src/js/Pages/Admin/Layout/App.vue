<template>
    <div class="flex h-screen w-full bg-gray-300/10">
        <Sidebar></Sidebar>
        <div class="flex flex-col w-full">
            <slot></slot>
        </div>
    </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue';
</script>
