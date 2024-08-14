<template>
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal-content">
        <button @click="close">Close</button>
        <slot></slot>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps({
    isOpen: Boolean
  });
  
  const emit = defineEmits(['update:isOpen']);
  
  const close = () => {
    emit('update:isOpen', false);
  };
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
  }
  </style>
  