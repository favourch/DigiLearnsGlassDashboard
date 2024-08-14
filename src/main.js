import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { store } from './store';
import { createI18n } from 'vue-i18n';
import VueApexCharts from 'vue3-apexcharts';
import axios from 'axios';
import { createMetaManager, defaultConfig, useMeta } from 'vue-meta'; // Import vue-meta

import './css/app.css';

async function loadLocaleMessages() {
  const messages = await axios.get('/lang/en.json');
  return {
    en: messages.data,
  };
}

async function initApp() {
  const messages = await loadLocaleMessages();

  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: messages,
  });

  const app = createApp(App);

  const metaManager = createMetaManager();

  app.use(store)
     .use(router)
     .use(VueApexCharts)
     .use(i18n)
     .use(metaManager); // Use metaManager for handling SEO

  app.mount('#app');
}

initApp();
