'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import FormProvider from '@/components/form/form-provider';
import RHFInput from '@/components/form/rhf-input';
import RHFTextArea from '@/components/form/rhf-textarea';
import { Button } from '@/components/ui/button';
import { useCreateContact } from '@/services/features/contact/hooks';
import { CreateContactDto } from '@/services/features/contact/types';

import DirectionsMenu from '../information/direction';

const BranchesMap = dynamic(
  () => import('@/components/pages/branches/branches-map'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl" />
    ),
  },
);

const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد')
    .max(255, 'نام بیش از حد طولانی است'),

  email: z
    .string()
    .email('ایمیل وارد شده معتبر نیست')
    .max(255, 'ایمیل بیش از حد طولانی است')
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .min(11, 'شماره تماس معتبر نیست')
    .max(11, 'شماره تماس معتبر نیست'),

  message: z
    .string()
    .min(10, 'پیام باید حداقل ۱۰ کاراکتر باشد')
    .max(5000, 'پیام بیش از حد طولانی است'),
});

interface locationsPropes {
  name: string;
  address: string;
  phone?: string | null;
  tel?: string | null;
  email?: string | null;
  coords: [number, number];
}
const items: locationsPropes[] = [
  {
    name: 'دفتر مرکزی (تهران)',
    address:
      'تهران، خیابان فردوسی، خیابان منوچهری، خیابان ارباب جمشید پلاک ۱۷، واحد ۲۹، طبقه ۲',
    phone: '۰۹۱۹۴۱۳۱۳۱۶',
    tel: '۰۲۱-۶۶۷۴۵۵۲۱',
    email: 'zoppini.collection1@gmail.com',
    coords: [35.69776219399375, 51.42114981432789],
  },
  {
    name: 'شعبه کرمان',
    address: 'کرمان، خیابان هزار و یک شب، نبش کوچه ۶',
    phone: null,
    tel: '۰۳۴-۳۲۴۸۷۸۷۶',
    email: null,
    coords: [30.286455507638387, 57.03517457530013],
  },
  {
    name: 'شعبه تهران',
    address:
      'تهران , پاسداران، میدان هروی، خیابان موسوی شرقی، پلاک۱۴ مرکز خرید هدیش مال, طبقه سوم, پلاک 343',
    phone: null,
    tel: '021-26879141',
    email: null,
    coords: [35.7654305, 51.4807367],
  },
];

