export const endpoints = {
  auth: {
    login: '/auth/login',
    otp: '/auth/send-otp',
  },

  users: {
    list: '/admin/users',
    detail: (id: number) => `/admin/users/${id}`,
  },

  categories: {
    list: '/categories',
    adminList: '/admin/categories',
    create: '/admin/categories',
    update: (id: number) => `/admin/categories/${id}`,
    delete: (id: number) => `/admin/categories/${id}`,
  },

  products: {
    colorList: '/products/color',
    sizeList: '/products/size',
    list: '/products',

    adminColorList: '/admin/products/color',
    createColor: '/admin/products/color',
    adminSizeList: '/admin/products/size',
    createSize: '/admin/products/size',
    create: '/admin/products',
    adminList: '/admin/products',
    edit: (productId: number) => `/admin/products/${productId}`,
    delete: (productId: number) => `/admin/products/${productId}`,
    addColorImage: (productId: number) =>
      `/admin/products/${productId}/color-images`,
    deleteColorImage: (id: number) => `/admin/products/images/${id}`,
    suggestedProducts: (productId: number) =>
      `/admin/products/${productId}/suggested-products`,
  },
};
