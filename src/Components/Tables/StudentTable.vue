<script setup>
import { ref, computed } from 'vue';
import debounce from 'lodash/debounce';
import AlertModal from '@/Components/AlertModal.vue';
import { useAlertModal } from '@/Composables/useAlertModal';
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
import Show from '../../js/Pages/Admin/Team/Show.vue';  // Import the Show component

const props = defineProps({
    rows: {
        type: Object,
        required: true,
    },
    filters: {
        type: Object
    },
    type: {
        type: String
    },
    showDeleteBtn: {
        type: Boolean,
        default: true,
    },
    showRole: {
        type: Boolean,
        default: false,
    }
});

const { isOpenAlert, openAlert, confirmAlert } = useAlertModal();
const isModalOpen = ref(false);
const selectedUser = ref(null);

const params = ref({
    search: props.filters?.search || '',
});

const isSearching = ref(false);
const emit = defineEmits(['delete']);

function deleteItem(id) {
    emit('delete', id);
}

const clearSearch = () => {
    params.value.search = '';
}

const isLastRow = (index) => {
  return index === props.rows.data.length - 1;
}

const search = debounce(() => {
    isSearching.value = true;
    isSearching.value = false;
}, 500);

const filteredRows = computed(() => {
  if (!params.value.search) {
    return props.rows.data;
  }
  const searchTerm = params.value.search.toLowerCase();
  return props.rows.data.filter(student =>
    student.first_name.toLowerCase().includes(searchTerm) ||
    student.last_name.toLowerCase().includes(searchTerm) ||
    student.phone.toLowerCase().includes(searchTerm)
  );
});

// Method to open the modal and load the user details
const viewUserDetails = (student) => {
    selectedUser.value = student;
    isModalOpen.value = true;
};
</script>

<template>
    <div class="md:bg-white flex items-center border border-primary md:border-none md:shadow-sm h-12 md:h-10 md:w-80 rounded-[0.5rem] mb-6 text-xl md:text-sm">
        <span class="pl-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 15l6 6m-11-4a7 7 0 1 1 0-14a7 7 0 0 1 0 14Z"/>
            </svg>
        </span>
        <input @input="search" v-model="params.search" type="text" class="outline-none px-4 w-full bg-inherit" :placeholder="$t('Search students')">
        <button v-if="isSearching === false && params.search" @click="clearSearch" type="button" class="pr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2zm3.7 12.3c.4.4.4 1 0 1.4c-.4.4-1 .4-1.4 0L12 13.4l-2.3 2.3c-.4.4-1 .4-1.4 0c-.4-.4-.4-1 0-1.4l2.3-2.3l-2.3-2.3c-.4-.4-.4-1 0-1.4c.4-.4 1-.4 1.4 0l2.3 2.3l2.3-2.3c.4-.4 1-.4 1.4 0c.4.4.4 1 0 1.4L13.4 12l2.3 2.3z"/>
            </svg>
        </button>
        <span v-if="isSearching" class="pr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="3.5" r="1.5" fill="currentColor" opacity="0">
                    <animateTransform attributeName="transform" calcMode="discrete" dur="2.4s" repeatCount="indefinite" type="rotate" values="0 12 12;90 12 12;180 12 12;270 12 12"/>
                    <animate attributeName="opacity" dur="0.6s" keyTimes="0;0.5;1" repeatCount="indefinite" values="1;1;0"/>
                </circle>
                <circle cx="12" cy="3.5" r="1.5" fill="currentColor" opacity="0">
                    <animateTransform attributeName="transform" begin="0.2s" calcMode="discrete" dur="2.4s" repeatCount="indefinite" type="rotate" values="30 12 12;120 12 12;210 12 12;300 12 12"/>
                    <animate attributeName="opacity" begin="0.2s" dur="0.6s" keyTimes="0;0.5;1" repeatCount="indefinite" values="1;1;0"/>
                </circle>
                <circle cx="12" cy="3.5" r="1.5" fill="currentColor" opacity="0">
                    <animateTransform attributeName="transform" begin="0.4s" calcMode="discrete" dur="2.4s" repeatCount="indefinite" type="rotate" values="60 12 12;150 12 12;240 12 12;330 12 12"/>
                    <animate attributeName="opacity" begin="0.4s" dur="0.6s" keyTimes="0;0.5;1" repeatCount="indefinite" values="1;1;0"/>
                </circle>
            </svg>
        </span>
    </div>
    <Table :rows="rows">
        <TableHeader>
            <TableHeaderRow>
                <TableHeaderRowItem :position="'first'">{{ $t('Name') }}</TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">{{ $t('Phone') }}</TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">{{ $t('Class') }}</TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">{{ $t('State') }}</TableHeaderRowItem>
                <TableHeaderRowItem>
                    <span class="">{{ $t('Gender') }}</span>
                </TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">
                    <span class="float-right">{{ $t('Last updated') }}</span>
                </TableHeaderRowItem>
                <TableHeaderRowItem :position="'last'"></TableHeaderRowItem>
            </TableHeaderRow>
        </TableHeader>
        <TableBody>
            <TableBodyRow v-for="(item, index) in filteredRows" :key="index" :class="!isLastRow(index) ? 'border-b' : ''">
                <TableBodyRowItem :position="'first'" class="capitalize" @click="viewUserDetails(item)">
                    {{ item.first_name }} {{ item.last_name }}
                </TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell">{{ item.phone }}</TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell">{{ item.class }}</TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell">{{ item.state }}</TableBodyRowItem>
                <TableBodyRowItem class="capitalize">
                    <span class="py-1 rounded-[5px] text-xs px-3 bg-[#ddebf7] text-slate-700">{{ item.gender }}</span>
                </TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell">
                    <span class="float-right">{{ item.updated_at }}</span>
                </TableBodyRowItem>
                <TableBodyRowItem :position="'last'">
                    <Dropdown :align="'right'" class="mt-2">
                        <button class="inline-flex w-full justify-center rounded-md text-sm font-medium text-black hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                            <span class="hover:bg-[#F6F7F9] hover:rounded-full w-[fit-content] p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12 16a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2Z"/>
                                </svg>
                            </span>
                        </button>
                        <template #items>
                            <DropdownItemGroup>
                                <DropdownItem @click="viewUserDetails(item)">{{ $t('View/edit') }}</DropdownItem>
                                <DropdownItem v-if="showDeleteBtn" as="button" @click="openAlert(item.id)">{{ $t('Delete') }}</DropdownItem>
                            </DropdownItemGroup>
                        </template>
                    </Dropdown>
                </TableBodyRowItem>
            </TableBodyRow>
        </TableBody>
    </Table>

    <!-- Modal Component Definition -->
    <div v-if="isModalOpen" class="fixed z-10 inset-0 overflow-y-auto">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Student Details
                            </h3>
                            <div class="mt-2">
                                <Show :user="selectedUser" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button @click="isModalOpen = false" type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Alert Modal Component-->
    <AlertModal 
        v-model="isOpenAlert" 
        @confirm="() => confirmAlert(deleteAction)"
        :label="$t('Delete row')" 
        :description="$t('Are you sure you want to delete this row? This action can not be undone')"
    />
</template>
