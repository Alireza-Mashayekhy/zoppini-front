export interface VisitResponse {
  id: number;
  ip: string | null;
  guestId: string | null;
  userId: number | null;
  page: string;
  path: string | null;
  referrer: string | null;
  userAgent: string | null;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  screen: string | null;
  language: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

export interface VisitStats {
  total: number;
  today: number;
  uniqueIps: number;
  byPage: { page: string; count: number }[];
  byDevice: { deviceType: string; count: number }[];
}
