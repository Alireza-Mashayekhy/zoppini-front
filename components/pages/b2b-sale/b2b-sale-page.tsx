import './b2b-sale.css';

import Image from 'next/image';
import Link from 'next/link';

import B2bSaleRequestForm from './b2b-sale-request-form';
import B2bServiceLink from './b2b-service-link';

const trustItems = [
  'فعالیت از سال ۱۳۷۷',
  'زنجیرهٔ یکپارچهٔ طراحی، تأمین و تولید',
  'سفارش پروژه‌ای و همکاری بلندمدت',
];

const services = [
  {
    num: '01',
    title: 'کارت هدیه سازمانی',
    description:
      'برای قدردانی از کارکنان، مشتریان و شرکای تجاری؛ با آزادی انتخاب از محصولات زوپینی.',
    items: [
      'تعیین مبلغ متناسب با بودجهٔ سازمان',
      'خرید حضوری از فروشگاه‌های زوپینی',
      'هماهنگی اعتبار و کد خرید آنلاین',
    ],
    action: 'درخواست کارت هدیه',
  },
  {
    num: '02',
    title: 'تأمین پوشاک سازمانی',
    description:
      'برای خرید گروهی پوشاک کارکنان و سفارش‌های پروژه‌ای، با انتخاب از محصولات و الگوهای مجموعه.',
    items: [
      'انتخاب مدل، رنگ و سایزبندی',
      'بررسی تعداد و موعد موردنیاز',
      'امکان برنامه‌ریزی تأمین دوره‌ای',
    ],
    action: 'درخواست تأمین پوشاک',
  },
  {
    num: '03',
    title: 'تولید اختصاصی',
    description:
      'برای سازمان‌هایی که پوشاکی متناسب با هویت مجموعهٔ خود می‌خواهند.',
    items: [
      'حداقل سفارش تولید اختصاصی: ۸۰ عدد',
      'بررسی سفارشی‌سازی و درج لوگو',
      'امکان نمونه‌دوزی برای سفارش‌های حجیم',
    ],
    action: 'بررسی سفارش اختصاصی',
  },
];

const detailRows = [
  {
    title: 'هدیه‌ای با امکان انتخاب',
    description:
      'با کارت هدیه، انتخاب مدل، رنگ و اندازه را به دریافت‌کننده بسپارید. مبلغ کارت و شرایط اعتبار متناسب با درخواست سازمان بررسی می‌شود.',
    facts: [
      { label: 'بودجه', value: 'مبلغ کارت بر اساس بودجهٔ شما' },
      { label: 'روش استفاده', value: 'خرید حضوری؛ کد آنلاین با هماهنگی' },
      { label: 'اعتبار کارت', value: 'بررسی مدت اعتبار موردنیاز سازمان' },
      { label: 'برای چه کسانی؟', value: 'کارکنان، مشتریان و شرکای تجاری' },
    ],
  },
  {
    title: 'تأمین پوشاک برای تیم شما',
    description:
      'نوع پوشاک، تعداد، سایزبندی و تاریخ موردنیاز را اعلام کنید تا گزینه‌های متناسب با سفارش شما بررسی شود. برای نیازهای تکرارشونده، امکان همکاری مستمر نیز وجود دارد.',
    note: 'سفارش کمتر از ۸۰ عدد هم قابل بررسی است؛ در این حالت از الگوهای استاندارد مجموعه استفاده می‌شود.',
    facts: [
      { label: 'انتخاب محصول', value: 'مدل‌ها و رنگ‌های مجموعه' },
      { label: 'سایزبندی', value: 'بر اساس نیاز اعلام‌شدهٔ تیم' },
      { label: 'موعد تحویل', value: 'پس از بررسی سفارش تأیید می‌شود' },
      { label: 'همکاری مستمر', value: 'تأمین دوره‌ای و پروژه‌های سالانه' },
    ],
  },
  {
    title: 'پوشاک متناسب با هویت سازمان',
    description:
      'برای تولید اختصاصی، جزئیات طراحی، نوع محصول و میزان سفارشی‌سازی در مشاوره بررسی می‌شود. امکان نمونه‌دوزی برای سفارش‌های حجیم و درج لوگو نیز قابل بررسی است.',
    facts: [
      { label: 'حداقل تعداد', value: '۸۰ عدد برای تولید اختصاصی' },
      { label: 'سفارشی‌سازی', value: 'متناسب با نیاز و هویت مجموعه' },
      { label: 'نمونه‌دوزی', value: 'قابل بررسی برای سفارش‌های حجیم' },
      { label: 'قیمت', value: 'بر اساس مشخصات نهایی پروژه' },
    ],
  },
];

