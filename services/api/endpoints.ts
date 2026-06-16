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
    create: '/categories',
    update: (id: number) => `/categories/${id}`,
    delete: (id: number) => `/categories/${id}`,
  },
};
