import { createRouter, createWebHistory } from 'vue-router';
import Login from '../js/Pages/Auth/Login.vue';
import Dashboard from '../js/Pages/Admin/Dashboard.vue';
import Users from '../js/Pages/Admin/Team/Index.vue';
import Students from '../js/Pages/Admin/Team/Students.vue';
import Show from '../js/Pages/Admin/Team/Show.vue';

const routes = [
  {
    path: '/',
    redirect: '/login',
    meta: { title: 'DigiLearns' },
  },
  {
    path: '/login',
    component: Login,
    meta: { title: 'Login - DigiLearns' },
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard' },
  },
  {
    path: '/admin/organizations/create',
    component: Dashboard,
    meta: { title: 'Create Organization - My Application' },
  },
  {
    path: '/admin/users/create',
    component: Dashboard,
    meta: { title: 'Create User - My Application' },
  },
  {
    path: '/users',
    component: Users,
    meta: { title: 'Manage Users' },
  },
  {
    path: '/students',
    component: Students,
    meta: { title: 'Manage Students' },
  },
  {
    path: '/users/:id',
    component: Show,
    meta: { title: 'User Details' },
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth Guard
router.beforeEach((to, from, next) => {
  const authTokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY;
  const isAuthenticated = !!localStorage.getItem(authTokenKey);

  if (to.path !== '/login' && !isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    next('/dashboard');
  } else {
    // Set the document title from the route meta
    if (to.meta.title) {
      document.title = to.meta.title;
    }
    next();
  }
});

export default router;
