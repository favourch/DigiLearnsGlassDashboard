<script setup>
    import axios from "axios";
    import { useForm } from '@inertiajs/vue3';
    import { onMounted, ref } from 'vue';
    import Modal from '@/Components/Modal.vue';
    import FormInput from '@/Components/FormInput.vue';
    import FormSelect from '@/Components/FormSelect.vue';

    const props = defineProps({
        modelValue: Boolean,
    })

    const form = useForm({
        'public_key': null,
        'secret_key': null,
        'status': null
    });

    const isLoading = ref(false);

    const statusOptions = ref([
        { value: '1', label: 'Active' },
        { value: '0', label: 'Inactive' }
    ]);

    const submitForm = async () => {
        form.put('/admin/payment-gateways/paystack', {
            preserveScroll: true,
            onSuccess: () => {
                onClose()
            },
        })
    };

    function getRow() {
        axios.get('/admin/payment-gateways/paystack').then((response) => {
            const { data } = response.data;

            // Parse the JSON string in the metadata column
            const metadata = JSON.parse(data.metadata);

            // Assign values to the form fields based on the keys
            form.public_key = metadata.public_key || null;
            form.secret_key = metadata.secret_key || null;
            form.status = data.is_active ? '1' : '0';
        })
        .catch((error) => {
            // console.error('Error:', error);
        });
    }

    const emit = defineEmits(['update:modelValue', 'callback']);

    function onClose() {
        emit('update:modelValue', false);
    }

    onMounted(getRow);
</script>
<template>
    <Modal :label="'Edit Paystack Configuration'" :isOpen=modelValue>
        <div class="mt-5 grid grid-cols-1 gap-x-6 gap-y-4">
            <form @submit.prevent="submitForm()" class="">

                <div class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 sm:col-span-4 pb-8 border-b">
                    <FormInput v-model="form.public_key" :name="'Public Key'" :type="'text'" :error="form.errors.public_key" :class="'sm:col-span-6'"/>
                    <FormInput v-model="form.secret_key" :name="'Secret Key'" :type="'text'" :error="form.errors.secret_key" :class="'sm:col-span-6'"/>
                    <FormSelect v-model="form.status" :name="'Status'" :type="'text'"  :options="statusOptions" :error="form.errors.status" :class="'sm:col-span-6'"/>
                </div>

                <div class="mt-4 flex">
                    <button type="button" @click.self="onClose" class="inline-flex justify-center rounded-md border border-transparent bg-slate-50 px-4 py-2 text-sm text-slate-500 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 mr-4">{{ $t('cancel') }}</button>
                    <button 
                        :class="['inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2', { 'opacity-50': isLoading }]"
                        :disabled="isLoading"
                    >
                        <svg v-if="isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z" opacity=".5"/><path fill="currentColor" d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"><animateTransform attributeName="transform" dur="1s" from="0 12 12" repeatCount="indefinite" to="360 12 12" type="rotate"/></path></svg>
                        <span v-else>{{ $t('save') }}</span>
                    </button>
                </div>
            </form>
        </div>
    </Modal>
</template>