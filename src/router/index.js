import { createRouter, createWebHistory } from 'vue-router';
import Login from '../js/Pages/Auth/Login.vue';
import Dashboard from '../js/Pages/Admin/Dashboard.vue';
import Users from '../js/Pages/Admin/Team/Index.vue';
import Students from '../js/Pages/Admin/Team/Students.vue';
import Show from '../js/Pages/Admin/Team/Show.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/admin/organizations/create', component: Dashboard },
  { path: '/admin/users/create', component: Dashboard },
  { path: '/users', component: Users },
  { path: '/students', component: Students },
  { path: '/users/:id', component: Show } // Dynami
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth Guard
router.beforeEach((to, from, next) => {
  const authTokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY;
  const isAuthenticated = !!localStorage.getItem(authTokenKey); // Check if token exists

  if (to.path !== '/login' && !isAuthenticated) {
      next('/login'); // Redirect to login if not authenticated
  } else if (to.path === '/login' && isAuthenticated) {
      next('/dashboard'); // Redirect to dashboard if already authenticated
  }  else {
      next(); // Allow navigation
  }
});



export default router;
