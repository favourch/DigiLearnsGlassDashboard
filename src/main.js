// src/main.js

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { store } from './store'; // Import the store
import { createI18n } from 'vue-i18n';
import VueApexCharts from 'vue3-apexcharts';
import axios from 'axios';

// Import your global CSS and JS files
import './css/app.css';

// Function to load locale messages from the public directory
async function loadLocaleMessages() {
  const messages = await axios.get('/lang/en.json');
  return {
    en: messages.data,
  };
}

// i18n setup with dynamic message loading
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: await loadLocaleMessages(),
});

const app = createApp(App);

app.use(store)  // Register the store
   .use(router)
   .use(VueApexCharts)
   .use(i18n);

app.mount('#app');
