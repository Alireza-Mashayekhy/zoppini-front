import { MARKETING_FLAG_COOKIE } from '@/lib/consent/grant';

/** Account id from the Yektanet install guide. */
export const YEKTANET_ACCOUNT_ID = 'UPvVtiYL';

/** Id the vendor loader gives to the script it appends. */
export const YEKTANET_SCRIPT_ID = `ua-script-${YEKTANET_ACCOUNT_ID}`;

/** Id of the inline gate rendered first inside `<head>`. */
export const YEKTANET_INLINE_SCRIPT_ID = 'yektanet-analytics';

/**
 * Yektanet loader, kept byte-compatible with the vendor snippet so support can
 * recognise the installation (same account id, same `ua-script-…` id, same
 * cache-busting query and the same `insertBefore` placement).
 *
 * It is not modified in spirit; it is only wrapped by the consent gate below.
 */
const LOADER = `!function (t, e, n) {
    t.yektanetAnalyticsObject = n, t[n] = t[n] || function () {
        t[n].q.push(arguments)
    }, t[n].q = t[n].q || [];
    var a = new Date, r = a.getFullYear().toString() + "0" + a.getMonth() + "0" + a.getDate() + "0" + a.getHours(),
        c = e.getElementsByTagName("script")[0], s = e.createElement("script");
    s.id = "${YEKTANET_SCRIPT_ID}"; s.dataset.analyticsobject = n;
    s.async = 1; s.type = "text/javascript";
    s.src = "https://cdn.yektanet.com/rg_woebegone/scripts_v3/${YEKTANET_ACCOUNT_ID}/rg.complete.js?v=" + r, c.parentNode.insertBefore(s, c)
}(window, document, "yektanet");`;

/**
 * Inline gate for the root layout.
 *
 * Runs while `<head>` is parsed — not on `load`, not on user interaction, not
 * after a timeout — so a visit is counted even if the visitor closes the page
 * early. It only runs the vendor loader once the visitor has granted the
 * marketing category (`${MARKETING_FLAG_COOKIE}=1`, written by the consent route
 * handler and re-synced by the consent manager). Because it is inline and in
 * every page's first bytes, it also runs on cart, checkout and payment-return
 * pages. A visitor granting marketing in the current page is picked up from the
 * `privacy-changed` event without a reload; withdrawal reloads the document
 * (see the consent manager) so the SDK is unloaded.
 */
export const YEKTANET_HEAD_SCRIPT = `(function () {
    var flag = "${MARKETING_FLAG_COOKIE}=1";
    function allowed() {
        var parts = document.cookie ? document.cookie.split(";") : [];
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].replace(/^\\s+/, "") === flag) return true;
        }
        return false;
    }
    function load() {
        if (document.getElementById("${YEKTANET_SCRIPT_ID}")) return;
        ${LOADER}
    }
    function check() { if (allowed()) load(); }
    check();
    if (window.addEventListener) window.addEventListener("privacy-changed", check);
})();`;