const qualityItems = [
  {
    title: 'انتخاب متناسب با نیاز',
    description:
      'خرید از مجموعه، تولید اختصاصی یا کارت هدیه؛ با توجه به هدف سفارش شما.',
  },
  {
    title: 'پیشنهاد قیمت اختصاصی',
    description: 'بر اساس تعداد، نوع محصول، میزان سفارشی‌سازی و جزئیات پروژه.',
  },
  {
    title: 'امکان همکاری بلندمدت',
    description:
      'برای تأمین دوره‌ای پوشاک و سفارش‌های مستمر و برنامه‌ریزی‌شده.',
  },
];

const steps = [
  {
    num: '01',
    title: 'نیازتان را اعلام کنید',
    description: 'نوع خدمت، تعداد تقریبی و اطلاعات تماس را ثبت کنید.',
  },
  {
    num: '02',
    title: 'جزئیات را با هم بررسی می‌کنیم',
    description:
      'کارشناسان برای بررسی محصول، بودجه و زمان موردنیاز با شما تماس می‌گیرند.',
  },
  {
    num: '03',
    title: 'پیشنهاد قیمت دریافت کنید',
    description:
      'پس از بررسی، پیشنهاد رسمی متناسب با درخواست سازمان ارائه می‌شود.',
  },
];

const faqs = [
  {
    question: 'آیا برای سفارش‌های کمتر از ۸۰ عدد هم امکان همکاری وجود دارد؟',
    answer:
      'بله. حداقل ۸۰ عدد مربوط به تولید اختصاصی است. برای تعداد کمتر، سفارش با استفاده از الگوهای استاندارد مجموعه بررسی می‌شود.',
  },
  {
    question: 'قیمت سفارش سازمانی چگونه محاسبه می‌شود؟',
    answer:
      'تعداد، نوع محصول، میزان سفارشی‌سازی و جزئیات پروژه در قیمت مؤثرند. پیشنهاد رسمی پس از بررسی درخواست ارائه می‌شود.',
  },
  {
    question: 'زمان تحویل سفارش چقدر است؟',
    answer:
      'زمان تحویل به نوع محصول، تعداد و میزان سفارشی‌سازی بستگی دارد. موعد موردنیاز خود را اعلام کنید تا امکان اجرا و زمان تحویل بررسی و تأیید شود.',
  },
  {
    question: 'کارت هدیه چگونه استفاده می‌شود؟',
    answer:
      'کارت هدیه برای خرید حضوری از فروشگاه‌های زوپینی قابل استفاده است. امکان کد اختصاصی خرید آنلاین، مبلغ و مدت اعتبار با هماهنگی بررسی می‌شود.',
  },
  {
    question: 'آیا امکان درج لوگو و نمونه‌دوزی وجود دارد؟',
    answer:
      'امکان درج لوگو روی سفارش و نمونه‌دوزی برای سفارش‌های حجیم وجود دارد. جزئیات و شرایط آن در بررسی سفارش مشخص می‌شود.',
  },
  {
    question: 'شرایط پرداخت و سایزبندی چگونه مشخص می‌شود؟',
    answer:
      'شرایط پرداخت و نحوهٔ جمع‌آوری سایزها در بررسی سفارش هماهنگ می‌شود و باید پیش از نهایی‌کردن همکاری مشخص باشد.',
  },
];

