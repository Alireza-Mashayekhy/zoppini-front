'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api/client';

type Row = Record<string, string | number | null>;
type Products = { views: Row[]; sales: Row[] };
type Report = {
  overview: Row;
  previous: Row;
  timeseries: Row[];
  funnel: Row[];
  sources: Row[];
  devices: Row[];
  consent: Row[];
  products: Products;
};
const names: Record<string, string> = {
  count: 'تعداد',
  views: 'بازدید محصول',
  bought: 'اقلام خرید معتبر',
  changes: 'تغییر انتخاب',
  withdrawals: 'پس‌گرفتن رضایت',
  page_view: 'بازدید صفحه',
  product_view: 'بازدید محصول',
  add_to_cart: 'افزودن به سبد',
  checkout_started: 'شروع پرداخت',
  purchase_success: 'خرید تأییدشده',
  all: 'پذیرش همه',
  reject: 'رد غیرضروری',
  custom: 'انتخاب سفارشی',
};
const colors = ['#2563eb', '#9333ea', '#d97706', '#0d9488', '#dc2626'];
const steps = [
  'page_view',
  'product_view',
  'add_to_cart',
  'checkout_started',
  'purchase_success',
];
const number = (v: unknown) =>
  Number(v || 0).toLocaleString('fa-IR', { maximumFractionDigits: 2 });
