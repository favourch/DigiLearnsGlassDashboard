import { createApp, h, watchEffect } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import VueApexCharts from 'vue3-apexcharts';
import VueTelInput from 'vue-tel-input';
import { createI18n } from 'vue-i18n';
import axios from 'axios';

// Function to load locale messages via API
async function loadLocaleMessages(locale) {
  const response = await axios.get(`/translations/${locale}`);
  return response.data;
}

// Function to fetch available locales from Laravel backend
async function fetchAvailableLocales() {
  const response = await axios.get('/locales');
  return response.data;
}

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true });
    return pages[`./Pages/${name}.vue`];
  },
  setup({ el, App, props, plugin }) {
    // Fetch the current locale and available locales from the Laravel backend
    axios.get('/current-locale').then(async (response) => {
      const currentLocale = response.data.locale;
      const availableLocales = await fetchAvailableLocales();

      const i18n = createI18n({
        legacy: false,
        locale: currentLocale, // Default locale
        fallbackLocale: 'en', // Fallback locale
        messages: {}, // Initial empty messages
      });

      const app = createApp({ render: () => h(App, props) });

      app.use(plugin)
        .use(VueApexCharts)
        .use(VueTelInput)
        .use(i18n)
        .mount(el);

      // Load the default locale messages
      if (availableLocales.includes(currentLocale)) {
        loadLocaleMessages(currentLocale).then(messages => {
          i18n.global.setLocaleMessage(currentLocale, messages);
        });
      }

      // Watch for locale changes and dynamically load new locale messages
      watchEffect(async () => {
        const newLocale = i18n.global.locale.value;
        if (!i18n.global.availableLocales.includes(newLocale) && availableLocales.includes(newLocale)) {
          const messages = await loadLocaleMessages(newLocale);
          i18n.global.setLocaleMessage(newLocale, messages);
        }
      });
    });
  },
  progress: {
    delay: 250,
    color: '#198754',
    includeCSS: true,
    showSpinner: false,
  },
});
