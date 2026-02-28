<script setup>
    import { MenuItem } from '@headlessui/vue';

    const props = defineProps({
        as: {
            type: String,
            default: "a"
        },
        href: {
            type: String,
            default: null
        }
    })
</script>
<template>
    <MenuItem v-slot="{ active }">
        <router-link v-if="props.as === 'a' && props.href"
            :to="props.href"
            :class="[
                active ? 'bg-blue-700 text-white' : 'text-gray-900',
                'group flex w-full rounded-md px-2 py-2 text-sm',
            ]"
        >
            <slot />
        </router-link>
        <component v-else
            :is="props.as"
            :class="[
                active ? 'bg-blue-700 text-white' : 'text-gray-900',
                'group flex w-full rounded-md px-2 py-2 text-sm text-left',
            ]"
        >
            <slot />
        </component>
    </MenuItem>
</template>