function today() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
function shift(day: string, n: number) {
  return new Date(Date.parse(`${day}T12:00:00Z`) + n * 86400000)
    .toISOString()
    .slice(0, 10);
}
function Plot({
  title,
  data,
  keys,
  x = 'label',
  line = false,
}: {
  title: string;
  data: Row[];
  keys: string[];
  x?: string;
  line?: boolean;
}) {
  const Chart = line ? LineChart : BarChart;
  return (
    <section className="rounded-lg border bg-white p-4 min-w-0">
      <h2 className="font-bold mb-4">{title}</h2>
      {!data.length ? (
        <p>داده‌ای در این بازه ثبت نشده است.</p>
      ) : (
        <div dir="ltr" className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <Chart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x} />
              <YAxis />
              <Tooltip />
              <Legend />
              {keys.map((key, i) =>
                line ? (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={names[key] || key}
                    stroke={colors[i % 5]}
                  />
                ) : (
                  <Bar
                    key={key}
                    dataKey={key}
                    name={names[key] || key}
                    fill={colors[i % 5]}
                  />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
export default function AnalyticsPage() {
  const [start, setStart] = useState(() => shift(today(), -6));
  const [end, setEnd] = useState(today);
  const [source, setSource] = useState('');
  const [campaign, setCampaign] = useState('');
  const [product, setProduct] = useState('');
  const [device, setDevice] = useState('');
  const [visitor, setVisitor] = useState('');
  const [journeyVisitor, setJourneyVisitor] = useState('');
  const params = useMemo(
    () => ({
      start,
      end,
      ...(source ? { source } : {}),
      ...(campaign ? { campaign } : {}),
      ...(product ? { product } : {}),
      ...(device ? { device } : {}),
    }),
    [start, end, source, campaign, product, device],
  );
  const report = useQuery({
    queryKey: ['behavior-analytics', params],
    queryFn: async () => {
      const span =
        Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
      const get = async <T,>(kind: string, p: object = params): Promise<T> =>
        (await api.get(`/admin/analytics/${kind}`, { params: p })).data.data;
      const [
        overview,
        previous,
        timeseries,
        funnel,
        sources,
        devices,
        consent,
        products,
      ] = await Promise.all([
        get<Row>('overview'),
        get<Row>('overview', {
          ...params,
          start: shift(start, -span),
          end: shift(start, -1),
        }),
        get<Row[]>('timeseries'),
        get<Row[]>('funnel'),
        get<Row[]>('sources'),
        get<Row[]>('devices'),
        get<Row[]>('consent'),
        get<Products>('products'),
      ]);
      return {
        overview,
        previous,
        timeseries,
        funnel,
        sources,
        devices,
        consent,
        products,
      } as Report;
    },
    retry: false,
  });
  const visitors = useQuery({
    queryKey: ['analytics-visitors', params],
    queryFn: async () =>
      (await api.get('/admin/analytics/visitors', { params })).data
        .data as Row[],
    retry: false,
  });
  const journey = useQuery({
    queryKey: ['analytics-journey', params, journeyVisitor],
    enabled: !!journeyVisitor,
    queryFn: async () =>
      (
        await api.get('/admin/analytics/journey', {
          params: { ...params, visitor: journeyVisitor, limit: 100 },
        })
      ).data.data as Row[],
    retry: false,
  });
  const d = report.data;
  const daily = useMemo(() => {
    const map = new Map<string, Row>();
    if (
      d &&
      Number.isFinite(Date.parse(start)) &&
      Number.isFinite(Date.parse(end))
    ) {
      for (let i = 0; i < 366; i++) {
        const day = shift(start, i);
        if (day > end) break;
        map.set(day, { day, ...Object.fromEntries(steps.map(s => [s, 0])) });
      }
    }
    for (const r of d?.timeseries || []) {
      const day = String(r.day);
      const row = map.get(day) || { day };
      row[String(r.name)] = Number(r.count);
      map.set(day, row);
    }
    return [...map.values()];
  }, [d, start, end]);
  const products = useMemo(() => {
    const map = new Map<string, Row>();
    for (const r of d?.products.views || [])
      if (r.product)
        map.set(String(r.product), {
          label: String(r.product),
          views: Number(r.views),
          bought: 0,
        });
    for (const r of d?.products.sales || []) {
      const k = String(r.product);
      map.set(k, {
        ...(map.get(k) || { label: k, views: 0 }),
        bought: Number(r.bought),
      });
    }
    return [...map.values()].slice(0, 100);
  }, [d]);
  const kpis: Record<string, string> = {
    visitors: 'بازدیدکنندگان مستعار',
    sessions: 'نشست‌ها',
    pageViews: 'بازدید صفحه',
    productViews: 'بازدید محصول',
    adds: 'افزودن به سبد',
    checkouts: 'شروع پرداخت',
    purchases: 'خرید تأییدشده با رضایت',
    revenue: 'مجموع finalPrice خریدهای تأییدشده با رضایت',
    aov: 'میانگین finalPrice خریدهای تأییدشده با رضایت',
    financialOrders: 'سفارش‌های معتبر مبنای مبلغ و میانگین',
  };
  const funnel = steps.map(key => ({
    label: names[key],
    count: Number(d?.funnel.find(r => r.name === key)?.count || 0),
  }));
  return (
    <div dir="rtl" className="space-y-6">
      <h1 className="text-2xl font-bold">تحلیل رفتار کاربران</h1>
      <p className="text-sm leading-7">
        فقط رفتار دارای رضایت تحلیل؛ این گزارش نماینده تمام بازدیدکنندگان یا
        دفتر مالی نیست. ذخیره UTC، روزهای نمایش Asia/Tehran. مبلغ از سفارش معتبر
        و به واحد خام finalPrice سایت است (واحد نهایی نیازمند تأیید مالک).
        فیلترها روی رویداد اعمال می‌شوند؛ Unknown در انتساب منبع، محصول یا
        دستگاه ممکن است باعث حذف مراحل شود.
      </p>
      <section className="flex flex-wrap gap-3 rounded border bg-white p-4">
        {['امروز', 'دیروز', '۷ روز', '۳۰ روز'].map((label, i) => (
          <Button
            variant="outline"
            key={label}
            onClick={() => {
              setStart(
                shift(today(), i === 0 ? 0 : i === 1 ? -1 : i === 2 ? -6 : -29),
              );
              setEnd(shift(today(), i === 1 ? -1 : 0));
            }}
          >
            {label}
          </Button>
        ))}
        <label>
          از (میلادی)
          <Input
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </label>
        <label>
          تا (میلادی)
          <Input
            type="date"
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </label>
        <label>
          منبع
          <Input
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="Unknown / خالی: همه"
          />
        </label>
        <label>
          کمپین
          <Input value={campaign} onChange={e => setCampaign(e.target.value)} />
        </label>
        <label>
          شناسه محصول (گروه بازدیدکنندگان مرتبط)
          <Input
            type="number"
            min={1}
            value={product}
            onChange={e => setProduct(e.target.value)}
          />
        </label>
        <label>
          دستگاه
          <select
            className="border rounded p-2 block"
            value={device}
            onChange={e => setDevice(e.target.value)}
          >
            <option value="">همه</option>
            <option value="mobile">موبایل</option>
            <option value="tablet">تبلت</option>
            <option value="desktop">دسکتاپ</option>
          </select>
        </label>
      </section>
      {report.isPending && <p role="status">در حال دریافت گزارش…</p>}
      {report.error && (
        <p role="alert">
          دریافت گزارش ممکن نشد. مجوز Admin، بازه (حداکثر ۳۶۶ روز) و فیلترها را
          بررسی کنید.
        </p>
      )}
      {d && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(kpis).map(([key, label]) => {
              const prev = Number(d.previous[key] || 0),
                now = Number(d.overview[key] || 0);
              return (
                <article key={key} className="bg-white rounded border p-4">
                  <h2>{label}</h2>
                  <strong className="text-2xl block my-2">{number(now)}</strong>
                  <small>
                    بازه قبلی: {number(prev)} | تغییر:{' '}
                    {prev
                      ? `${number(((now - prev) / prev) * 100)}٪`
                      : 'مخرج صفر / نامشخص'}
                  </small>
                </article>
              );
            })}
          </section>
          <Plot
            title="روند روزانه (تعداد رویداد)"
            data={daily}
            x="day"
            keys={steps}
            line
          />
          <Plot
            title="قیف ترتیبی بازدیدکنندگان مستعار"
            data={funnel}
            keys={['count']}
          />
          <div className="bg-white border rounded p-4 text-sm leading-8">
            <p>
              هر مرحله: تعداد visitor یکتا که در همین بازه مراحل قبلی را
              به‌ترتیب زمانی طی کرده است؛ نه تعداد رویداد و نه الزاماً یک نشست.
            </p>
            {funnel.map((r, i) => (
              <p key={r.label}>
                {r.label}: {number(r.count)}{' '}
                {i > 0 &&
                  `| تبدیل از مرحله قبل: ${funnel[i - 1].count ? number((r.count / funnel[i - 1].count) * 100) + '٪' : '—'} | ریزش: ${funnel[i - 1].count ? number((1 - r.count / funnel[i - 1].count) * 100) + '٪' : '—'}`}
              </p>
            ))}
            <p>
              تبدیل کل = visitor مرحله خرید ÷ visitor مرحله بازدید صفحه:{' '}
              {funnel[0].count
                ? number((funnel[4].count / funnel[0].count) * 100) + '٪'
                : '—'}
              . AOV = مجموع finalPrice خریدهای تأییدشده ÷ تعداد همان سفارش‌های
              دارای وضعیت فعلی paid/shipped/delivered؛ سفارش لغوشده از مبلغ و
              میانگین کنار گذاشته می‌شود. این مبلغ خالص مرجوعی نیست. رویداد
              مرورگر منبع درآمد نیست.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Plot
              title="منبع / کمپین (رویداد) — حداکثر ۳۰۰۰ گروه"
              data={d.sources.map(r => ({
                ...r,
                label: `${r.source} / ${r.campaign}`,
              }))}
              keys={['count']}
            />
            <Plot
              title="دستگاه (رویداد، بدون fingerprint)"
              data={d.devices.map(r => ({ ...r, label: String(r.device) }))}
              keys={['count']}
            />
            <Plot
              title="محصول: بازدید در برابر تعداد اقلام خرید معتبر (۱۰۰ محصول)"
              data={products}
              keys={['views', 'bought']}
            />
            <Plot
              title="تصمیم‌های ثبت‌شده رضایت (بدون فیلتر رفتاری)"
              data={d.consent.map(r => ({
                ...r,
                label: names[String(r.choice)],
              }))}
              keys={['count', 'changes', 'withdrawals']}
            />
          </div>
          <div className="bg-white border rounded p-4">
            <p>
              سهم انتخاب‌ها فقط از تصمیم‌های ثبت‌شده است؛ نرخ پذیرش کل
              بازدیدکنندگان نیست. تغییر و پس‌گرفتن، زیرمجموعه تصمیم‌ها هستند و
              جمع‌زدن دوباره صحیح نیست.
            </p>
            {d.consent.map(r => (
              <p key={String(r.choice)}>
                {names[String(r.choice)]}: {number(r.count)} — سهم:{' '}
                {number(
                  (Number(r.count) /
                    Math.max(
                      1,
                      d.consent.reduce((s, r) => s + Number(r.count), 0),
                    )) *
                    100,
                )}
                ٪
              </p>
            ))}
          </div>
          <section className="bg-white border rounded p-4 space-y-3">
            <h2>مسیر بازدیدکننده مستعار (حداکثر ۱۰۰ رویداد)</h2>
            <p>
              بدون اتصال به حساب مشتری. دسترسی فقط Admin؛ داده فردی به ربات
              ارسال نمی‌شود.
            </p>
            <label>
              شناسه‌های اخیر (حداکثر ۱۰۰)
              <select
                className="block border p-2 w-full"
                dir="ltr"
                value={visitor}
                onChange={e => setVisitor(e.target.value)}
              >
                <option value="">انتخاب بازدیدکننده</option>
                {visitors.data?.map(r => (
                  <option key={String(r.visitor)} value={String(r.visitor)}>
                    {String(r.visitor)} — {number(r.events)}
                  </option>
                ))}
              </select>
            </label>
            <Input
              aria-label="visitor UUID"
              dir="ltr"
              value={visitor}
              onChange={e => setVisitor(e.target.value)}
              placeholder="visitor_id UUID"
            />
            <Button onClick={() => setJourneyVisitor(visitor)}>
              مشاهده مسیر
            </Button>
            {journey.error && <p role="alert">شناسه یا دسترسی نامعتبر است.</p>}
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>زمان تهران</th>
                    <th>رویداد</th>
                    <th>محصول</th>
                    <th>واریانت</th>
                  </tr>
                </thead>
                <tbody>
                  {journey.data?.map((r, i) => (
                    <tr key={i}>
                      <td>
                        {new Date(
                          String(r.created_at).replace(/Z?$/, 'Z'),
                        ).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}
                      </td>
                      <td>{names[String(r.name)] || r.name}</td>
                      <td>{r.product || '—'}</td>
                      <td>{r.variant || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
