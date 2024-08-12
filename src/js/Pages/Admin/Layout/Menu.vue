<template>
    <div>
        <div class="md:hidden">
            <button @click="toggleMenu" class="bg-primary py-2 px-3 rounded-lg text-white text-center ml-2">
                {{ menuOpen ? 'Close Menu' : 'Open Menu' }}
            </button>
        </div>
        <div v-if="menuOpen" class="mt-4">
            <ul class="space-y-1 text-sm">
                <li class="bg-slate-50 text-black px-2 rounded-md">
                    <a href="/dashboard" class="flex items-center p-2 space-x-3 rounded-md">
                        <span>Dashboard</span>
                    </a>
                </li>
                <li class="px-2 rounded-md">
                    <a href="/users" class="flex items-center p-2 space-x-3 rounded-md">
                        <span>Users</span>
                    </a>
                </li>
                <!-- Add more menu items as needed -->
            </ul>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const menuOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}
</script>
