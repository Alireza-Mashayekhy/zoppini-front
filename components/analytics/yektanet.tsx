import {
  YEKTANET_HEAD_SCRIPT,
  YEKTANET_INLINE_SCRIPT_ID,
} from '@/lib/analytics/yektanet';

/**
 * Yektanet analytics for every page of the site.
 *
 * Rendered first inside `<head>` of the root layout, so it is parsed and
 * executed before the app bundle and before any page markup: no `beforeInteractive`
 * queue, no `defer`, no wait for hydration. Being in the root layout is what
 * covers cart, checkout and payment-return pages too, and it is rendered once so
 * a page never carries two copies of the same account script.
 *
 * Next.js still prepends its own metadata, preload and chunk tags before this
 * one; the vendor loader inserts the real Yektanet script before the first
 * `script` element, which puts it ahead of every other script in `<head>`.
 */
export default function YektanetAnalytics() {
  return (
    <script
      id={YEKTANET_INLINE_SCRIPT_ID}
      dangerouslySetInnerHTML={{ __html: YEKTANET_HEAD_SCRIPT }}
    />
  );
}
