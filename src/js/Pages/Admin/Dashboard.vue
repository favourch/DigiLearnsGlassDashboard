<template>
  <AppLayout>
    <div v-if="isLoading" class="h-full flex items-center justify-center">
      <Spinner />
    </div>
    <div v-else-if="user" class="bg-white md:bg-inherit p-4 md:p-8 rounded-[5px] text-[#000] h-full overflow-y-auto">
      <div class="flex justify-between mt-3 md:mt-0">
        <div>
          <h2 class="md:block hidden text-xl mb-1">{{ $t('Dashboard') }}</h2>
          <p class="mb-6 flex items-center leading-6">
            <span class="mt-1 font-semibold md:font-normal text-xl">{{ `Welcome back, ${user.first_name}` }} 👋</span>
          </p>
        </div>
        <div class="relative flex items-center">
          <VueDatePicker v-model="selectedDateRange" range @update:model="updateDateRange" />
          <button @click="fetchDashboardData" class="ml-2 text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
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
import Spinner from './Spinner.vue';  // Import Spinner component
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
const isLoading = ref(true); // Add a loading state

const metrics = ref([]);
const usersByClassSeries = ref([]);
const usersByGenderSeries = ref([]);
const usersByStateSeries = ref([]);
const usersByAgeSeries = ref([]);
const heatMapSeries = ref([]);

const isShowingTop8 = ref(true);
const selectedDateRange = ref(null);

onMounted(() => {
  fetchDashboardData(); // Fetch data when the component is mounted
});

async function fetchDashboardData() {
  try {
    const params = {};
    if (selectedDateRange.value && selectedDateRange.value.length === 2) {
      params.startDate = selectedDateRange.value[0];
      params.endDate = selectedDateRange.value[1];
    }

    const response = await axios.get(`${import.meta.env.VITE_API}/api/dashboard-data`, { params });
    const data = response.data;

    // Update metrics
    metrics.value = [
      { title: 'API Calls', value: data.apiCalls },
      { title: 'Total Subjects', value: data.totalSubjects },
      { title: 'Total States', value: data.totalStates },
      { title: 'Total Classes', value: data.totalClasses },
      { title: 'Active Users', value: data.activeUsers },
      { title: 'Total Revenue', value: data.totalRevenue },
      { title: 'Open Tickets', value: data.openTickets },
      { title: 'Total Messages', value: data.totalMessages },
    ];

    // Update chart series data
    usersByClassSeries.value = data.usersByClass.map(item => item.count);
    pieChartOptions.value.labels = data.usersByClass.map(item => item._id); // Update class labels
    usersByGenderSeries.value = [{ name: 'Users', data: data.usersByGender.map(item => item.count) }];
    usersByStateSeries.value = [{ name: 'States', data: data.usersByState.map(item => item.count) }];
    usersByAgeSeries.value = [{ name: 'Users', data: data.usersByAge.map(item => item.count) }];

    // Update heatmap series data
    heatMapSeries.value = Object.keys(data.activityHeatMap).map(day => ({
      name: day,
      data: data.activityHeatMap[day].map((count, index) => ({ x: `${index} AM/PM`, y: count })),
    }));
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    isLoading.value = false; // Stop loading once data is fetched
  }
}

function updateDateRange(value) {
  selectedDateRange.value = value;
  isLoading.value = true; // Start the loading spinner

  // Fetch the updated data
  fetchDashboardData().finally(() => {
    isLoading.value = false; // Stop the loading spinner once data is fetched
  });
}


function toggleStateView() {
  isShowingTop8.value = !isShowingTop8.value;
  // You might want to update the data based on whether top 8 or least 8 is being shown.
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

const pieChartOptions = ref({
  chart: {
    type: 'pie',
  },
  labels: [], // This will be updated dynamically
  legend: {
    position: 'bottom',
  },
});

const barChartOptions = ref({
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
});

const stateChartOptions = ref({
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
});

const ageChartOptions = ref({
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
});

const heatMapChartOptions = ref({
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
  { from: 11, to: 20, color: '#f79878' },  // Added colon after `from`
  { from: 21, to: 30, color: '#f37a44' },  // Added colon after `from`
  { from: 31, to: 40, color: '#f1621c' },  // Added colon after `from`
  { from: 41, to: 50, color: '#f14000' },  // Added colon after `from`
]

      },
    },
  },
  dataLabels: {
    enabled: false,
  },
});
</script>