export default function B2bSalePage() {
  return (
    <main className="b2b">
      {/* هیرو */}
      <section className="b2b__hero">
        <div className="b2b__wrap">
          <div className="b2b__hero-copy">
            <div>
              <span className="b2b__eyebrow">
                همکاری با سازمان‌ها و شرکت‌ها
              </span>
              <h1>پوشاک و هدایای سازمانی زوپینی</h1>
              <p>
                از تأمین پوشاک کارکنان تا هدیه‌ای برای قدردانی؛ متناسب با نیاز و
                بودجهٔ سازمان شما.
              </p>
            </div>

            <div className="b2b__hero-actions">
              <a className="b2b__button b2b__button--primary" href="#request">
                درخواست مشاوره و قیمت
              </a>
              <a href="#services">انتخاب راهکار مناسب سازمان شما</a>
            </div>
          </div>
        </div>

        <Image
          className="b2b__hero-image hidden! sm:block!"
          src="/b2b/b2b-hero-zoppini.png"
          alt="سه ست پوشاک زوپینی در فضای کاری"
          width={1800}
          height={600}
          priority
        />

        <Image
          className="b2b__hero-image sm:hidden!"
          src="/b2b/b2b-hero-mobile.png"
          alt="سه ست پوشاک زوپینی در فضای کاری"
          width={300}
          height={200}
          priority
        />
      </section>

      <div className="b2b__wrap">
        <div className="b2b__trust-strip">
          {trustItems.map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      {/* راهکارها */}
      <section className="b2b__section" id="services">
        <div className="b2b__wrap">
          <span className="b2b__eyebrow">از نیاز شما شروع می‌کنیم</span>
          <h2>چه راهکاری برای سازمان شما مناسب است؟</h2>
          <p className="b2b__intro">
            برای قدردانی، تأمین پوشاک یا تولید اختصاصی، مسیر مناسب را انتخاب
            کنید.
          </p>

          <div className="b2b__services">
            {services.map(service => (
              <article className="b2b__service" key={service.num}>
                <span className="b2b__num">{service.num}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul>
                  {service.items.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <B2bServiceLink service={service.title}>
                  {service.action}
                </B2bServiceLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* جزئیات */}
      <section className="b2b__section b2b__section--soft">
        <div className="b2b__wrap">
          <h2>جزئیاتی که انتخاب را آسان‌تر می‌کند</h2>

          {detailRows.map(row => (
            <div className="b2b__detail-row" key={row.title}>
              <div>
                <h3>{row.title}</h3>
                <p>{row.description}</p>
                {row.note && <div className="b2b__note">{row.note}</div>}
              </div>

              <div className="b2b__facts">
                {row.facts.map(fact => (
                  <div className="b2b__fact" key={fact.label}>
                    <b>{fact.label}</b>
                    <span>{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* پشتوانهٔ همکاری */}
      <section className="b2b__section">
        <div className="b2b__wrap b2b__quality">
          <div>
            <span className="b2b__eyebrow">پشتوانهٔ همکاری</span>
            <h2>از طراحی تا تأمین، با زوپینی</h2>
            <p className="b2b__intro">
              زوپینی از سال ۱۳۷۷ در حوزهٔ پوشاک مردانه فعالیت می‌کند. زنجیرهٔ
              یکپارچهٔ طراحی، تأمین و تولید، پشتوانهٔ بررسی و اجرای سفارش‌های
              سازمانی مجموعه است.
            </p>
            <Link
              className="b2b__button b2b__button--secondary"
              href="/about-us"
            >
              آشنایی با زوپینی
            </Link>
          </div>

          <ul>
            {qualityItems.map(item => (
              <li key={item.title}>
                <b>{item.title}</b>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* مراحل */}
      <section className="b2b__section b2b__section--soft">
        <div className="b2b__wrap">
          <h2>از درخواست تا پیشنهاد همکاری</h2>

          <div className="b2b__steps">
            {steps.map(step => (
              <div className="b2b__step" key={step.num}>
                <span>{step.num}</span>
                <b>{step.title}</b>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* فرم درخواست */}
      <section className="b2b__section" id="request">
        <div className="b2b__wrap b2b__request-grid">
          <div>
            <span className="b2b__eyebrow">شروع همکاری</span>
            <h2>برای سازمان شما چه کاری می‌توانیم انجام دهیم؟</h2>
            <p className="b2b__intro">
              اطلاعات اولیه را وارد کنید. تعداد و بودجهٔ تقریبی هم برای شروع
              کافی است؛ جزئیات سفارش در مشاوره بررسی می‌شود.
            </p>

            <div className="b2b__contact-card">
              <b>ترجیح می‌دهید مستقیم در تماس باشید؟</b>
              <a href="tel:02166745521">
                تلفن: <span dir="ltr">021-66745521</span>
              </a>
              <a href="tel:09352715016">
                همراه: <span dir="ltr">09352715016</span>
              </a>
              <a href="mailto:info@zoppinico.com" dir="ltr">
                info@zoppinico.com
              </a>
            </div>
          </div>

          <B2bSaleRequestForm />
        </div>
      </section>

      {/* پرسش‌های متداول */}
      <section className="b2b__section b2b__section--soft">
        <div className="b2b__wrap b2b__faq">
          <h2>پرسش‌های متداول</h2>

          {faqs.map(faq => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="b2b__wrap b2b__final-cta-wrap">
        <div className="b2b__final-cta">
          <p>نیاز سازمان شما را به یک پیشنهاد مشخص تبدیل کنیم.</p>
          <a className="b2b__button" href="#request">
            درخواست مشاوره و قیمت
          </a>
        </div>
      </div>
    </main>
  );
}
