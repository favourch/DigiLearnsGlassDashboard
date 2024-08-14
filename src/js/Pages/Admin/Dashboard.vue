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
            <span v-if="user && user.first_name" class="mt-1 font-semibold md:font-normal text-xl">
              {{ `Welcome back, ${user.first_name}` }} 👋
            </span>
            <span v-else class="mt-1 font-semibold md:font-normal text-xl">
               Welcome back, Gideon 👋
            </span>
          </p>
        </div>
        <div class="relative flex items-center">
          <VueDatePicker v-model="selectedDateRange" range @update:model="updateDateRange" />
          <button @click="toggleStateView" class="ml-2 text-gray-500 hover:text-gray-700">
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
              {{ isShowingTop4.value ? $t('Show Least 4') : $t('Show Top 4') }}
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
import chroma from 'chroma-js';  // Import chroma.js

const store = useStore();
const user = ref(store.getters.getUser); // Get the user data from Vuex

const isProfileModalOpen = ref(false);
const isLoading = ref(true); // Add a loading state

const metrics = ref([]);
const usersByClassSeries = ref([]);
const usersByGenderSeries = ref([]);
const usersByStateSeries = ref([]);
const usersByAgeSeries = ref([]);
const heatMapSeries = ref([]);

const isShowingTop4 = ref(true); // Changed from isShowingTop8
const top4States = ref([]);
const least4States = ref([]);
const selectedDateRange = ref(null);

onMounted(() => {
  console.log('Dashboard component mounted');  // Add log here to check if onMounted is triggered
  fetchDashboardData(); // Fetch data when the component is mounted
});

async function fetchDashboardData() {
  try {
    console.log('fetchDashboardData called');  // Log the function call

    const params = {};
    if (selectedDateRange.value && selectedDateRange.value.length === 2) {
      params.startDate = selectedDateRange.value[0];
      params.endDate = selectedDateRange.value[1];
    }

    console.log('Request params:', params);  // Log the request params

    // Fetch both dashboard data and heatmap data concurrently
    const [dashboardDataResponse, heatmapDataResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API}/api/dashboard-data`, { params }),
      axios.get(`${import.meta.env.VITE_API}/api/user-actions-heatmap`)
    ]);

    console.log('Dashboard data:', dashboardDataResponse.data);  // Log the dashboard data response
    console.log('Heatmap data:', heatmapDataResponse.data);  // Log the heatmap data response

    const data = dashboardDataResponse.data;
    const heatMapData = heatmapDataResponse.data.heatMapData;
    const maxCount = heatmapDataResponse.data.maxCount;
    const minCount = heatmapDataResponse.data.minCount;

    // Update metrics for the dashboard
    metrics.value = [
      { title: 'API Calls', value: data.apiCalls },
      { title: 'Total Subjects', value: data.totalSubjects },
      { title: 'Total States', value: data.totalStates },
      { title: 'Total Classes', value: data.totalClasses },
      { title: 'Active Users', value: data.activeUsers },
      { title: 'Avg Ret Users', value: data.totalRevenue },
      { title: 'Subscribers', value: data.openTickets },
      { title: 'Total SMS', value: data.totalMessages },
    ];

    // Process and update age group data
    const ageGroups = data.usersByAge.map(item => item._id);
    const ageCounts = data.usersByAge.map(item => item.count);

    ageChartOptions.value.xaxis.categories = ageGroups;
    usersByAgeSeries.value = [{ name: 'Users', data: ageCounts }];

    // Update other chart series data
    usersByClassSeries.value = data.usersByClass.map(item => item.count);
    pieChartOptions.value.labels = data.usersByClass.map(item => item._id);
    usersByGenderSeries.value = [{ name: 'Users', data: data.usersByGender.map(item => item.count) }];

    // Set the initial state view to top 4 states
    const sortedStates = data.usersByState.sort((a, b) => b.count - a.count);
    top4States.value = sortedStates.slice(0, 4);
    least4States.value = sortedStates.slice(-4);
    updateStateView(top4States.value);

    // Update heatmap series data
    heatMapSeries.value = heatMapData.map(day => ({
      name: day.name,
      data: day.data.map((count, hour) => ({ x: `${hour}:00`, y: count }))
    }));

    // Generate and set the dynamic color scale for the heatmap
    heatMapChartOptions.value.plotOptions.heatmap.colorScale.ranges = generateColorScale(minCount, maxCount, 5);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
}

// Function to generate a dynamic color scale based on the data range and distribute it across the range of counts
function generateColorScale(min, max, numberOfShades) {
  const scale = chroma.scale(['#00A100', '#FF0000']).domain([min, max]);
  const step = (max - min) / numberOfShades;
  const ranges = [];

  for (let i = 0; i < numberOfShades; i++) {
    const from = min + i * step;
    const to = from + step;
    ranges.push({
      from: Math.floor(from),
      to: Math.floor(to),
      color: scale(from).hex(),
      name: `Activity ${Math.floor(from)} - ${Math.floor(to)}`
    });
  }

  return ranges;
}

function updateStateView(stateData) {
  stateChartOptions.value.xaxis.categories = stateData.map(item => item._id);
  usersByStateSeries.value = [{ name: 'States', data: stateData.map(item => item.count) }];
}

function toggleStateView() {
  isShowingTop4.value = !isShowingTop4.value;
  const stateData = isShowingTop4.value ? top4States.value : least4States.value;
  updateStateView(stateData);
}

function updateDateRange(value) {
  selectedDateRange.value = value;
  isLoading.value = true; // Start the loading spinner

  // Fetch the updated data
  fetchDashboardData().finally(() => {
    isLoading.value = false; // Stop the loading spinner once data is fetched
  });
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
    categories: [], // This will be dynamically set with state names
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
    categories: [], // This will be dynamically set with age groups
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '70%',
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
        ranges: [] // This will be dynamically populated
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
});

</script>