export default function ContactContent() {
  const createContact = useCreateContact();

  const methods = useForm<CreateContactDto>({
    resolver: zodResolver(contactSchema),

    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data: CreateContactDto) => {
    try {
      await createContact.mutateAsync(data);

      toast.success(
        'پیام شما با موفقیت ارسال شد. پشتیبانی زوپینی به زودی با شما ارتباط میگیرند.',
      );
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'ارسال پیام با خطا مواجه شد.',
      );
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#faf9f7] pt-[52px] pb-16">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* ================================================= */}
        {/* Header */}
        {/* ================================================= */}

        <header className="pt-8 pb-10 md:pt-12 md:pb-14">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D4A373]" />

              <span className="text-xs tracking-[0.2em] text-[#D4A373]">
                CONTACT US
              </span>
            </div>

            <h1 className="text-3xl font-light tracking-wide text-[#1A1A1A] md:text-5xl">
              تماس با <span className="font-medium text-[#D4A373]">زوپینی</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-500 md:text-base">
              سوالی دارید یا نیاز به راهنمایی بیشتری دارید؟ پیام خود را برای ما
              ارسال کنید. تیم زوپینی در اولین فرصت پاسخگوی شما خواهد بود.
            </p>
          </div>
        </header>

        {/* ================================================= */}
        {/* Contact Info */}
        {/* ================================================= */}

        <section className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {items?.map(item => (
            <ContactInfoCard
              key={item.name}
              icon={<MapPin />}
              title={item.name}
            >
              <p className="leading-7">{item.address}</p>

              <ContactItem icon={<Phone />} href="tel:02166745521">
                {item.tel}
              </ContactItem>

              {item?.phone && (
                <ContactItem icon={<Phone />} href="tel:09352715016">
                  {item.phone}
                </ContactItem>
              )}

              {item?.email && (
                <ContactItem icon={<Mail />} href={`mailto:${item?.email}`}>
                  {item?.email}
                </ContactItem>
              )}
            </ContactInfoCard>
          ))}
        </section>

        {/* ================================================= */}
        {/* Form + Intro */}
        {/* ================================================= */}

        <section className="mb-12 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_15px_50px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Side */}
            <div className="relative overflow-hidden bg-[#1A1A1A] p-7 text-white md:p-10 lg:p-12">
              <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#D4A373]/10" />

              <div className="relative z-10">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A373]/15">
                  <MessageCircle className="h-5 w-5 text-[#D4A373]" />
                </div>

                <h2 className="text-2xl font-light md:text-3xl">
                  با ما در ارتباط باشید
                </h2>

                <p className="mt-4 text-sm leading-7 text-gray-300">
                  اگر سوالی درباره محصولات، سفارش، ارسال یا خدمات زوپینی دارید،
                  فرم مقابل را تکمیل کنید. پیام شما مستقیماً برای تیم ما ارسال
                  می‌شود.
                </p>

                <div className="mt-8 space-y-4">
                  <ContactFeature text="پاسخگویی توسط تیم زوپینی" />
                  <ContactFeature text="پیگیری درخواست شما" />
                  <ContactFeature text="پشتیبانی در سریع‌ترین زمان ممکن" />
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 md:p-10 lg:p-12">
              <div className="mb-7">
                <h2 className="text-2xl font-medium text-[#1A1A1A]">
                  ارسال پیام
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  اطلاعات خود را وارد کنید تا با شما تماس بگیریم.
                </p>
              </div>

              <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-5">
                  {/* Name + Phone */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <RHFInput
                      label="نام و نام خانوادگی"
                      isRequired
                      placeholder="نام خود را وارد کنید"
                      name="name"
                    />

                    <RHFInput
                      label="شماره تماس"
                      isRequired
                      placeholder="09123456789"
                      name="phone"
                      dir="ltr"
                    />
                  </div>

                  <RHFInput
                    label="ایمیل"
                    type="email"
                    placeholder="example@email.com"
                    name="email"
                    dir="ltr"
                  />

                  <RHFTextArea
                    label="پیام شما"
                    isRequired
                    placeholder="پیام خود را برای ما بنویسید..."
                    name="message"
                  />

                  {/* Submit */}
                  <Button
                    type="submit"
                    variant="dark"
                    loading={isSubmitting}
                    className="w-full rounded-xl"
                  >
                    <Send className="ml-2 h-4 w-4" />
                    ارسال پیام
                  </Button>
                </div>
              </FormProvider>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* Maps */}
        {/* ================================================= */}

        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-light text-[#1A1A1A]">
              ما را پیدا کنید
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              می‌توانید از طریق نقشه، موقعیت شعب زوپینی را مشاهده کنید.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {items?.map(item => (
              <div key={item?.name} className="space-y-2">
                <MapCard location={item} />
                <DirectionsMenu lat={item?.coords[0]} lng={item?.coords[1]} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================================================= */
/* Contact Info Card */
/* ================================================= */

function ContactInfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#D4A373]/10 text-[#D4A373]">
          {icon}
        </div>

        <h2 className="text-lg font-medium text-[#1A1A1A]">{title}</h2>
      </div>

      <div className="space-y-3 text-sm text-gray-600 md:text-base">
        {children}
      </div>
    </div>
  );
}

/* ================================================= */
/* Contact Item */
/* ================================================= */

function ContactItem({
  icon,
  children,
  href,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-2 transition-colors hover:text-[#D4A373]">
      <span className="text-[#D4A373]">{icon}</span>
      <span dir="ltr">{children}</span>
    </div>
  );

  if (!href) {
    return content;
  }

  return <a href={href}>{content}</a>;
}

/* ================================================= */
/* Feature */
/* ================================================= */

function ContactFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-300">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4A373]" />
      <span>{text}</span>
    </div>
  );
}

/* ================================================= */
/* Map Card */
/* ================================================= */

function MapCard({ location }: { location: locationsPropes }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#D4A373]" />

          <h3 className="text-sm font-medium text-gray-800">
            {location?.name}
          </h3>
        </div>
      </div>

      <div className="h-[350px] w-full overflow-hidden bg-gray-100 md:h-[420px] relative z-0">
        <BranchesMap location={location} />
      </div>
    </div>
  );
}
