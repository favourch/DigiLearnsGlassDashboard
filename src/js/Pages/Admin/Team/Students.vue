<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import AppLayout from "../Layout/App.vue";
import StudentTable from '@/Components/Tables/StudentTable.vue';
import Pagination from '@/Components/Pagination.vue'; // Import the Pagination component

const rows = ref([]);
const filters = ref({
  search: '', // Default search filter
});
const pagination = ref({
  total: 0,
  per_page: 20,
  current_page: 1,
  last_page: 1
});

const isLoading = ref(true);

async function fetchUsers(page = 1) {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API}/api/list-students`, {
      params: {
        search: filters.value.search, // Send search filter as a parameter
        limit: pagination.value.per_page,
        page: page
      }
    });

    console.log('Fetched users:', response.data); // Debugging output
    rows.value = { data: response.data.data }; // Wrapping the array in an object
    pagination.value = response.data.pagination; // Update pagination data
  } catch (error) {
    console.error('Failed to fetch users:', error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchUsers();
});

watch(filters, () => {
  fetchUsers(1); // Reset to the first page when filters change
});

</script>

<template>
  <AppLayout>
    <div class="bg-white md:bg-inherit pt-10 px-4 md:pt-8 md:p-8 rounded-[5px] text-[#000] h-full md:overflow-y-auto">
      <div class="flex justify-between">
        <div>
          <h1 class="text-xl mb-1">{{ $t('Users') }}</h1>
          <p class="mb-6 flex items-center text-sm leading-6 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v5m0 5a9 9 0 1 1 0-18a9 9 0 0 1 0 18Zm.05-13v.1h-.1V8h.1Z"/>
            </svg>
            <span class="ml-1 mt-1">{{ $t('Manage students accounts') }}</span>
          </p>
        </div>
        <div>
          <Link href="/students/create" class="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">{{ $t('Add User') }}</Link>
        </div>
      </div>
      <!-- Pass the rows and filters as props to StudentTable -->
      <StudentTable :rows="rows" :filters="filters" :type="'admin'" v-if="!isLoading" />
      <Spinner v-else />
      <!-- Add Pagination Component -->
      <Pagination :pagination="pagination" @page-changed="fetchUsers" />
    </div>
  </AppLayout>
</template>
