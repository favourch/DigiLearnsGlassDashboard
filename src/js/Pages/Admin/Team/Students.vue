<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import debounce from 'lodash/debounce';
import AppLayout from "../Layout/App.vue";
import StudentTable from '@/Components/Tables/StudentTable.vue';
import Pagination from '@/Components/Pagination.vue';

const rows = ref({ data: [] });
const filters = ref({
  search: '',
});
const pagination = ref({
  total: 0,
  per_page: 20,
  current_page: 1,
  last_page: 1
});

const isLoading = ref(true);

async function fetchStudents(page = 1) {
  try {
    isLoading.value = true;
    const response = await axios.get(`${import.meta.env.VITE_API}/api/list-students`, {
      params: {
        search: filters.value.search,
        limit: pagination.value.per_page,
        page
      }
    });
    rows.value = { data: response.data.data };
    pagination.value = response.data.pagination;
  } catch (error) {
    console.error('Failed to fetch students:', error);
  } finally {
    isLoading.value = false;
  }
}

const debouncedSearch = debounce(() => {
  fetchStudents(1);
}, 400);

onMounted(() => {
  fetchStudents();
});

watch(() => filters.value.search, () => {
  debouncedSearch();
});
</script>

<template>
  <AppLayout>
    <div class="bg-white md:bg-inherit pt-10 px-4 md:pt-8 md:p-8 rounded-[5px] text-[#000] h-full md:overflow-y-auto">
      <div class="flex justify-between">
        <div>
          <h1 class="text-xl mb-1">{{ $t('Students') }}</h1>
          <p class="mb-6 flex items-center text-sm leading-6 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v5m0 5a9 9 0 1 1 0-18a9 9 0 0 1 0 18Zm.05-13v.1h-.1V8h.1Z"/>
            </svg>
            <span class="ml-1 mt-1">{{ $t('Manage student accounts') }}</span>
          </p>
        </div>
      </div>

      <!-- Search bar -->
      <div class="md:bg-white flex items-center border border-gray-300 md:border-none md:shadow-sm h-12 md:h-10 md:w-80 rounded-[0.5rem] mb-6 text-xl md:text-sm">
        <span class="pl-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 15l6 6m-11-4a7 7 0 1 1 0-14a7 7 0 0 1 0 14Z"/>
          </svg>
        </span>
        <input v-model="filters.search" type="text" class="outline-none px-4 w-full bg-inherit" :placeholder="$t('Search students...')">
        <button v-if="filters.search" @click="filters.search = ''" type="button" class="pr-2 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2zm3.7 12.3c.4.4.4 1 0 1.4c-.4.4-1 .4-1.4 0L12 13.4l-2.3 2.3c-.4.4-1 .4-1.4 0c-.4-.4-.4-1 0-1.4l2.3-2.3l-2.3-2.3c-.4-.4-.4-1 0-1.4c.4-.4 1-.4 1.4 0l2.3 2.3l2.3-2.3c.4-.4 1-.4 1.4 0c.4.4.4 1 0 1.4L13.4 12l2.3 2.3z"/>
          </svg>
        </button>
      </div>

      <!-- Skeleton loading -->
      <template v-if="isLoading">
        <div class="animate-pulse bg-white rounded-lg overflow-hidden">
          <div class="h-12 bg-gray-100"></div>
          <div v-for="n in 10" :key="n" class="flex items-center border-b px-4 py-4 gap-4">
            <div class="h-4 w-28 bg-gray-200 rounded"></div>
            <div class="h-4 w-24 bg-gray-200 rounded"></div>
            <div class="h-4 w-16 bg-gray-200 rounded"></div>
            <div class="h-4 w-20 bg-gray-200 rounded"></div>
            <div class="h-4 w-16 bg-gray-200 rounded"></div>
            <div class="h-4 w-24 bg-gray-200 rounded ml-auto"></div>
          </div>
        </div>
      </template>

      <template v-else>
        <StudentTable :rows="rows" :filters="filters" :type="'student'" :showDeleteBtn="false" />
        <div class="mt-4 flex justify-center">
          <Pagination :pagination="pagination" @page-changed="fetchStudents" />
        </div>
      </template>
    </div>
  </AppLayout>
</template>
