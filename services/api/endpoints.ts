export const endpoints = {
  auth: {
    login: '/auth/login',
    otp: '/auth/send-otp',
  },

  users: {
    list: '/users',
    detail: (id: number) => `/users/${id}`,
  },

  categories: {
    list: '/categories',
  },
};
