// Midnight on Sunday 1 Azar 1405 in Asia/Tehran. Store the approved instant
// with its UTC offset so neither the server nor the browser's timezone matters.
export const CAMPAIGN_LAUNCH_UTC_MS = Date.parse('2026-11-22T00:00:00+03:30');

export function remainingUntilLaunch(nowMs: number) {
  const totalMs = Math.max(0, CAMPAIGN_LAUNCH_UTC_MS - nowMs);
  // Don't display all zeroes in the last fraction of a second before launch.
  const secondsLeft = Math.ceil(totalMs / 1000);

  return {
    days: Math.floor(secondsLeft / 86400),
    hours: Math.floor((secondsLeft % 86400) / 3600),
    minutes: Math.floor((secondsLeft % 3600) / 60),
    seconds: secondsLeft % 60,
    expired: totalMs === 0,
  };
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function formatCountdownUnit(value: number) {
  return String(value)
    .padStart(2, '0')
    .replace(/\d/g, digit => FA_DIGITS[Number(digit)]);
}
