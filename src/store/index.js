// store.js (Vuex example)
import { createStore } from 'vuex';

export const store = createStore({
  state: {
    user: {
      first_name: "",
      last_name: "",
    },
  },
  mutations: {
    setUser(state, userData) {
      state.user = userData;
    },
  },
  actions: {
    setUser({ commit }, userData) {
      commit('setUser', userData);
    },
  },
  getters: {
    getUser: (state) => state.user,
  },
});
