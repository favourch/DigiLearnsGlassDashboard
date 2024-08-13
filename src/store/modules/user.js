// store/modules/user.js
export const user = {
    state: () => ({
      userInfo: null,
    }),
    mutations: {
      SET_USER(state, user) {
        state.userInfo = user;
      },
    },
    actions: {
      setUser({ commit }, user) {
        commit('SET_USER', user);
      },
    },
    getters: {
      getUserInfo: (state) => state.userInfo,
    },
  };
  