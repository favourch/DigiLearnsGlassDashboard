<template>
    <div v-if="visible" class="flash-message" :class="type">
      {{ message }}
      <button @click="close">x</button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const props = defineProps({
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'success', // Can be 'success', 'error', 'info', etc.
    },
  });
  
  const visible = ref(true);
  
  const close = () => {
    visible.value = false;
  };
  
  onMounted(() => {
    setTimeout(() => {
      visible.value = false;
    }, 3000); // Auto-hide after 3 seconds
  });
  </script>
  
  <style scoped>
  .flash-message {
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000;
  }
  
  .flash-message.success {
    background-color: #4caf50;
    color: white;
  }
  
  .flash-message.error {
    background-color: #f44336;
    color: white;
  }
  
  .flash-message.info {
    background-color: #2196f3;
    color: white;
  }
  </style>
  