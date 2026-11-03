import type { CareInstructionsTitle } from '@/services/features/products/type';

/** Default also covers products created before the title option existed. */
export function careInstructionsLabel(title?: CareInstructionsTitle | null) {
  return title === 'maintenance' ? 'نحوه نگهداری' : 'نحوه شستشو';
}
