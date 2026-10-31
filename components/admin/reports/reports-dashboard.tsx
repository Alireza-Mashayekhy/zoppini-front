'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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

import { api } from '@/services/api/client';

type Period = { start: string; end: string };
type Row = {
  id: number;
  name: string;
  units: number | string;
  revenue: number | string;
  orders: number | string;
  stock?: number | string;
  activeProducts?: number | string;
};
type Table = {
  rows: Row[];
  pagination: { page: number; limit: number; total: number };
  meta: { generatedAt: string };
};
type Totals = {
  gross: number;
  bookedSales: number;
  discounts: number;
  registered: number;
  paidOrders: number;
  cancelled: number;
  average: number | null;
  netSales: null;
  refunds: null;
};
type Summary = {
  meta: { generatedAt: string; previousStart: string; previousEnd: string };
  current: Totals;
  previous: Totals;
  statuses: { status: string; count: number }[];
  daily: { day: string; paidOrders: number; bookedSales: number }[];
  missingProductLines: number;
  inconsistentOrders: number;
};
type InterestRow = {
  id: number;
  name: string;
  views: string | number;
  adds: string | number;
  viewSessions: string | number;
  checkoutSessions: string | number;
  purchaseSessions: string | number;
};
type Interest = {
  meta: { generatedAt: string };
  products: InterestRow[];
  categories: InterestRow[];
  coverage: { name: string; earliest: string }[];
};
type Kind = 'products' | 'categories' | 'variants';

const num = (n: unknown) =>
  Number(n || 0).toLocaleString('fa-IR', { maximumFractionDigits: 1 });
const localDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (name: string) => parts.find(p => p.type === name)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
};
const shift = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
// The current month is the current Iranian calendar month, not the Gregorian month.
function persianMonthKey(day: string) {
  return new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date(`${day}T12:00:00Z`));
}
function preset(type: string): Period {
  const today = localDate();
  if (type === 'yesterday') {
    const d = shift(today, -1);
    return { start: d, end: d };
  }
  if (type === '7') return { start: shift(today, -6), end: today };
  if (type === '30') return { start: shift(today, -29), end: today };
  if (type === 'month') {
    let first = today;
    const month = persianMonthKey(today);
    while (persianMonthKey(shift(first, -1)) === month)
      first = shift(first, -1);
    return { start: first, end: today };
  }
  return { start: today, end: today };
}
async function get<T>(path: string, params: object): Promise<T> {
  const result = await api.get(path, { params });
  return result.data.data as T;
}
const panel = 'rounded-xl border bg-white p-4';
const input = 'rounded border border-gray-300 bg-white px-3 py-2 text-sm';
function change(now: number | null, previous: number | null): string {
  if (now == null || previous == null || previous === 0)
    return 'مقایسه معتبر موجود نیست';
  return `${num(((now - previous) / previous) * 100)}٪ نسبت به بازه قبلی`;
}
function Metric({
  title,
  value,
  previous,
  money,
  description,
}: {
  title: string;
  value: number | null;
  previous: number | null;
  money?: boolean;
  description: string;
}) {
  return (
    <div className={panel}>
      <h3 className="text-sm text-gray-600">{title}</h3>
      <div className="mt-2 text-xl font-semibold">
        {value == null
          ? 'دادهٔ کافی موجود نیست'
          : `${num(value)}${money ? ' تومان' : ''}`}
      </div>
      <p className="mt-2 text-xs text-gray-500">{change(value, previous)}</p>
      <p className="mt-2 text-xs leading-6 text-gray-500">{description}</p>
    </div>
  );
}
const labels: Record<string, string> = {
  pending: 'در انتظار',
  paid: 'پرداخت‌شده',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  cancelled: 'لغوشده',
};
function ErrorState({ error }: { error: unknown }) {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return (
    <p
      role="alert"
      className="rounded border border-red-300 bg-red-50 p-4 text-red-800"
    >
      {status === 403 || status === 401
        ? 'دسترسی به گزارش‌ها ندارید.'
        : 'دریافت گزارش ناموفق بود؛ دوباره تلاش کنید.'}
    </p>
  );
}
function ChartShell({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={panel}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-xs leading-6 text-gray-500">{description}</p>
      {empty ? (
        <p className="p-10 text-center text-sm text-gray-500">
          داده‌ای در این بازه وجود ندارد.
        </p>
      ) : (
        <div className="mt-4 h-64 w-full" dir="ltr">
          {children}
        </div>
      )}
    </section>
  );
}
async function download(kind: string, params: object) {
  const result = await api.get(`/admin/reports/export/${kind}`, {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(result.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${kind}-report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function Export({ kind, params }: { kind: string; params: object }) {
  const [error, setError] = useState(false);
  return (
    <span>
      <button
        className="rounded border px-3 py-2 text-xs"
        onClick={() => {
          setError(false);
          void download(kind, params).catch(() => setError(true));
        }}
      >
        دریافت CSV کامل
      </button>
      {error && (
        <span role="alert" className="mr-2 text-xs text-red-700">
          دریافت ناموفق بود
        </span>
      )}
    </span>
  );
}

type SalesTableResult = {
  rows: { id: number; name: string; createdAt: string; status: string; gross: string | number; discount: string | number; revenue: string | number }[];
  pagination: { total: number };
  meta: { generatedAt: string };
};
function SalesTable({ period }: { period: Period }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const params = { ...period, search, sort, direction, page, limit: 20 };
  const data = useQuery({ queryKey: ['sales-report-orders', params], queryFn: () => get<SalesTableResult>('/admin/reports/tables/sales', params) });
  return <section className={panel}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">جدول فروش ثبت‌شده</h2><Export kind="sales" params={params} /></div>
    <p className="mt-2 text-xs text-gray-500">فقط سفارش‌های واجد شرایط؛ مبلغ کالا بدون ارسال و پیش از بازپرداخت نامشخص است.</p>
    <div className="my-3 flex flex-wrap gap-2">
      <input className={input} aria-label="شماره سفارش" placeholder="جست‌وجوی شماره سفارش" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      <select className={input} aria-label="مرتب‌سازی فروش" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="date">تاریخ سفارش</option><option value="name">شماره سفارش</option><option value="gross">ناخالص</option><option value="discount">تخفیف</option><option value="revenue">فروش ثبت‌شده</option></select>
      <select className={input} aria-label="جهت مرتب‌سازی فروش" value={direction} onChange={e => { setDirection(e.target.value as 'asc' | 'desc'); setPage(1); }}><option value="desc">نزولی</option><option value="asc">صعودی</option></select>
    </div>
    {data.isPending ? <p>در حال بارگذاری...</p> : data.error ? <ErrorState error={data.error} /> : data.data.rows.length === 0 ? <p className="py-6 text-sm text-gray-500">داده‌ای یافت نشد.</p> : <>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-right text-sm"><thead><tr className="border-b"><th className="p-2">شماره سفارش</th><th>تاریخ تهران</th><th>وضعیت فعلی</th><th>ناخالص (تومان)</th><th>تخفیف (تومان)</th><th>ثبت‌شده (تومان)</th></tr></thead><tbody>{data.data.rows.map(row => <tr className="border-b" key={row.id}><td className="p-2">{row.name}</td><td>{new Date(row.createdAt).toLocaleString('fa-IR', {timeZone:'Asia/Tehran'})}</td><td>{({paid:'پرداخت‌شده',shipped:'ارسال‌شده',delivered:'تحویل‌شده'} as Record<string,string>)[row.status] ?? row.status}</td><td>{num(row.gross)}</td><td>{num(row.discount)}</td><td>{num(row.revenue)}</td></tr>)}</tbody></table></div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page-1)}>قبلی</button><span>صفحه {num(page)} · {num(data.data.pagination.total)} نتیجه</span><button className="rounded border px-3 py-1 disabled:opacity-40" disabled={page * 20 >= data.data.pagination.total} onClick={() => setPage(page+1)}>بعدی</button><span>تولید: {new Date(data.data.meta.generatedAt).toLocaleString('fa-IR',{timeZone:'Asia/Tehran'})}</span></div>
    </>}
  </section>;
}

function DataTable({
  period,
  kind,
  title,
  initialDirection = 'desc',
  totalSales,
}: {
  period: Period;
  kind: Kind;
  title: string;
  initialDirection?: 'asc' | 'desc';
  totalSales: number;
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('units');
  const [direction, setDirection] = useState<'asc' | 'desc'>(initialDirection);
  const [page, setPage] = useState(1);
  const params = { ...period, search, sort, direction, page, limit: 20 };
  const data = useQuery({
    queryKey: ['sales-report-table', kind, params],
    queryFn: () => get<Table>(`/admin/reports/tables/${kind}`, params),
  });
  return (
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        <Export kind={kind} params={params} />
      </div>
      <p className="mt-2 text-xs leading-6 text-gray-500">
        {kind === 'categories'
          ? 'محصول ممکن است در چند دسته باشد؛ جمع و سهم دسته‌ها هم‌پوشانی دارند. تعداد محصولات موجود، وضعیت فعلی است.'
          : 'موجودی فعلی است؛ تاریخچهٔ موجودی در بازه موجود نیست. کم‌فروش لزوماً کم‌تقاضا نیست.'}{' '}
        مبلغ پس از تخفیف به نسبت اقلام تخصیص یافته و بازپرداخت جزئی در آن مشخص
        نیست.
      </p>
      <div className="my-3 flex flex-wrap gap-2">
        <input
          className={input}
          placeholder="جست‌وجوی نام"
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          aria-label="مرتب‌سازی"
          className={input}
          value={sort}
          onChange={e => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="units">تعداد واحد</option>
          <option value="revenue">مبلغ</option>
          <option value="orders">تعداد سفارش</option>
          <option value="name">نام</option>
          <option value="stock">
            {kind === 'categories' ? 'محصولات موجود' : 'موجودی'}
          </option>
        </select>
        <select
          aria-label="جهت مرتب‌سازی"
          className={input}
          value={direction}
          onChange={e => {
            setDirection(e.target.value as 'asc' | 'desc');
            setPage(1);
          }}
        >
          <option value="desc">نزولی</option>
          <option value="asc">صعودی</option>
        </select>
      </div>
      {data.isPending ? (
        <p>در حال بارگذاری...</p>
      ) : data.error ? (
        <ErrorState error={data.error} />
      ) : data.data.rows.length === 0 ? (
        <p className="py-6 text-sm text-gray-500">داده‌ای یافت نشد.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-right text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">نام</th>
                  <th>تعداد فروش</th>
                  <th>مبلغ ثبت‌شده (تومان)</th>
                  <th>سفارش</th>
                  <th>
                    {kind === 'categories' ? 'محصول موجود' : 'موجودی فعلی'}
                  </th>
                  {kind === 'categories' && <th>سهم تقریبی</th>}
                </tr>
              </thead>
              <tbody>
                {data.data.rows.map(row => (
                  <tr className="border-b" key={row.id}>
                    <td className="p-2">{row.name}</td>
                    <td>{num(row.units)}</td>
                    <td>{num(row.revenue)}</td>
                    <td>{num(row.orders)}</td>
                    <td>
                      {num(
                        kind === 'categories' ? row.activeProducts : row.stock,
                      )}{' '}
                      {kind !== 'categories' && Number(row.stock) <= 0 && (
                        <span className="text-amber-700">ناموجود</span>
                      )}
                    </td>
                    {kind === 'categories' && (
                      <td>
                        {totalSales > 0
                          ? `${num((Number(row.revenue) / totalSales) * 100)}٪`
                          : 'نامشخص'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <button
              className="rounded border px-3 py-1 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              قبلی
            </button>
            <span>
              صفحه {num(page)} · {num(data.data.pagination.total)} نتیجه
            </span>
            <button
              className="rounded border px-3 py-1 disabled:opacity-40"
              disabled={page * 20 >= data.data.pagination.total}
              onClick={() => setPage(page + 1)}
            >
              بعدی
            </button>
            <span>
              تولید:{' '}
              {new Date(data.data.meta.generatedAt).toLocaleString('fa-IR', {
                timeZone: 'Asia/Tehran',
              })}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
function InterestTable({
  title,
  rows,
}: {
  title: string;
  rows: InterestRow[];
}) {
  return (
    <div>
      <h3 className="mb-2 font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">رویدادی در این بازه موجود نیست.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead>
              <tr className="border-b">
                <th>نام</th>
                <th>بازدید</th>
                <th>افزودن به سبد</th>
                <th>نشست با checkout</th>
                <th>نشست با خرید</th>
                <th>نرخ تبدیل نشست</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">{r.name}</td>
                  <td>{num(r.views)}</td>
                  <td>{num(r.adds)}</td>
                  <td>{num(r.checkoutSessions)}</td>
                  <td>{num(r.purchaseSessions)}</td>
                  <td>
                    {Number(r.viewSessions) > 0
                      ? `${num((Number(r.purchaseSessions) / Number(r.viewSessions)) * 100)}٪`
                      : 'نامشخص'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default function ReportsDashboard() {
  const [period, setPeriod] = useState<Period>(() => preset('30'));
  const [draft, setDraft] = useState(period);
  const [rangeError, setRangeError] = useState('');
  const summary = useQuery({
    queryKey: ['reports-summary', period],
    queryFn: () => get<Summary>('/admin/reports/summary', period),
  });
  const interest = useQuery({
    queryKey: ['reports-interest', period],
    queryFn: () => get<Interest>('/admin/reports/interest', period),
  });
  const top = useQuery({
    queryKey: ['reports-top', period],
    queryFn: () =>
      get<Table>('/admin/reports/tables/products', {
        ...period,
        sort: 'units',
        direction: 'desc',
        limit: 8,
        page: 1,
      }),
  });
  const low = useQuery({
    queryKey: ['reports-low', period],
    queryFn: () =>
      get<Table>('/admin/reports/tables/products', {
        ...period,
        sort: 'units',
        direction: 'asc',
        limit: 8,
        page: 1,
      }),
  });
  const categories = useQuery({
    queryKey: ['reports-categories', period],
    queryFn: () =>
      get<Table>('/admin/reports/tables/categories', {
        ...period,
        sort: 'units',
        direction: 'desc',
        limit: 8,
        page: 1,
      }),
  });
  const selectPreset = (value: string) => {
    const p = preset(value);
    setDraft(p);
    setPeriod(p);
    setRangeError('');
  };
  const apply = () => {
    const a = Date.parse(`${draft.start}T00:00:00Z`),
      b = Date.parse(`${draft.end}T00:00:00Z`);
    if (
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      b < a ||
      (b - a) / 86400000 >= 366
    ) {
      setRangeError('بازه باید معتبر و حداکثر ۳۶۶ روز باشد.');
      return;
    }
    setRangeError('');
    setPeriod(draft);
  };
  const c = summary.data?.current,
    p = summary.data?.previous;
  return (
    <div className="flex flex-col gap-4" dir="rtl">
      <header>
        <h1 className="text-2xl font-bold">گزارش‌های فروش و کالا</h1>
        <p className="mt-1 text-sm text-gray-500">
          بازه ثبت سفارش: {period.start} تا {period.end} · منطقه زمانی
          Asia/Tehran · تومان
        </p>
      </header>
      <section className={panel}>
        <div className="flex flex-wrap gap-2">
          {[
            ['today', 'امروز'],
            ['yesterday', 'دیروز'],
            ['7', '۷ روز اخیر'],
            ['30', '۳۰ روز اخیر'],
            ['month', 'ماه جاری شمسی'],
          ].map(([v, label]) => (
            <button
              className="rounded border px-3 py-2 text-sm"
              key={v}
              onClick={() => selectPreset(v)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-xs">
            از (میلادی)
            <input
              className={`${input} mr-2`}
              type="date"
              value={draft.start}
              onChange={e => setDraft({ ...draft, start: e.target.value })}
            />
          </label>
          <label className="text-xs">
            تا (میلادی)
            <input
              className={`${input} mr-2`}
              type="date"
              value={draft.end}
              onChange={e => setDraft({ ...draft, end: e.target.value })}
            />
          </label>
          <button
            onClick={apply}
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            اعمال بازه
          </button>
        </div>
        {rangeError && (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {rangeError}
          </p>
        )}
      </section>
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm leading-7">
        آمار مالی بر اساس تاریخ ثبت و وضعیت فعلی سفارش است؛ بازپرداخت جزئی و
        علامت سفارش آزمایشی به‌طور یکپارچه ثبت نمی‌شوند. فروش خالص قطعی قابل
        محاسبه نیست. ارقام فروش ثبت‌شده، بدون هزینه ارسال و قبل از اصلاح
        بازپرداخت‌اند.
      </div>
      {summary.isPending ? (
        <div className={panel}>در حال بارگذاری گزارش...</div>
      ) : summary.error ? (
        <ErrorState error={summary.error} />
      ) : (
        c &&
        p && (
          <>
            <div className="text-xs text-gray-500">
              مقایسه با {summary.data.meta.previousStart} تا{' '}
              {summary.data.meta.previousEnd} · تولید:{' '}
              {new Date(summary.data.meta.generatedAt).toLocaleString('fa-IR', {
                timeZone: 'Asia/Tehran',
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                title="فروش خالص قطعی"
                value={null}
                previous={null}
                money
                description="ثبت جامع بازپرداخت و سفارش آزمایشی موجود نیست."
              />
              <Metric
                title="فروش ناخالص ثبت‌شده"
                value={c.gross}
                previous={p.gross}
                money
                description="جمع قیمت اصلی کالاهای سفارش‌های واجد شواهد پرداخت؛ بدون ارسال و پیش از تخفیف."
              />
              <Metric
                title="فروش ثبت‌شده پس از تخفیف"
                value={c.bookedSales}
                previous={p.bookedSales}
                money
                description="مبلغ کالا پس از تخفیف؛ بازپرداخت جزئی از آن کسر نشده است."
              />
              <Metric
                title="میانگین مبلغ کالا در سفارش"
                value={c.average}
                previous={p.average}
                money
                description="فروش ثبت‌شده پس از تخفیف تقسیم بر تعداد سفارش واجد شواهد پرداخت."
              />
              <Metric
                title="سفارش ثبت‌شده"
                value={c.registered}
                previous={p.registered}
                description="همه سفارش‌ها بر اساس زمان ثبت."
              />
              <Metric
                title="سفارش با شواهد پرداخت"
                value={c.paidOrders}
                previous={p.paidOrders}
                description="وضعیت پرداخت‌شده، ارسال یا تحویل با شواهد درگاه/کیف پول؛ سفارش با مبلغ نهایی صفر بدون تراکنش پذیرفته می‌شود."
              />
              <Metric
                title="تخفیف"
                value={c.discounts}
                previous={p.discounts}
                money
                description="مجموع تخفیف اقلام سفارش‌های واجد شرایط."
              />
              <Metric
                title="لغوشده"
                value={c.cancelled}
                previous={p.cancelled}
                description="تعداد سفارش‌هایی که اکنون لغو شده‌اند."
              />
              <Metric
                title="بازپرداخت / مرجوعی"
                value={null}
                previous={null}
                money
                description="دفتر کامل بازپرداخت تمام درگاه‌ها و اقلام وجود ندارد."
              />
            </div>
            {summary.data.inconsistentOrders > 0 && (
              <p className="rounded border border-amber-300 p-3 text-sm">
                {num(summary.data.inconsistentOrders)} سفارش واجد شرایط اقلام
                ناقص یا ناسازگار با مبلغ کالا دارد؛ جمع گزارش اقلام ممکن است با
                خلاصه متفاوت باشد.
              </p>
            )}
            {summary.data.missingProductLines > 0 && (
              <p className="rounded border border-amber-300 p-3 text-sm">
                {num(summary.data.missingProductLines)} قلم به واریانت حذف‌شده
                متصل است و در گزارش محصول و دسته محاسبه نمی‌شود.
              </p>
            )}
            <div className="flex justify-end">
              <Export kind="sales" params={period} />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartShell
                title="روند فروش ثبت‌شده و سفارش"
                description="فروش به تومان (محور چپ)، سفارش واجد شواهد پرداخت (محور راست)؛ خالص واقعی نامشخص است."
                empty={!summary.data.daily.some(d => Number(d.paidOrders) > 0)}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.data.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="money" />
                    <YAxis yAxisId="count" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="money"
                      dataKey="bookedSales"
                      name="فروش ثبت‌شده (تومان)"
                      stroke="#b3313a"
                    />
                    <Line
                      yAxisId="count"
                      dataKey="paidOrders"
                      name="سفارش"
                      stroke="#345d85"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartShell>
              <ChartShell
                title="وضعیت فعلی سفارش‌ها"
                description="تعداد سفارش‌های ثبت‌شده در بازه به تفکیک وضعیت فعلی."
                empty={!summary.data.statuses.length}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.data.statuses.map(x => ({
                      ...x,
                      status: labels[x.status] || x.status,
                    }))}
                  >
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="سفارش" fill="#775b54" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
              {[
                [top, 'کالاهای پرفروش'],
                [low, 'کالاهای کم‌فروش'],
                [categories, 'فروش بر اساس دسته'],
              ].map(([result, title]) => {
                const r = result as typeof top;
                return r.isPending ? (
                  <div key={String(title)} className={panel}>
                    در حال بارگذاری...
                  </div>
                ) : r.error ? (
                  <ErrorState key={String(title)} error={r.error} />
                ) : (
                  <ChartShell
                    key={String(title)}
                    title={String(title)}
                    description="تعداد واحد (محور چپ) و مبلغ ثبت‌شده به تومان (محور راست)؛ مقادیر دقیق در جدول‌های پایین. ناموجودی و تاریخچه عرضه را لحاظ کنید."
                    empty={!r.data?.rows.length}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={r.data?.rows.map(row => ({
                          ...row,
                          units: Number(row.units),
                          revenue: Number(row.revenue),
                        }))}
                      >
                        <XAxis dataKey="name" hide />
                        <YAxis yAxisId="units" allowDecimals={false} />
                        <YAxis yAxisId="money" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="units"
                          dataKey="units"
                          name="تعداد واحد"
                          fill="#a62c32"
                        />
                        <Bar
                          yAxisId="money"
                          dataKey="revenue"
                          name="مبلغ ثبت‌شده (تومان)"
                          fill="#5f7e96"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartShell>
                );
              })}
            </div>
            <SalesTable key={`sales-${period.start}-${period.end}`} period={period} />
            <DataTable
              key={`top-${period.start}-${period.end}`}
              period={period}
              kind="products"
              title="پرفروش‌ترین محصولات"
              totalSales={c.bookedSales}
            />
            <DataTable
              key={`low-${period.start}-${period.end}`}
              period={period}
              kind="products"
              title="کم‌فروش‌ترین محصولات"
              initialDirection="asc"
              totalSales={c.bookedSales}
            />
            <DataTable
              key={`cat-${period.start}-${period.end}`}
              period={period}
              kind="categories"
              title="عملکرد دسته‌بندی‌ها"
              totalSales={c.bookedSales}
            />
            <DataTable
              key={`var-${period.start}-${period.end}`}
              period={period}
              kind="variants"
              title="عملکرد رنگ و سایز"
              totalSales={c.bookedSales}
            />
          </>
        )
      )}
      <section className={panel}>
        <h2 className="font-semibold">علاقه و رفتار کاربران — جدا از فروش</h2>
        <p className="mt-2 text-xs leading-6 text-gray-500">
          فقط کاربران دارای رضایت تحلیل؛ ۲۰ مورد برتر بازدید. نرخ تبدیل =
          نشست‌های بازدیدکنندهٔ همان کالا/دسته با خرید تأییدشده در همان نشست ÷
          نشست‌های بازدید؛ رابطهٔ علّی یا قیف ترتیبی نیست. داده به سیاست نگهداری
          محدود است و گذشته بازسازی نمی‌شود.
        </p>
        {interest.isPending ? (
          <p>در حال بارگذاری...</p>
        ) : interest.error ? (
          <ErrorState error={interest.error} />
        ) : (
          <div className="mt-4 space-y-6">
            <p className="text-xs text-gray-500">زمان تولید: {new Date(interest.data.meta.generatedAt).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}</p>
            <p className="text-xs text-gray-500">
              اولین رویداد باقی‌مانده:{' '}
              {interest.data.coverage.length
                ? interest.data.coverage
                    .map(
                      c =>
                        `${c.name}: ${new Date(c.earliest).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}`,
                    )
                    .join(' · ')
                : 'داده‌ای موجود نیست'}
            </p>
            <InterestTable title="محصول" rows={interest.data.products} />
            <InterestTable title="دسته" rows={interest.data.categories} />
          </div>
        )}
      </section>
    </div>
  );
}
