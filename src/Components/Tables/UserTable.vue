<script setup>
import { ref, computed } from 'vue';
import debounce from 'lodash/debounce';
import Table from '@/Components/Table.vue';
import TableHeader from '@/Components/TableHeader.vue';
import TableHeaderRow from '@/Components/TableHeaderRow.vue';
import TableHeaderRowItem from '@/Components/TableHeaderRowItem.vue';
import TableBody from '@/Components/TableBody.vue';
import TableBodyRow from '@/Components/TableBodyRow.vue';
import TableBodyRowItem from '@/Components/TableBodyRowItem.vue';
import Dropdown from '@/Components/Dropdown.vue';
import DropdownItemGroup from '@/Components/DropdownItemGroup.vue';
import DropdownItem from '@/Components/DropdownItem.vue';

const props = defineProps({
    rows: { type: Object, required: true },
    filters: { type: Object },
    type: { type: String },
    showDeleteBtn: { type: Boolean, default: true },
    showRole: { type: Boolean, default: false }
});

const emit = defineEmits(['delete']);

const params = ref({
    search: props.filters?.search || '',
});

const isSearching = ref(false);
const deleteConfirmId = ref(null);

const clearSearch = () => {
    params.value.search = '';
};

const isLastRow = (index) => {
    return index === props.rows.data.length - 1;
};

const search = debounce(() => {
    isSearching.value = true;
    isSearching.value = false;
}, 500);

const statusLabel = (status) => {
    if (status === 1) return 'Active';
    if (status === 0) return 'Inactive';
    return status;
};

const filteredRows = computed(() => {
    if (!params.value.search) return props.rows.data;
    const searchTerm = params.value.search.toLowerCase();
    return props.rows.data.filter(user =>
        (user.first_name || '').toLowerCase().includes(searchTerm) ||
        (user.last_name || '').toLowerCase().includes(searchTerm) ||
        (user.email || '').toLowerCase().includes(searchTerm)
    );
});

function confirmDelete(id) {
    deleteConfirmId.value = id;
}

function executeDelete() {
    if (deleteConfirmId.value) {
        emit('delete', deleteConfirmId.value);
        deleteConfirmId.value = null;
    }
}

function cancelDelete() {
    deleteConfirmId.value = null;
}

function getUserId(item) {
    return item._id || item.id;
}
</script>

<template>
    <div class="md:bg-white flex items-center border border-primary md:border-none md:shadow-sm h-12 md:h-10 md:w-80 rounded-[0.5rem] mb-6 text-xl md:text-sm">
        <span class="pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 15l6 6m-11-4a7 7 0 1 1 0-14a7 7 0 0 1 0 14Z"/>
            </svg>
        </span>
        <input @input="search" v-model="params.search" type="text" class="outline-none px-4 w-full bg-inherit" :placeholder="$t('Search users')">
        <button v-if="!isSearching && params.search" @click="clearSearch" type="button" class="pr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2zm3.7 12.3c.4.4.4 1 0 1.4c-.4.4-1 .4-1.4 0L12 13.4l-2.3 2.3c-.4.4-1 .4-1.4 0c-.4-.4-.4-1 0-1.4l2.3-2.3l-2.3-2.3c-.4-.4-.4-1 0-1.4c.4-.4 1-.4 1.4 0l2.3 2.3l2.3-2.3c.4-.4 1-.4 1.4 0c.4.4.4 1 0 1.4L13.4 12l2.3 2.3z"/>
            </svg>
        </button>
    </div>
    <Table :rows="rows">
        <TableHeader>
            <TableHeaderRow>
                <TableHeaderRowItem :position="'first'">{{ $t('Name') }}</TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">{{ $t('Email') }}</TableHeaderRowItem>
                <TableHeaderRowItem v-if="type === 'admin' || showRole" class="hidden sm:table-cell">{{ $t('Role') }}</TableHeaderRowItem>
                <TableHeaderRowItem>
                    <span>{{ $t('Status') }}</span>
                </TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">
                    <span class="float-right">{{ $t('Last updated') }}</span>
                </TableHeaderRowItem>
                <TableHeaderRowItem :position="'last'"></TableHeaderRowItem>
            </TableHeaderRow>
        </TableHeader>
        <TableBody>
            <TableBodyRow v-for="(item, index) in filteredRows" :key="getUserId(item)" :class="!isLastRow(index) ? 'border-b' : ''">
                <TableBodyRowItem :position="'first'" class="capitalize">
                    <router-link :to="`/users/${getUserId(item)}`" class="hover:text-indigo-600">
                        {{ item.first_name }} {{ item.last_name }}
                    </router-link>
                </TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell">{{ item.email }}</TableBodyRowItem>
                <TableBodyRowItem v-if="type === 'admin' || showRole" class="hidden sm:table-cell capitalize">
                    <span class="py-1 px-2 rounded text-xs" :class="{
                        'bg-purple-100 text-purple-700': item.role === 'admin',
                        'bg-blue-100 text-blue-700': item.role === 'teacher',
                        'bg-green-100 text-green-700': item.role === 'content',
                        'bg-orange-100 text-orange-700': item.role === 'moderator'
                    }">{{ item.role }}</span>
                </TableBodyRowItem>
                <TableBodyRowItem class="capitalize">
                    <span class="py-1 rounded-[5px] text-xs px-3" :class="item.status === 1 ? 'bg-[#ddebf7] text-slate-700' : 'bg-red-100 text-red-700'">
                        {{ statusLabel(item.status) }}
                    </span>
                </TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell">
                    <span class="float-right text-sm text-gray-500">{{ item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '' }}</span>
                </TableBodyRowItem>
                <TableBodyRowItem :position="'last'">
                    <Dropdown :align="'right'" class="mt-2">
                        <button class="inline-flex w-full justify-center rounded-md text-sm font-medium text-black hover:bg-opacity-30 focus:outline-none">
                            <span class="hover:bg-[#F6F7F9] hover:rounded-full w-[fit-content] p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12 16a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2Z"/>
                                </svg>
                            </span>
                        </button>
                        <template #items>
                            <DropdownItemGroup>
                                <DropdownItem :href="`/users/${getUserId(item)}`">{{ $t('View/edit') }}</DropdownItem>
                                <DropdownItem v-if="showDeleteBtn && item.role !== 'admin'" as="button" @click="confirmDelete(getUserId(item))">{{ $t('Delete') }}</DropdownItem>
                            </DropdownItemGroup>
                        </template>
                    </Dropdown>
                </TableBodyRowItem>
            </TableBodyRow>
        </TableBody>
    </Table>

    <!-- Delete confirmation modal -->
    <div v-if="deleteConfirmId" class="fixed z-50 inset-0 overflow-y-auto">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" @click="cancelDelete">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">{{ $t('Delete user') }}</h3>
                    <p class="text-sm text-gray-500">{{ $t('Are you sure you want to delete this user? This action cannot be undone.') }}</p>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                    <button @click="executeDelete" class="w-full sm:w-auto rounded-md bg-red-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-red-500">{{ $t('Delete') }}</button>
                    <button @click="cancelDelete" class="mt-2 sm:mt-0 w-full sm:w-auto rounded-md bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50">{{ $t('Cancel') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>
