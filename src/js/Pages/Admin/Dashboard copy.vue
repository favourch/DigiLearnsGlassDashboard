<template>
  <AppLayout>
      <div v-if="user" class="bg-white md:bg-inherit p-4 md:p-8 rounded-[5px] text-[#000] h-full overflow-y-auto">
          <div class="flex justify-between mt-3 md:mt-0">
              <div>
                  <h2 class="md:block hidden text-xl mb-1">{{ $t('Dashboard') }}</h2>
                  <p class="mb-6 flex items-center leading-6">
                      <span class="mt-1 font-semibold md:font-normal text-xl">{{ `Welcome back, ${user.first_name}` }} 👋</span>
                  </p>
              </div>
              <div class="relative">
                  <VueDatePicker v-model="selectedDateRange" range @update:model="updateDateRange" class="absolute right-0" />
                  <button @click="updateDuration" class="bg-primary py-2 px-3 rounded-lg text-white text-center ml-2">
                      {{ $t('Select Duration') }}
                  </button>
              </div>
          </div>
          <div class="md:flex space-x-2 md:space-x-2 mt-4 md:mt-0 mb-8 text-xl md:text-sm hidden">
              <router-link to="/admin/organizations/create" class="bg-primary py-2 px-3 rounded-lg text-white text-center">{{ $t('Add School') }}</router-link>
              <router-link to="/admin/users/create" class="bg-primary py-2 px-3 rounded-lg text-white text-center">{{ $t('Add User') }}</router-link>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 md:space-y-0">
              <div class="bg-slate-100 md:bg-white col-span-1 rounded-lg p-3" v-for="metric in metrics" :key="metric.title">
                  <div class="flex justify-between items-center">
                      <div>
                          <h2 class="text-slate-600">{{ metric.title }}</h2>
                          <h1 class="text-xl text-gray-600">{{ formatNumber(metric.value) }}</h1>
                      </div>
                      <div class="flex">
                          <span class="bg-secondary/10 p-3 rounded-full self-start">
                              <svg class="text-secondary" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
                                  <g fill="none" stroke="currentColor" stroke-width="1.5">
                                      <path d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2c4.714 0 7.071 0 8.535 1.464C22 4.93 22 7.286 22 12c0 4.714 0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z"/>
                                      <path stroke-linecap="round" stroke-linejoin="round" d="m7 14l2.293-2.293a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 0 1.414 0L17 10m0 0v2.5m0-2.5h-2.5"/>
                                  </g>
                              </svg>
                          </span>
                      </div>
                  </div>
              </div>
          </div>
          <div class="md:grid md:grid-cols-2 gap-x-4 mt-8">
              <div>
                  <h2 class="text-xl mb-4">{{ $t('Users by Class') }}</h2>
                  <apexchart type="pie" height="350" :options="pieChartOptions" :series="usersByClassSeries"></apexchart>
              </div>
              <div>
                  <h2 class="text-xl mb-4">{{ $t('Users by Gender') }}</h2>
                  <apexchart type="bar" height="350" :options="barChartOptions" :series="usersByGenderSeries"></apexchart>
              </div>
          </div>
          <div class="md:grid md:grid-cols-2 gap-x-4 mt-8">
              <div>
                  <h2 class="text-xl mb-4 flex justify-between items-center">
                      {{ $t('Users by State') }}
                      <button @click="toggleStateView" class="bg-primary py-2 px-3 rounded-lg text-white text-center">
                          {{ isShowingTop8 ? $t('Show Least 8') : $t('Show Top 8') }}
                      </button>
                  </h2>
                  <apexchart type="bar" height="350" :options="stateChartOptions" :series="usersByStateSeries"></apexchart>
              </div>
              <div>
                  <h2 class="text-xl mb-4">{{ $t('Users by Age') }}</h2>
                  <apexchart type="bar" height="350" :options="ageChartOptions" :series="usersByAgeSeries"></apexchart>
              </div>
          </div>
          <div class="md:grid md:grid-cols-1 gap-x-4 mt-8">
              <div>
                  <h2 class="text-xl mb-4">{{ $t('User Activity Heatmap') }}</h2>
                  <apexchart type="heatmap" height="350" :options="heatMapChartOptions" :series="heatMapSeries"></apexchart>
              </div>
          </div>
      </div>
  </AppLayout>
  <ProfileModal v-if="user" :user="user" :isOpen="isProfileModalOpen" />
</template>

