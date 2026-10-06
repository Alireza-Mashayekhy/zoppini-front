'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BlogBlockItem } from '@/services/features/blog/types';

/**
 * سوالات متداول داخل مقاله (ساخته‌شده در پنل ادمین).
 *
 * پاسخ‌ها متن ساده‌اند (نه HTML) تا امکان تزریق کد نباشد.
 */
export default function BlogFaq({
  items,
  title = 'سوالات متداول',
}: {
  items: BlogBlockItem[];
  title?: string | null;
}) {
  const faqs = items.filter(item => item.question && item.answer);

  if (faqs.length === 0) return null;

  return (
    <section className="my-8">
      {title && (
        <h2 className="mb-4 text-xl font-light text-[#1A1A1A] md:text-2xl">
          {title}
        </h2>
      )}

      <Accordion type="single" collapsible className="space-y-3" dir="rtl">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={faq.question}
            value={`faq-${index}`}
            className="rounded-2xl border border-gray-100 border-r-4 border-r-[#D4A373] bg-white px-5 shadow-sm transition-shadow hover:shadow-md md:px-7"
          >
            <AccordionTrigger className="py-5 text-right text-base font-medium text-[#1A1A1A] hover:no-underline md:text-lg">
              {faq.question}
            </AccordionTrigger>

            <AccordionContent className="whitespace-pre-line pb-5 text-sm leading-7 text-gray-600 md:text-base">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
