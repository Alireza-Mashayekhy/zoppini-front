import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CAMPAIGN_LAUNCH_UTC_MS,
  formatCountdownUnit,
  remainingUntilLaunch,
} from '../lib/campaign-launch';

const launch = CAMPAIGN_LAUNCH_UTC_MS;

test('launch is midnight on Sunday 1 Azar 1405 in Tehran', () => {
  const instant = new Date(launch);
  assert.equal(instant.toISOString(), '2026-11-21T20:30:00.000Z');

  const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  assert.deepEqual(
    [
      values.weekday,
      values.year,
      values.month,
      values.day,
      values.hour,
      values.minute,
      values.second,
    ],
    ['Sunday', '1405', '9', '1', '00', '00', '00'],
  );
});

test('countdown converts elapsed milliseconds to days, hours, minutes and seconds', () => {
  assert.deepEqual(remainingUntilLaunch(launch - 183845000), {
    days: 2,
    hours: 3,
    minutes: 4,
    seconds: 5,
    expired: false,
  });
});

test('shows one remaining second until launch, then clamps at zero', () => {
  assert.deepEqual(remainingUntilLaunch(launch - 1), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 1,
    expired: false,
  });
  const started = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  assert.deepEqual(remainingUntilLaunch(launch), started);
  assert.deepEqual(remainingUntilLaunch(launch + 86400000), started);
});

test('timer digits use padded Persian numerals', () => {
  assert.equal(formatCountdownUnit(0), '۰۰');
  assert.equal(formatCountdownUnit(8), '۰۸');
  assert.equal(formatCountdownUnit(59), '۵۹');
});
