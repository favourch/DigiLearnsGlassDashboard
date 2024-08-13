<template>
  <div>
    <!-- Mobile Header with Hamburger Menu -->
    <div class="fixed top-0 z-10 w-full bg-white border-b px-4 py-4 flex items-center justify-between md:hidden">
      <div @click="toggleSidebar">
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 17h8m-8-5h14M5 7h8"></path>
          </svg>
        </span>
      </div>
      <h3 class="text-xl">DigiLearns</h3>
      <div>
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10S17.523 2 12 2"></path>
              <path d="M4.271 18.346S6.5 15.5 12 15.5s7.73 2.846 7.73 2.846M12 12a3 3 0 1 0 0-6a3 3 0 0 0 0 6"></path>
            </g>
          </svg>
        </span>
      </div>
    </div>

    <!-- Sidebar Overlay -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-20 bg-black bg-opacity-50" @click="toggleSidebar"></div>

    <!-- Sidebar -->
    <aside v-if="isSidebarOpen" class="fixed top-0 left-0 z-30 h-full w-80 bg-white flex flex-col">
      <div class="flex items-center justify-between px-5 pt-5 h-20 mb-4">
        <h2 class="ml-2 text-2xl">DigiLearns</h2>
        <div class="relative text-sm text-black">
          <div class="lang-dd flex items-center space-x-2 rounded-xl cursor-pointer">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
                  <path d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2S2 6.477 2 12"></path>
                  <path d="M13 2.05S16 6 16 12s-3 9.95-3 9.95m-2 0S8 18 8 12s3-9.95 3-9.95M2.63 15.5h18.74m-18.74-7h18.74"></path>
                </g>
              </svg>
            </div>
            <div class="uppercase">en</div>
            <div class="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path fill="currentColor" fill-rule="evenodd" d="M4.47 9.4a.75.75 0 0 1 1.06 0l6.364 6.364a.25.25 0 0 0 .354 0L18.612 9.4a.75.75 0 0 1 1.06 1.06l-6.364 6.364a1.75 1.75 0 0 1-2.475 0L4.47 10.46a.75.75 0 0 1 0-1.06"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-grow space-y-3 px-2 overflow-y-scroll">
        <div class="flex-1">
          <ul class="pt-2 space-y-1 text-sm mb-2">
            <!-- Add your sidebar menu items here -->
            <li class="hover:bg-slate-50 hover:text-black rounded-[5px] px-2 truncate">
              <a rel="noopener noreferrer" class="flex items-center p-2 space-x-3 rounded-md" href="/admin/dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 11.452V16.8c0 1.12 0 1.68.218 2.109c.192.376.497.682.874.873c.427.218.987.218 2.105.218h9.606c1.118 0 1.677 0 2.104-.218a2 2 0 0 0 .875-.873c.218-.428.218-.987.218-2.105v-5.352c0-.534 0-.801-.065-1.05a1.998 1.998 0 0 0-.28-.617c-.145-.213-.345-.39-.748-.741l-4.8-4.2c-.746-.653-1.12-.98-1.54-1.104c-.37-.11-.764-.11-1.135 0c-.42.124-.792.45-1.538 1.102L5.093 9.044c-.402.352-.603.528-.747.74a2 2 0 0 0-.281.618C4 10.65 4 10.918 4 11.452Z"></path>
                </svg>
                <span>Dashboard</span>
              </a>
            </li>
            <li class="hover:bg-slate-50 hover:text-black rounded-[5px] px-2 truncate">
              <a rel="noopener noreferrer" class="flex items-center p-2 space-x-3 rounded-md" href="/admin/organizations">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <g fill="none" fill-rule="evenodd">
                    <path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z"></path>
                    <path fill="currentColor"
                      d="M17 3.722v5.497l2.864.716A1.5 1.5 0 0 1 21 11.39V19a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2v-7.69a1.5 1.5 0 0 1 .83-1.343L7 8.382V6.347a1.5 1.5 0 0 1 .973-1.405l7-2.625A1.5 1.5 0 0 1 17 3.722Zm-2 .721l-6 2.25V19h6V4.443Zm2 6.838V19h2v-7.22l-2-.5Zm-10-.663l-2 1V19h2v-8.382Z"></path>
                  </g>
                </svg>
                <span>Schools</span>
              </a>
            </li>
            <!-- Add more items here -->
          </ul>
        </div>
      </div>
      <a class="border-2 border-primary text-sm rounded-[5px] mb-1 m-3 py-2 px-4 flex items-center justify-between cursor-pointer"
        href="/admin/addons">
        <div class="flex items-center space-x-3">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor"
                d="M19 6h-2c0-2.8-2.2-5-5-5S7 3.2 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2m-7-3c1.7 0 3 1.3 3 3H9c0-1.7 1.3-3 3-3m7 17H5V8h14zm-7-8c-1.7 0-3-1.3-3-3H7c0 2.8 2.2 5 5 5s5-2.2 5-5h-2c0 1.7-1.3 3-3 3">
              </path>
            </svg>
          </span>
          <span>Addons</span>
        </div>
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path fill="currentColor" d="M9 17.898c0 1.074 1.265 1.648 2.073.941l6.31-5.522a1.75 1.75 0 0 0 0-2.634l-6.31-5.522C10.265 4.454 9 5.028 9 6.102z">
            </path>
          </svg>
        </span>
      </a>
      <div class="flex items-center m-3 p-2 rounded-xl h-14 py-1 md:py-1 mt-2 space-x-4 justify-between bg-slate-50">
        <div class="flex space-x-2">
          <div class="rounded-xl p-1 bg-slate-200">
            <div class="rounded-full w-9 h-9 flex justify-center items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <g fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="6" r="4"></circle>
                  <path stroke-linecap="round"
                    d="M19.998 18c.002-.164.002-.331.002-.5c0-2.485-3.582-4.5-8-4.5s-8 2.015-8 4.5S4 22 12 22c2.231 0 3.84-.157 5-.437">
                  </path>
                </g>
              </svg>
            </div>
          </div>
          <div>
            <h2 class="text-[15px] capitalize truncate w-[6em]">{{ getUser.first_name || '' }} {{ getUser.last_name || '' }}</h2>
            <span class="flex items-center space-x-1">
              <span class="text-sm hover:underline dark:text-gray-400 cursor-pointer">View Profile</span>
            </span>
          </div>
        </div>
        <a class="hover:bg-[#F6F7F9] hover:rounded-full w-[fit-content] p-2" href="/logout">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="m12 15l3-3m0 0l-3-3m3 3H4m5-4.751V7.2c0-1.12 0-1.68.218-2.108c.192-.377.497-.682.874-.874C10.52 4 11.08 4 12.2 4h4.6c1.12 0 1.68 0 2.107.218c.377.192.683.497.875.874c.218.427.218.987.218 2.105v9.607c0 1.118 0 1.677-.218 2.104a2.002 2.002 0 0 1-.875.874c-.427.218-.986.218-2.104.218h-4.606c-1.118 0-1.678 0-2.105-.218a2 2 0 0 1-.874-.874C9 18.48 9 17.92 9 16.8v-.05">
            </path>
          </svg>
        </a>
      </div>
    </aside>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: "MobileSidebar",
  data() {
    return {
      isSidebarOpen: false,
    };
  },
  computed: {
    ...mapGetters(['getUser']),
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
  },
};
</script>

<style scoped>
/* Add any scoped CSS here */
</style>
