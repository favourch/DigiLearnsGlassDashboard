<script setup>
    import { Link, useForm } from "@inertiajs/vue3";
    import { defineProps, ref } from "vue";
    import { TransitionRoot, TransitionChild, Dialog, DialogPanel, DialogTitle, TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
    import FormInput from '@/Components/FormInput.vue';

    const props = defineProps({
        user: Object,
        organization: Object,
        role: String,
        isOpen: Boolean,
    })

    const isLoading = ref(false);

    const getAddressDetail = (value, key) => {
        if(value){
            const address = JSON.parse(value);
            return address?.[key] ?? null;
        } else {
            return null;
        }
    };

    const form1 = useForm({
        first_name: props.user.first_name,
        last_name: props.user.last_name,
        email: props.user.email
    })

    const form2 = useForm({
        organization_name: props.organization?.name,
        address: getAddressDetail(props.organization?.address, 'street'),
        city: getAddressDetail(props.organization?.address, 'city'),
        state: getAddressDetail(props.organization?.address, 'state'),
        zip: getAddressDetail(props.organization?.address, 'zip'),
        country: getAddressDetail(props.organization?.address, 'country'),
    })

    const form3 = useForm({
        old_password: null,
        password: null,
        password_confirmation: null
    })

    const submitForm = async (event) => {
        isLoading.value = true;

        form1.put('./profile/', {
            preserveScroll: true,
            onFinish: () => {
                isLoading.value = false;
            }
        });
    };

    const submitForm3 = async (event) => {
        isLoading.value = true;

        form3.put('./profile/password', {
            preserveScroll: true,
            onFinish: () => {
                isLoading.value = false;
            }
        });
    };

    const emit = defineEmits(['close']);

    function closeModal() {
        emit('close', true);
    }
</script>
<template>
    <TransitionRoot appear :show="isOpen" as="template">
        <Dialog as="div" @close="closeModal" class="relative z-10">
            <TransitionChild
                as="template"
                enter="duration-300 ease-out"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="duration-200 ease-in"
                leave-from="opacity-100"
                leave-to="opacity-0"
            >
                <div class="fixed inset-0 bg-black bg-opacity-25" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4 text-center">
                <TransitionChild
                    as="template"
                    enter="duration-300 ease-out"
                    enter-from="opacity-0 scale-95"
                    enter-to="opacity-100 scale-100"
                    leave="duration-200 ease-in"
                    leave-from="opacity-100 scale-100"
                    leave-to="opacity-0 scale-95"
                >
                    <DialogPanel
                    class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all min-w-[20em]"
                    >
                    <div>
                        <h2 class="text-base text-xl leading-7 text-gray-900">{{ $t('Personal information') }}</h2>
                        <p class="mb-4 text-sm leading-6 text-gray-600">{{ $t('Update your account details and credentials') }}</p>

                        <TabGroup>
                            <TabList class="flex space-x-1 rounded-xl bg-primary p-1">
                                <Tab as="template" v-slot="{ selected }">
                                    <button
                                        :class="[
                                        'w-full rounded-lg py-2.5 text-sm leading-5 text-[#ffffffcc]',
                                        'ring-white focus:outline-none',
                                        selected
                                            ? 'bg-white text-black shadow'
                                            : 'hover:bg-white hover:text-black',
                                        ]"
                                    >
                                    {{ $t('My profile') }}
                                    </button>
                                </Tab>
                                <Tab as="template" v-slot="{ selected }">
                                    <button
                                        :class="[
                                        'w-full rounded-lg py-2.5 text-sm leading-5 text-[#ffffffcc]',
                                        'ring-white focus:outline-none',
                                        selected
                                            ? 'bg-white text-black shadow'
                                            : 'hover:bg-white hover:text-black',
                                        ]"
                                    >
                                    {{ $t('Security') }}
                                    </button>
                                </Tab>
                            </TabList>

                            <TabPanels class="mt-2">
                                <TabPanel>
                                    <div class="mt-5 grid grid-cols-1 gap-x-6 gap-y-4">
                                        <form @submit.prevent="submitForm()" class="grid gap-x-6 gap-y-4 sm:grid-cols-6">
                                            <FormInput v-model="form1.first_name" :name="$t('First name')" :error="form1.errors.first_name" :type="'text'" :class="'sm:col-span-3'"/>
                                            <FormInput v-model="form1.last_name" :name="$t('Last name')" :error="form1.errors.last_name" :type="'text'" :class="'sm:col-span-3'"/>
                                            <FormInput v-model="form1.email" :name="$t('Email')" :error="form1.errors.email" :type="'text'" :class="'sm:col-span-6'"/>

                                            <div class="mt-4 flex">
                                                <button type="button" @click="closeModal" class="inline-flex justify-center rounded-md border border-transparent bg-slate-50 px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 mr-4">{{ $t('Cancel') }}</button>
                                                <button 
                                                    :class="['inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2', { 'opacity-50': isLoading }]"
                                                    :disabled="isLoading"
                                                >
                                                    <svg v-if="isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z" opacity=".5"/><path fill="currentColor" d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"><animateTransform attributeName="transform" dur="1s" from="0 12 12" repeatCount="indefinite" to="360 12 12" type="rotate"/></path></svg>
                                                    <span v-else>{{ $t('Save') }}</span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </TabPanel>
                                <TabPanel>
                                    <div class="mt-5 grid grid-cols-1 gap-x-6 gap-y-4">
                                        <form @submit.prevent="submitForm3()" class="grid gap-x-6 gap-y-4 sm:grid-cols-6">
                                            <FormInput v-model="form3.old_password" :name="$t('Old password')" :error="form3.errors.old_password" :type="'password'" :class="'sm:col-span-6'"/>
                                            <FormInput v-model="form3.password" :name="$t('New password')" :error="form3.errors.password" :type="'password'" :class="'sm:col-span-6'"/>
                                            <FormInput v-model="form3.password_confirmation" :name="$t('Confirm password')" :error="form3.errors.password_confirmation" :type="'password'" :class="'sm:col-span-6'"/>

                                            <div class="mt-4 flex">
                                                <button type="button" @click="closeModal" class="inline-flex justify-center rounded-md border border-transparent bg-slate-50 px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 mr-4">{{ $t('Cancel') }}</button>
                                                <button
                                                    :class="['inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2', { 'opacity-50': isLoading }]"
                                                    :disabled="isLoading"
                                                >
                                                    <svg v-if="isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z" opacity=".5"/><path fill="currentColor" d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"><animateTransform attributeName="transform" dur="1s" from="0 12 12" repeatCount="indefinite" to="360 12 12" type="rotate"/></path></svg>
                                                    <span v-else>{{ $t('Save') }}</span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </TabPanel>
                            </TabPanels>
                        </TabGroup>
                    </div>
                    </DialogPanel>
                </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>