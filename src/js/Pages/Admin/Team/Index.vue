<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import axios from 'axios';
import AppLayout from "../Layout/App.vue";
import UserTable from '@/Components/Tables/UserTable.vue';

const rows = ref({ data: [] });
const filters = ref({
  search: '',
  role: '',
});

const isLoading = ref(true);

async function fetchUsers() {
  try {
    isLoading.value = true;
    const params = {};
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.role) params.role = filters.value.role;

    const response = await axios.get(`${import.meta.env.VITE_API}/api/users`, { params });
    rows.value = { data: response.data };
  } catch (error) {
    console.error('Failed to fetch users:', error);
  } finally {
    isLoading.value = false;
  }
}

async function deleteUser(id) {
  try {
    await axios.delete(`${import.meta.env.VITE_API}/api/users/${id}`);
    rows.value.data = rows.value.data.filter(u => u._id !== id);
  } catch (error) {
    console.error('Failed to delete user:', error);
  }
}

onMounted(() => {
  fetchUsers();
});

watch(filters, () => {
  fetchUsers();
}, { deep: true });
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
            <span class="ml-1 mt-1">{{ $t('Manage admin accounts') }}</span>
          </p>
        </div>
        <div>
          <router-link to="/users/create" class="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">{{ $t('Add User') }}</router-link>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <select
          v-model="filters.role"
          class="rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="content">Content Manager</option>
          <option value="moderator">Moderator</option>
        </select>
      </div>

      <template v-if="isLoading">
        <div class="animate-pulse space-y-3">
          <div class="h-10 w-80 bg-gray-200 rounded-lg"></div>
          <div class="bg-white rounded-lg overflow-hidden">
            <div class="h-12 bg-gray-100"></div>
            <div v-for="n in 5" :key="n" class="flex items-center border-b px-4 py-4 gap-4">
              <div class="h-4 w-32 bg-gray-200 rounded"></div>
              <div class="h-4 w-40 bg-gray-200 rounded"></div>
              <div class="h-4 w-20 bg-gray-200 rounded"></div>
              <div class="h-4 w-16 bg-gray-200 rounded"></div>
              <div class="h-4 w-24 bg-gray-200 rounded ml-auto"></div>
            </div>
          </div>
        </div>
      </template>

      <UserTable v-else :rows="rows" :filters="filters" :type="'admin'" :showRole="true" @delete="deleteUser" />
    </div>
  </AppLayout>
</template>
