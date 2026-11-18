/**
 * استایل مشترک اکشن‌های صفحهٔ محصول (اشتراک‌گذاری، مقایسه، علاقه‌مندی).
 *
 * اندازه، پدینگ، حاشیه و مرکزچینی آیکن در همهٔ این دکمه‌ها از همین یک قاعده
 * می‌آید تا جعبهٔ بیرونی هر سه دقیقاً هم‌اندازه باشد. دکمهٔ «افزودن به سبد»
 * عمداً این قاعده را استفاده نمی‌کند چون کشسان است و باید فضای باقی‌مانده را
 * پر کند؛ فقط ارتفاع آن با این ردیف هماهنگ است.
 */
export const productActionButtonClass =
  'flex h-[50px] w-[50px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white p-0 text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30 disabled:pointer-events-none disabled:opacity-60';
