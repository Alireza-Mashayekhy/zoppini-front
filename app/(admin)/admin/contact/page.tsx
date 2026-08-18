import { Metadata } from 'next';

import ContactList from '@/components/admin/contact/list';

export const metadata: Metadata = {
  title: 'پیام‌های تماس | مدیریت',
  robots: {
    index: false,
  },
};

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">تماس با ما</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          پیام‌های ارسال‌شده توسط کاربران
        </p>
      </div>

      <ContactList />
    </div>
  );
}
