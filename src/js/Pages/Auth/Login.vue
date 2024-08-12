<template>
    <div class="flex h-screen justify-center">
      <div class="flex justify-center">
        <div class="w-[20em] mt-40">
          <div class="flex justify-center mb-5">
            <router-link to="/">
              <img
                class="max-w-[180px]"
                v-if="companyConfig.logo"
                :src="companyConfig.logo"
                :alt="companyConfig.company_name"
              />
              <h4 v-else class="text-2xl mb-2">{{ companyConfig.company_name }}</h4>
            </router-link>
          </div>
          <h1 class="text-2xl text-center">Login to your account</h1>
          <div class="text-center text-sm text-slate-500">
            Don't have an account?
            <router-link
              to="/signup"
              class="text-sm text-primary-600 dark:text-primary-500 border-b hover:border-gray-500"
            >
              Create one here
            </router-link>
          </div>
          <form @submit.prevent="submitForm" class="mt-5">
            <div class="mt-5 space-y-4">
              <FormInput
                v-model="form.email"
                name="Email"
                :error="form.errors.email"
                type="email"
                class="col-span-3"
              />
              <FormInput
                v-model="form.password"
                name="Password"
                :error="form.errors.password"
                type="password"
                class="col-span-3"
              />
              <div
                v-if="form.errors.recaptcha_response"
                class="form-error text-[#b91c1c] text-xs"
              >
                {{ form.errors.recaptcha_response }}
              </div>
            </div>
            <div class="flex items-center justify-between mt-5">
              <div class="flex items-start">
                <div class="flex items-center h-5">
                  <input
                    id="remember"
                    type="checkbox"
                    class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label
                    for="remember"
                    class="text-gray-500 dark:text-gray-300"
                    >Remember me</label
                  >
                </div>
              </div>
              <router-link
                to="/forgot-password"
                class="text-sm text-primary-600 dark:text-primary-500 border-b hover:border-gray-500"
                >Forgot password?</router-link
              >
            </div>
            <div class="mt-6">
              <button
                v-if="!isLoading"
                type="submit"
                class="rounded-md bg-primary px-3 py-3 text-sm text-white shadow-sm w-full"
              >
                Login to your account
              </button>
              <button
                v-else
                type="button"
                class="rounded-md bg-primary px-3 py-3 text-sm text-white shadow-sm w-full flex justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z"
                    opacity=".5"
                  />
                  <path
                    fill="currentColor"
                    d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"
                  >
                    <animateTransform
                      attributeName="transform"
                      dur="1s"
                      from="0 12 12"
                      repeatCount="indefinite"
                      to="360 12 12"
                      type="rotate"
                    />
                  </path>
                </svg>
              </button>
            </div>
          </form>
          <div
            v-if="companyConfig.allow_facebook_login || companyConfig.allow_google_login"
            class="flex justify-center my-6"
          >
            <span class="text-sm text-gray-500 px-4 text-center"
              >Or continue with</span
            >
          </div>
          <div class="flex justify-center gap-4">
            <a
              v-if="companyConfig.allow_facebook_login"
              href="/social-login/facebook"
              class="border rounded-full p-2 cursor-pointer"
              ><!-- Facebook SVG Icon --></a
            >
            <a
              v-if="companyConfig.allow_google_login"
              href="/social-login/google"
              class="border rounded-full p-2 cursor-pointer"
              ><!-- Google SVG Icon --></a
            >
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useStore } from 'vuex'; // Assuming you're using Vuex
  import axios from 'axios';
  import FormInput from '@/Components/FormInput.vue';
  
  const companyConfig = ref({
    logo: '',
    company_name: 'DigiLearns.NG',
    allow_facebook_login: false,
    allow_google_login: false,
  });
  
  const form = ref({
    email: '',
    password: '',
    recaptcha_response: '',
    errors: {},
  });
  
  const isLoading = ref(false);
  const router = useRouter();
  const store = useStore();
  
  const fetchSettings = async () => {
    try {
      const response = await axios.get(import.meta.env.VITE_API_SETTINGS_URL);
      companyConfig.value = response.data;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };
  
  const submitForm = async () => {
    isLoading.value = true;

    try {
        const apiURL = import.meta.env.VITE_API_LOGIN_URL;
        const response = await axios.post(apiURL, {
            email: form.value.email,
            password: form.value.password,
        });

        if (response.data.user) {
            // Store the user data in Vuex
            store.dispatch('setUser', response.data.user);

            // Redirect to the dashboard
            window.location.href = response.data.redirectTo;
        } else {
            form.value.errors = { email: 'Login failed. Please try again.' };
        }
    } catch (error) {
        if (error.response && error.response.data.message) {
            form.value.errors = { email: error.response.data.message };
        }
    } finally {
        isLoading.value = false;
    }
};

  
  onMounted(() => {
    fetchSettings();
  });
  </script>
  