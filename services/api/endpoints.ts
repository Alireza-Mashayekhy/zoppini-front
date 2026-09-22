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

  blog: {
    list: '/blog',
    adminList: '/admin/blog',
    create: '/admin/blog',
    update: (id: number) => `/admin/blog/${id}`,
    delete: (id: number) => `/admin/blog/${id}`,
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
    adminGetById: (id: string) => `/admin/products/${id}`,
    edit: (productId: number) => `/admin/products/${productId}`,
    delete: (productId: number) => `/admin/products/${productId}`,
    addColorImage: (productId: number) =>
      `/admin/products/${productId}/color-images`,
    deleteColorImage: (id: number) => `/admin/products/images/${id}`,
    suggestedProducts: (productId: number) =>
      `/admin/products/${productId}/suggested-products`,
    sameColorProducts: (productId: number) =>
      `/admin/products/${productId}/same-color-products`,
    updateColor: (id: number) => `/admin/products/color/${id}`,
    deleteColor: (id: number) => `/admin/products/color/${id}`,
    updateSize: (id: number) => `/admin/products/size/${id}`,
    deleteSize: (id: number) => `/admin/products/size/${id}`,

    featured: '/featured',
    adminFeatured: '/admin/featured',
    removeFeatured: (id: number) => `/admin/featured/${id}`,

    style: '/style',
    adminStyle: '/admin/style',
    removeStyle: (id: number) => `/admin/style/${id}`,

    rahkaranList: '/admin/products/rahkaran/search',
    syncProducts: '/admin/products/sync-rahkaran',
    syncProduct: (id: number) => `/admin/products/${id}/sync-rahkaran`,
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

  order: {
    create: '/orders',
    list: '/orders',
    get: (orderId: number) => `/orders/${orderId}`,
    cancel: (orderId: number) => `/orders/${orderId}/cancel`,
    confirmFromWallet: (orderId: number) =>
      `/orders/${orderId}/confirm-from-wallet`,

    adminList: '/admin/orders',
    adminGet: (orderId: number) => `/admin/orders/${orderId}`,
    adminUpdateStatus: (orderId: number) => `/admin/orders/${orderId}/status`,
    adminCancel: (orderId: number) => `/admin/orders/${orderId}/admin-cancel`,
  },

  addresses: {
    list: '/addresses',
    create: '/addresses',
    update: (addressId: number) => `/addresses/${addressId}`,
    delete: (addressId: number) => `/addresses/${addressId}`,
    setDefault: (addressId: number) => `/addresses/${addressId}/default`,
  },

  locations: {
    province: '/locations/provinces',
    cities: (provinceId: number) => `/locations/provinces/${provinceId}/cities`,
  },

  b2b: {
    list: '/admin/b2b',
    create: '/b2b',
  },

  payment: {
    start: '/payment/start',
    startWalletCharge: '/payment/start-wallet-charge',
  },

  wallet: {
    info: '/wallet',
    transactions: '/wallet/transactions',
  },

  discounts: {
    list: '/admin/discounts',
    detail: (id: number) => `/admin/discounts/${id}`,
    create: '/admin/discounts',
    update: (id: number) => `/admin/discounts/${id}`,
    delete: (id: number) => `/admin/discounts/${id}`,
    apply: '/discounts/apply',
  },

  contact: {
    create: '/contact',

    list: '/admin/contact',
    detail: (id: number) => `/admin/contact/${id}`,
    delete: (id: number) => `/admin/contact/${id}`,
  },

  gamificateion: {
    create: '/gamification/participations',
    stats: '/admin/gamification/stats',
    list: '/admin/gamification/participations',
  },

  visits: {
    track: '/visits',
    stats: '/admin/visits/stats',
    list: '/admin/visits',
    delete: (id: number) => `/admin/visits/${id}`,
  },

  productGuides: {
    // مشتری
    publicBySlug: (slug: string) => `/product-guides/product-slug/${slug}`,

    // جدول‌های سایزبندی
    sizeTables: '/admin/product-guides/size-tables',
    sizeTable: (id: number) => `/admin/product-guides/size-tables/${id}`,
    sizeTableDuplicate: (id: number) =>
      `/admin/product-guides/size-tables/${id}/duplicate`,
    sizeTableArchive: (id: number) =>
      `/admin/product-guides/size-tables/${id}/archive`,

    // راهنماهای شست‌وشو
    careGuides: '/admin/product-guides/care-guides',
    careGuide: (id: number) => `/admin/product-guides/care-guides/${id}`,
    careGuideDuplicate: (id: number) =>
      `/admin/product-guides/care-guides/${id}/duplicate`,
    careGuideArchive: (id: number) =>
      `/admin/product-guides/care-guides/${id}/archive`,

    // تصاویر روش اندازه‌گیری
    measurementGuides: '/admin/product-guides/measurement-guides',
    measurementGuide: (id: number) =>
      `/admin/product-guides/measurement-guides/${id}`,
    measurementGuideDuplicate: (id: number) =>
      `/admin/product-guides/measurement-guides/${id}/duplicate`,
    measurementGuideArchive: (id: number) =>
      `/admin/product-guides/measurement-guides/${id}/archive`,
    measurementImage: (guideId: number, imageId: number) =>
      `/admin/product-guides/measurement-guides/${guideId}/images/${imageId}`,
    measurementImageOrder: (guideId: number) =>
      `/admin/product-guides/measurement-guides/${guideId}/images/order`,

    // کاربرد و اختصاص
    usage: (type: string, id: number) =>
      `/admin/product-guides/usage/${type}/${id}`,
    assignmentPreview: '/admin/product-guides/assignments/preview',
    assignment: '/admin/product-guides/assignments',

    // راهنمای یک محصول
    productState: (productId: number) =>
      `/admin/product-guides/products/${productId}`,
    productSetting: (productId: number) =>
      `/admin/product-guides/products/${productId}/setting`,
    productOverrides: (productId: number) =>
      `/admin/product-guides/products/${productId}/overrides`,
    productOverride: (productId: number, overrideId: number) =>
      `/admin/product-guides/products/${productId}/overrides/${overrideId}`,
    productOverrideRebase: (productId: number, overrideId: number) =>
      `/admin/product-guides/products/${productId}/overrides/${overrideId}/rebase`,
  },
};
