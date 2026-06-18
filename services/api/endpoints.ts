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

  products: {
    colorList: '/products/color',
    createColor: '/products/color',
    sizeList: '/products/size',
    createSize: '/products/size',
    list: '/products',
    create: '/products',
    addColorImage: (productId: number) => `/products/${productId}/color-images`,
    deleteColorImage: (id: number) => `/products/images/${id}`,
  },
};
