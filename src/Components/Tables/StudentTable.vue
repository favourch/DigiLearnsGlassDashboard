<script setup>
import { ref, computed } from 'vue';
import Table from '@/Components/Table.vue';
import TableHeader from '@/Components/TableHeader.vue';
import TableHeaderRow from '@/Components/TableHeaderRow.vue';
import TableHeaderRowItem from '@/Components/TableHeaderRowItem.vue';
import TableBody from '@/Components/TableBody.vue';
import TableBodyRow from '@/Components/TableBodyRow.vue';
import TableBodyRowItem from '@/Components/TableBodyRowItem.vue';

const props = defineProps({
    rows: { type: Object, required: true },
    filters: { type: Object },
    type: { type: String },
    showDeleteBtn: { type: Boolean, default: false }
});

const isModalOpen = ref(false);
const selectedStudent = ref(null);

const isLastRow = (index) => index === props.rows.data.length - 1;

const viewStudentDetails = (student) => {
    selectedStudent.value = student;
    isModalOpen.value = true;
};
</script>

<template>
    <Table :rows="rows">
        <TableHeader>
            <TableHeaderRow>
                <TableHeaderRowItem :position="'first'">{{ $t('Name') }}</TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">{{ $t('Phone') }}</TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">{{ $t('Class') }}</TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">{{ $t('State') }}</TableHeaderRowItem>
                <TableHeaderRowItem>{{ $t('Gender') }}</TableHeaderRowItem>
                <TableHeaderRowItem class="hidden sm:table-cell">
                    <span class="float-right">{{ $t('Created') }}</span>
                </TableHeaderRowItem>
            </TableHeaderRow>
        </TableHeader>
        <TableBody>
            <TableBodyRow v-for="(item, index) in rows.data" :key="item._id || index" :class="!isLastRow(index) ? 'border-b' : ''">
                <TableBodyRowItem :position="'first'" class="capitalize cursor-pointer hover:text-indigo-600" @click="viewStudentDetails(item)">
                    {{ item.first_name }} {{ item.last_name }}
                </TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell">{{ item.phone }}</TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell uppercase">{{ item.class }}</TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell capitalize">{{ item.state }}</TableBodyRowItem>
                <TableBodyRowItem class="capitalize">
                    <span class="py-1 rounded-[5px] text-xs px-3 bg-[#ddebf7] text-slate-700">{{ item.gender }}</span>
                </TableBodyRowItem>
                <TableBodyRowItem class="hidden sm:table-cell">
                    <span class="float-right text-sm text-gray-500">{{ item.created_at ? new Date(item.created_at).toLocaleDateString() : '' }}</span>
                </TableBodyRowItem>
            </TableBodyRow>
        </TableBody>
    </Table>

    <div v-if="rows.data.length === 0" class="text-center py-12 text-gray-500">
        {{ $t('No students found.') }}
    </div>

    <!-- Student detail modal -->
    <div v-if="isModalOpen && selectedStudent" class="fixed z-50 inset-0 overflow-y-auto">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" @click="isModalOpen = false">
                <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-6 pt-6 pb-4">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Student Details</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-500">Name</p>
                            <p class="font-medium capitalize">{{ selectedStudent.first_name }} {{ selectedStudent.last_name }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Phone</p>
                            <p class="font-medium">{{ selectedStudent.phone || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Class</p>
                            <p class="font-medium uppercase">{{ selectedStudent.class || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">State</p>
                            <p class="font-medium capitalize">{{ selectedStudent.state || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Gender</p>
                            <p class="font-medium capitalize">{{ selectedStudent.gender || '—' }}</p>
                        </div>
                        <div>
                            <p class="text-gray-500">Birth Year</p>
                            <p class="font-medium">{{ selectedStudent.birth_year || '—' }}</p>
                        </div>
                        <div class="col-span-2">
                            <p class="text-gray-500">Registered</p>
                            <p class="font-medium">{{ selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleString() : '—' }}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-6 py-3 flex justify-end">
                    <button @click="isModalOpen = false" class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
