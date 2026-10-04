/**
 * پکیج hls.js برای مسیر «hls.js/light» تایپ TypeScript همراه ندارد
 * (در package.json فیلد exports برای این مسیر، شرط types ندارد)،
 * پس تایپ‌ها را از خود hls.js دوباره اعلام می‌کنیم.
 *
 * نسخه light همان چیزهایی که لازم داریم (TS + ABR + MSE + Worker)
 * را دارد و فقط DRM، CMCD، زیرنویس و صدای جایگزین را حذف کرده؛
 * حجم باندلش حدود ۳۷٪ کمتر از نسخه کامل است.
 */
declare module 'hls.js/light' {
  import Hls from 'hls.js';

  export default Hls;
}
