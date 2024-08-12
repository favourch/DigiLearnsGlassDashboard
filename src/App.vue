<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

const store = useStore();

onMounted(async () => {
  if (!store.getters.getUser) {
    try {
      const response = await axios.get('/api/current-user'); // Replace with your actual API endpoint
      store.dispatch('setUser', response.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  }
});
</script>

<script>
export default {
  name: 'App',
};
</script>
