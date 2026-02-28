<template>
  <AppLayout>
    <div class="bg-white md:bg-inherit pt-0 px-4 md:pt-8 md:p-8 rounded-[5px] text-[#000] overflow-y-scroll">
      <div class="md:flex justify-between hidden">
        <div>
          <h1 class="text-xl mb-1">{{ isEditMode ? $t('Update user') : $t('Create user') }}</h1>
          <p class="mb-6 flex items-center text-sm leading-6 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11v5m0 5a9 9 0 1 1 0-18a9 9 0 0 1 0 18Zm.05-13v.1h-.1V8h.1Z"/>
            </svg>
            <span class="ml-1 mt-1">{{ isEditMode ? $t('Update administrative user and assign role') : $t('Create administrative user and assign role') }}</span>
          </p>
        </div>
        <div>
          <router-link to="/users" class="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-indigo-500">{{ $t('Back') }}</router-link>
        </div>
      </div>

      <div v-if="isPageLoading" class="animate-pulse bg-white md:border py-5 px-5 rounded-[0.5rem] space-y-6">
        <div class="sm:flex border-b py-5">
          <div class="sm:w-[40%]"><div class="h-4 w-40 bg-gray-200 rounded"></div></div>
          <div class="sm:w-[60%] space-y-4">
            <div class="h-10 bg-gray-200 rounded"></div>
            <div class="grid grid-cols-2 gap-4">
              <div class="h-10 bg-gray-200 rounded"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
              <div class="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <form v-else @submit.prevent="submitForm" class="bg-white md:border py-5 px-5 rounded-[0.5rem]">
        <div v-if="successMessage" class="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {{ errorMessage }}
        </div>

        <div class="sm:flex border-b py-5">
          <div class="hidden sm:block sm:w-[40%] mb-1">
            <h1 class="text-sm text-gray-500 tracking-[0px]">{{ $t('Personally identifiable information') }}</h1>
          </div>
          <div class="sm:w-[60%] sm:flex space-x-6">
            <div class="sm:w-[80%] grid gap-x-6 gap-y-4 sm:grid-cols-6">
              <FormInput v-model="form.first_name" :name="$t('First name')" :error="errors.first_name" type="text" className="sm:col-span-3"/>
              <FormInput v-model="form.last_name" :name="$t('Last name')" :error="errors.last_name" type="text" className="sm:col-span-3"/>
              <FormInput v-model="form.email" :name="$t('Email')" :error="errors.email" type="email" className="sm:col-span-3"/>
              <FormInput v-model="form.phone" :name="$t('Phone')" :error="errors.phone" type="text" className="sm:col-span-3"/>
              <FormSelect v-model="form.role" :name="$t('Role')" :error="errors.role" :options="roleOptions" className="sm:col-span-6"/>
              <FormInput v-if="!isEditMode" v-model="form.password" :name="$t('Password')" :error="errors.password" type="password" className="sm:col-span-3"/>
              <FormInput v-if="!isEditMode" v-model="form.password_confirmation" :name="$t('Confirm password')" :error="errors.password_confirmation" type="password" className="sm:col-span-3"/>
              <template v-if="isEditMode">
                <FormInput v-model="form.password" :name="$t('New password (leave blank to keep current)')" type="password" className="sm:col-span-3"/>
                <FormInput v-model="form.password_confirmation" :name="$t('Confirm new password')" type="password" className="sm:col-span-3"/>
              </template>
              <FormSelect v-if="isEditMode" v-model="form.status" :name="$t('Status')" :options="statusOptions" className="sm:col-span-6"/>
            </div>
          </div>
        </div>

        <div class="sm:flex py-5">
          <div class="hidden sm:block w-[40%] mb-1">
            <h1 class="text-sm text-gray-500 tracking-[0px]">{{ $t('Address details') }}</h1>
          </div>
          <div class="sm:w-[60%] sm:flex space-x-6">
            <div class="sm:w-[80%] grid gap-x-6 gap-y-4 sm:grid-cols-6">
              <FormInput v-model="form.street" :name="$t('Street')" type="text" className="sm:col-span-6"/>
              <FormInput v-model="form.city" :name="$t('City')" type="text" className="sm:col-span-3"/>
              <FormInput v-model="form.state" :name="$t('State')" type="text" className="sm:col-span-3"/>
              <FormInput v-model="form.zip" :name="$t('Zip code')" type="text" className="sm:col-span-3"/>
              <FormInput v-model="form.country" :name="$t('Country')" type="text" className="sm:col-span-3"/>
            </div>
          </div>
        </div>

        <div class="py-6">
          <button type="submit" :disabled="isSubmitting" class="float-right flex items-center space-x-4 rounded-md bg-black px-3 py-2 text-sm text-white shadow-sm hover:bg-slate-600 disabled:opacity-50">
            <span v-if="isSubmitting" class="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></span>
            {{ $t('Save') }}
          </button>
        </div>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import AppLayout from "../Layout/App.vue";
import FormInput from '@/Components/FormInput.vue';
import FormSelect from '@/Components/FormSelect.vue';

const route = useRoute();
const router = useRouter();

const userId = computed(() => route.params.id);
const isEditMode = computed(() => !!userId.value);
const isPageLoading = ref(false);
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const errors = ref({});

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: 'teacher',
  password: '',
  password_confirmation: '',
  status: 1,
  street: '',
  city: '',
  state: '',
  zip: '',
  country: ''
});

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'content', label: 'Content Manager' },
  { value: 'moderator', label: 'Moderator' }
];

const statusOptions = [
  { value: 1, label: 'Active' },
  { value: 0, label: 'Inactive' }
];

onMounted(async () => {
  if (isEditMode.value) {
    isPageLoading.value = true;
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API}/api/users/${userId.value}`);
      form.value.first_name = data.first_name || '';
      form.value.last_name = data.last_name || '';
      form.value.email = data.email || '';
      form.value.phone = data.phone || '';
      form.value.role = data.role || 'teacher';
      form.value.status = data.status ?? 1;

      if (data.address) {
        try {
          const addr = JSON.parse(data.address);
          form.value.street = addr.street || '';
          form.value.city = addr.city || '';
          form.value.state = addr.state || '';
          form.value.zip = addr.zip || '';
          form.value.country = addr.country || '';
        } catch {}
      }
    } catch (error) {
      errorMessage.value = 'Failed to load user data.';
    } finally {
      isPageLoading.value = false;
    }
  }
});

async function submitForm() {
  errors.value = {};
  successMessage.value = '';
  errorMessage.value = '';

  if (!form.value.first_name) { errors.value.first_name = 'First name is required'; }
  if (!form.value.last_name) { errors.value.last_name = 'Last name is required'; }
  if (!form.value.email) { errors.value.email = 'Email is required'; }
  if (!isEditMode.value && !form.value.password) { errors.value.password = 'Password is required'; }
  if (form.value.password && form.value.password !== form.value.password_confirmation) {
    errors.value.password_confirmation = 'Passwords do not match';
  }

  if (Object.keys(errors.value).length > 0) return;

  isSubmitting.value = true;

  try {
    const payload = { ...form.value };
    if (!payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }
    delete payload.password_confirmation;

    if (isEditMode.value) {
      await axios.put(`${import.meta.env.VITE_API}/api/users/${userId.value}`, payload);
      successMessage.value = 'User updated successfully.';
    } else {
      await axios.post(`${import.meta.env.VITE_API}/api/users`, payload);
      successMessage.value = 'User created successfully.';
      setTimeout(() => router.push('/users'), 1500);
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'An error occurred.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
