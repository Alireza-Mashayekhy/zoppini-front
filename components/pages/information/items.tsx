'use client';

import { Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const socialLinks = [
  {
    title: 'WhatsApp',
    href: 'https://wa.me/09352715016',
    icon: MessageCircle,
    className:
      'border-[#25D366]/30 bg-[#25D366]/10 text-[#128C7E] hover:border-[#25D366]/50 hover:bg-[#25D366]/20',
  },
  {
    title: 'Telegram',
    href: 'https://t.me/zoppinii',
    icon: Send,
    className:
      'border-[#3390EC]/30 bg-[#3390EC]/10 text-[#008CC2] hover:border-[#3390EC]/50 hover:bg-[#3390EC]/20',
  },
  {
    title: 'Bale',
    href: 'https://ble.ir/zoppini_support',
    icon: Send,
    className:
      'border-[#00B894]/30 bg-[#00B894]/10 text-[#008CC2] hover:border-[#00B894]/50 hover:bg-[#00B894]/20',
  },
];

const socialNetworks = [
  {
    title: 'Instagram',
    href: 'https://www.instagram.com/zoppini.official',
    icon: MessageCircle,
    className:
      'border-[#E1306C]/30 bg-[#E1306C]/10 text-[#C13584] hover:border-[#E1306C]/50 hover:bg-[#E1306C]/20',
  },
  {
    title: 'Aparat',
    href: 'https://www.aparat.com/zoppini.official',
    icon: MessageCircle,
    className:
      'border-[#ED145B]/30 bg-[#ED145B]/10 text-[#D10E4F] hover:border-[#ED145B]/50 hover:bg-[#ED145B]/20',
  },
  {
    title: 'Pinterest',
    href: 'https://pin.it/7xLy25Gex',
    icon: MapPin,
    className:
      'border-[#E60023]/30 bg-[#E60023]/10 text-[#C4001D] hover:border-[#E60023]/50 hover:bg-[#E60023]/20',
  },
];

const contactItems = [
  {
    label: 'شماره تماس',
    value: '۰۹۳۵۲۷۱۵۰۱۶',
    href: 'tel:09352715016',
    icon: Phone,
  },
  {
    label: 'دفتر مرکزی',
    value: '۰۲۱۶۷۴۲۵۵۲۰',
    href: 'tel:02167425520',
    icon: Phone,
  },
  {
    label: 'پیامک',
    value: '۰۹۳۵۲۷۱۵۰۱۶',
    href: 'sms:09352715016',
    icon: MessageCircle,
  },
  {
    label: 'ایمیل',
    value: 'zoppini.collection1@gmail.com',
    href: 'mailto:zoppini.collection1@gmail.com',
    icon: Mail,
  },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-center text-lg font-bold text-foreground">
      {children}
    </h3>
  );
}

function SocialButton({
  title,
  href,
  className,
}: {
  title: string;
  href: string;
  className: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className={`h-12 w-full justify-center gap-2 rounded-full border transition-all hover:-translate-y-0.5 hover:shadow-sm ${className}`}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <span>{title}</span>
      </a>
    </Button>
  );
}

export default function Items() {
  return (
    <section
      dir="rtl"
      className="w-full bg-background px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-4xl">
        <Card className="overflow-hidden rounded-[24px] border shadow-sm">
          <CardContent className="p-5 sm:p-7 lg:p-8">
            {/* ارتباط مستقیم */}
            <section>
              <SectionTitle>ارتباط مستقیم</SectionTitle>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {socialLinks.map(item => (
                  <SocialButton key={item.title} {...item} />
                ))}
              </div>
            </section>

            <Separator className="my-8" />

            {/* شبکه های اجتماعی */}
            <section>
              <SectionTitle>شبکه‌های اجتماعی</SectionTitle>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {socialNetworks.map(item => (
                  <SocialButton key={item.title} {...item} />
                ))}
              </div>
            </section>

            <Separator className="my-8" />

            {/* راه های ارتباطی */}
            <section>
              <SectionTitle>راه‌های ارتباطی</SectionTitle>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {contactItems.map(item => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="group flex min-h-16 items-center justify-between rounded-[16px] border bg-muted/30 px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-sm"
                    >
                      {/* عنوان + آیکون */}
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-background text-muted-foreground shadow-sm">
                          <Icon className="size-4 text-[#C96115]" />
                        </div>

                        <span className="text-sm font-medium text-[#C96115]">
                          {item.label}
                        </span>
                      </div>

                      {/* مقدار */}
                      <span
                        dir="ltr"
                        className="max-w-[65%] truncate text-left text-sm font-semibold text-[#C96115] transition-colors group-hover:text-primary"
                      >
                        {item.value}
                      </span>
                    </a>
                  );
                })}
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