<script setup>
import AppLayout from './Layout/App.vue';
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import ApexCharts from 'vue3-apexcharts';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const store = useStore();
const user = ref({
first_name: 'John',
last_name: 'Doe',
});
const isProfileModalOpen = ref(false);

const metrics = ref([
{ title: 'API Calls', value: 2000 },
{ title: 'Total Subjects', value: 15 },
{ title: 'Total States', value: 36 },
{ title: 'Total Classes', value: 12 },
{ title: 'Active Users', value: 5000 },
{ title: 'Total Revenue', value: 1000000 },
{ title: 'Open Tickets', value: 5 },
{ title: 'Total Messages', value: 8000 },
]);

const usersByClassSeries = ref([500, 400, 300, 200, 100]);
const usersByGenderSeries = ref([{ name: 'Users', data: [2500, 2500] }]);
const usersByStateSeries = ref([{ name: 'States', data: [500, 450, 400, 350, 300, 250, 200, 150] }]);
const usersByAgeSeries = ref([{ name: 'Users', data: [50, 100, 150, 200, 250, 300] }]);

const heatMapSeries = ref([
{
  name: 'Sunday',
  data: Array.from({ length: 24 }, (_, i) => ({ x: `${i} AM/PM`, y: Math.floor(Math.random() * 50) })),
},
{
  name: 'Monday',
  data: Array.from({ length: 24 }, (_, i) => ({ x: `${i} AM/PM`, y: Math.floor(Math.random() * 50) })),
},
{
  name: 'Tuesday',
  data: Array.from({ length: 24 }, (_, i) => ({ x: `${i} AM/PM`, y: Math.floor(Math.random() * 50) })),
},
{
  name: 'Wednesday',
  data: Array.from({ length: 24 }, (_, i) => ({ x: `${i} AM/PM`, y: Math.floor(Math.random() * 50) })),
},
{
  name: 'Thursday',
  data: Array.from({ length: 24 }, (_, i) => ({ x: `${i} AM/PM`, y: Math.floor(Math.random() * 50) })),
},
{
  name: 'Friday',
  data: Array.from({ length: 24 }, (_, i) => ({ x: `${i} AM/PM`, y: Math.floor(Math.random() * 50) })),
},
{
  name: 'Saturday',
  data: Array.from({ length: 24 }, (_, i) => ({ x: `${i} AM/PM`, y: Math.floor(Math.random() * 50) })),
},
]);

const isShowingTop8 = ref(true);
const selectedDateRange = ref(null);

function updateDateRange(value) {
console.log(value);
}

function updateDuration() {
console.log('Duration updated.');
}

function toggleStateView() {
isShowingTop8.value = !isShowingTop8.value;
// You might want to update the data based on whether top 8 or least 8 is being shown.
}

function formatNumber(value) {
return new Intl.NumberFormat().format(value);
}

const pieChartOptions = {
chart: {
  type: 'pie',
},
labels: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
legend: {
  position: 'bottom',
},
};

const barChartOptions = {
chart: {
  type: 'bar',
},
xaxis: {
  categories: ['Male', 'Female'],
},
plotOptions: {
  bar: {
    horizontal: false,
    columnWidth: '50%',
  },
},
};

const stateChartOptions = {
chart: {
  type: 'bar',
},
xaxis: {
  categories: ['Lagos', 'Kano', 'Oyo', 'Rivers', 'Kaduna', 'Enugu', 'Abuja', 'Benue'],
},
plotOptions: {
  bar: {
    horizontal: true,
    columnWidth: '50%',
  },
},
};

const ageChartOptions = {
chart: {
  type: 'bar',
},
xaxis: {
  categories: ['Under 10', '10-15', '15-20', '20-25', '25-30', '30+'],
},
plotOptions: {
  bar: {
    horizontal: false,
    columnWidth: '50%',
  },
},
};

const heatMapChartOptions = {
chart: {
  type: 'heatmap',
},
plotOptions: {
  heatmap: {
    shadeIntensity: 0.5,
    radius: 0,
    useFillColorAsStroke: true,
    colorScale: {
      ranges: [
        { from: 0, to: 10, color: '#f3b4ab' },
        { from: 11, to: 20, color: '#f79878' },
        { from: 21, to: 30, color: '#f37a44' },
        { from: 31, to: 40, color: '#f1621c' },
        { from: 41, to: 50, color: '#f14000' },
      ],
    },
  },
},
dataLabels: {
  enabled: false,
},
};

</script>