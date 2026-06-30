export const endpoints = {
  auth: {
    login: '/auth/login',
    otp: '/auth/send-otp',
    logout: '/auth/logout',
    me: '/auth/me',
    signUp: '/auth/sign-up',
    loginPassword: '/auth/login-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  users: {
    list: '/admin/users',
    detail: (id: number) => `/admin/users/${id}`,
    edit: (id: number) => `/users/${id}`,
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

    featured: '/featured',
    adminFeatured: '/admin/featured',
    removeFeatured: (id: number) => `/admin/featured/${id}`,
  },

  cart: {
    list: '/cart',
    add: '/cart/add',
    update: (itemId: number) => `/cart/item/${itemId}`,
    deleteItem: (itemId: number) => `/cart/item/${itemId}`,
    clear: '/cart/clear',
  },

  wishlist: {
    get: '/wishlist',
    products: '/wishlist/products',
    check: (productId: number) => `/wishlist/check/${productId}`,
    count: '/wishlist/count',
    add: '/wishlist',
    remove: (productId: number) => `/wishlist/${productId}`,
  },
};
