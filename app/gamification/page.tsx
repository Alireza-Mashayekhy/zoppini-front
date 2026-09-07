'use client';

import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ProfileId = 'A' | 'B' | 'C' | 'D';

type Profile = {
  id: ProfileId;
  key: string;
  titleEn: string;
  titleFa: string;
  descriptions: string[];
};

type Question = {
  id: number;
  text: string;
  options: string[];
};

type LeadData = {
  fullName: string;
  phone: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  answers: (number | null)[];
  purchaseMotivation: string | null;
  scores: Record<ProfileId, number>;
  result: Profile;
  submittedAt: string;
};

const PROFILES: Record<ProfileId, Profile> = {
  A: {
    id: 'A',
    key: 'classic-gentleman',
    titleEn: 'CLASSIC GENTLEMAN',
    titleFa: 'کلاسیک جنتلمن',
    descriptions: [
      'شما به استایل کلاسیک و همیشه شیک علاقه دارید.',
      'برای شما تناسب، ظرافت و ظاهر رسمی اهمیت زیادی دارد.',
      'انتخاب‌های شما نشان می‌دهد به استایلی اعتماد دارید که هیچ‌وقت از مد نمی‌افتد.',
    ],
  },

  B: {
    id: 'B',
    key: 'modern-classic',
    titleEn: 'MODERN CLASSIC',
    titleFa: 'مدرن کلاسیک',
    descriptions: [
      'شما ترکیبی از ظرافت کلاسیک و سادگی مدرن را ترجیح می‌دهید.',
      'برای شما لباس باید شیک، دقیق و قابل استفاده در موقعیت‌های مختلف باشد.',
    ],
  },

  C: {
    id: 'C',
    key: 'smart-casual',
    titleEn: 'SMART CASUAL',
    titleFa: 'اسمارت کژوال',
    descriptions: [
      'شما بین شیک بودن و راحتی تعادل برقرار می‌کنید.',
      'برای شما لباس باید کاربردی، خوش‌پوش و مناسب موقعیت‌های مختلف باشد؛ بدون اینکه بیش از حد رسمی به نظر برسد.',
    ],
  },

  D: {
    id: 'D',
    key: 'urban-casual',
    titleEn: 'URBAN CASUAL',
    titleFa: 'اربان کژوال',
    descriptions: [
      'شما استایلی راحت، مدرن و شخصی را ترجیح می‌دهید.',
      'برای شما لباس بخشی از شخصیت شماست؛ راحتی مهم است، اما همیشه با چاشنی استایل و تفاوت.',
    ],
  },
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'اگر قرار باشه برای یک موقعیت مهم لباس بپوشی، کدوم را انتخاب می‌کنی؟',
    options: [
      'کت‌وشلوار کلاسیک',
      'کت‌وشلوار کژوال',
      'کت تک با شلوار کژوال',
      'پیراهن یا پولوشرت با شلوار کژوال',
    ],
  },

  {
    id: 2,
    text: 'وقتی لباس می‌خرین، کدوم مورد براتون مهم‌تر هست؟',
    options: [
      'کیفیت متریال',
      'الگو و برش دوخت',
      'متمایز بودن',
      'تناسب با استایل شخصی',
    ],
  },

  {
    id: 3,
    text: 'بیشترین لباس مورد استفاده شما کدام است؟',
    options: [
      'کت و شلوار رسمی',
      'کت‌وشلوار کژوال',
      'کت تک، پیراهن و شلوار کژوال',
      'تیشرت، پولوشرت، جین و لباس‌های راحت',
    ],
  },

  {
    id: 4,
    text: 'کدام جمله بیشتر شبیه شماست؟',
    options: [
      'من به استایل کلاسیک اعتماد دارم.',
      'سادگی و راحتی برای من مهم است.',
      'من استایل ترند را دنبال می‌کنم.',
      'دوست دارم استایلم امضای خودم را داشته باشه.',
    ],
  },
];

const OPTION_TO_PROFILE: ProfileId[] = ['A', 'B', 'C', 'D'];

const Q4_SCORING: {
  profile: ProfileId;
  points: number;
}[][] = [
  [{ profile: 'A', points: 2 }],
  [{ profile: 'C', points: 2 }],
  [
    { profile: 'D', points: 1 },
    { profile: 'C', points: 1 },
  ],
  [{ profile: 'D', points: 2 }],
];

const TIE_BREAKER_QUESTIONS = [0, 2, 3];

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const currentYear = 1405;

const toPersianNum = (input: string | number) => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  return String(input).replace(/\d/g, digit => {
    return persianDigits[Number(digit)];
  });
};

const initialAnswers = () =>
  new Array<number | null>(QUESTIONS.length).fill(null);

export default function StyleQuizPage() {
  const [step, setStep] = useState<'welcome' | 'quiz' | 'lead' | 'result'>(
    'welcome',
  );

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answers, setAnswers] = useState<(number | null)[]>(initialAnswers);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    birth?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [leadData, setLeadData] = useState<LeadData | null>(null);

  const question = QUESTIONS[currentQuestion];

  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  const calculateScores = (): Record<ProfileId, number> => {
    const scores: Record<ProfileId, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
    };

    // Q1 × 3
    if (answers[0] !== null) {
      const profile = OPTION_TO_PROFILE[answers[0]];
      scores[profile] += 3;
    }

    // Q3 × 3
    if (answers[2] !== null) {
      const profile = OPTION_TO_PROFILE[answers[2]];
      scores[profile] += 3;
    }

    // Q4 custom scoring × 2
    if (answers[3] !== null) {
      Q4_SCORING[answers[3]].forEach(({ profile, points }) => {
        scores[profile] += points;
      });
    }

    return scores;
  };

  const calculateResult = () => {
    const scores = calculateScores();

    const maxScore = Math.max(...Object.values(scores));

    const winners = (Object.keys(scores) as ProfileId[]).filter(
      profile => scores[profile] === maxScore,
    );

    let profileKey: ProfileId;

    if (winners.length === 1) {
      profileKey = winners[0];
    } else {
      profileKey = 'A';

      for (const questionIndex of TIE_BREAKER_QUESTIONS) {
        if (answers[questionIndex] !== null) {
          profileKey = OPTION_TO_PROFILE[answers[questionIndex]];
          break;
        }
      }
    }

    return {
      profile: PROFILES[profileKey],
      scores,
    };
  };

  const startQuiz = () => {
    setCurrentQuestion(0);
    setAnswers(initialAnswers());
    setStep('quiz');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const selectOption = (index: number) => {
    setAnswers(previous => {
      const next = [...previous];
      next[currentQuestion] = index;
      return next;
    });
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion === 0) return;

    setCurrentQuestion(previous => previous - 1);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const goToNextQuestion = () => {
    if (answers[currentQuestion] === null) return;

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(previous => previous + 1);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      return;
    }

    setStep('lead');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const validateLeadForm = () => {
    const nextErrors: typeof errors = {};

    if (!fullName.trim() || fullName.trim().length < 3) {
      nextErrors.name = 'لطفاً نام و نام خانوادگی را وارد کنید';
    }

    const phoneDigits = phone.replace(/\D/g, '');

    if (
      !phoneDigits ||
      phoneDigits.length < 10 ||
      !phoneDigits.startsWith('09')
    ) {
      nextErrors.phone = 'شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)';
    }

    if (!birthDay || !birthMonth || !birthYear) {
      nextErrors.birth = 'تاریخ تولد را کامل انتخاب کنید';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const saveLeadLocally = (data: LeadData) => {
    try {
      const existing = JSON.parse(
        localStorage.getItem('zoppini_quiz_leads') || '[]',
      );

      existing.push(data);

      localStorage.setItem('zoppini_quiz_leads', JSON.stringify(existing));
    } catch {
      // localStorage may be unavailable
    }
  };

  const registerCustomer = async (data: LeadData) => {
    const response = await fetch('/api/register-customer.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'خطا در ثبت اطلاعات در باشگاه مشتریان');
    }

    return result;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateLeadForm()) return;

    setIsSubmitting(true);
    setErrors({});

    const { profile, scores } = calculateResult();

    const data: LeadData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      birthDay,
      birthMonth,
      birthYear,
      answers: [...answers],
      purchaseMotivation:
        answers[1] !== null ? QUESTIONS[1].options[answers[1]] : null,
      scores,
      result: profile,
      submittedAt: new Date().toISOString(),
    };

    try {
      await registerCustomer(data);

      saveLeadLocally(data);

      setLeadData(data);
      setStep('result');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'خطا در ثبت اطلاعات. لطفاً دوباره تلاش کنید.';

      setErrors({
        phone: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir="rtl"
      lang="fa"
      className="min-h-dvh w-full overflow-x-hidden bg-[#0a0a0b] text-[#f5f3ef] antialiased"
      style={{
        fontFamily: 'var(--font-vazirmatn), Vazirmatn, Tahoma, sans-serif',
      }}
    >
      <div className="relative isolate flex min-h-dvh flex-col bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,169,110,0.08),transparent),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(201,169,110,0.04),transparent)]">
        {/* Header */}
        <header className="flex shrink-0 flex-col items-center justify-center border-b border-white/[0.08] px-4 pb-6 pt-[max(1.75rem,env(safe-area-inset-top))] text-center">
          <img
            src="/logo/gray.png"
            alt="ZOPPINI"
            width={220}
            height={60}
            className="mb-5 block h-auto w-[clamp(140px,40vw,220px)] object-contain"
          />

          <div className="text-[0.6rem] tracking-[clamp(0.25em,2vw,0.5em)] text-[#9a9690]">
            STYLE PROFILE
          </div>
        </header>

        {/* Main */}
        <main className="flex flex-1 items-start justify-center px-3.5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5 md:items-center md:px-5 md:py-8">
          <div className="w-full max-w-[560px]">
            {/* ==================== WELCOME ==================== */}
            {step === 'welcome' && (
              <section className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="text-center">
                  <div className="mb-5 inline-block max-w-full rounded-full border border-[#c9a96e]/40 px-3.5 py-1.5 text-[clamp(0.6rem,2.5vw,0.7rem)] font-semibold tracking-[0.12em] text-[#c9a96e]">
                    ZOPPINI STYLE QUIZ
                  </div>

                  <h1 className="mb-4 text-[clamp(1.75rem,5vw,2.25rem)] font-bold leading-[1.3]">
                    استایل شما کدام است؟
                  </h1>

                  <p className="mx-auto mb-3 max-w-[420px] px-1 text-[clamp(0.9rem,3.5vw,1rem)] text-[#9a9690]">
                    به چند سؤال کوتاه جواب بدین و ببینید استایل شما کدام است.
                  </p>

                  <p className="mb-8 px-1 text-sm text-[#a88b4a]">
                    در کمتر از یک دقیقه استایل شخصی خودت را پیدا کن
                  </p>

                  <Button
                    type="button"
                    onClick={startQuiz}
                    className={cn(
                      'min-h-12 rounded-lg px-6 text-base font-semibold',
                      'bg-gradient-to-br from-[#c9a96e] to-[#a88b4a]',
                      'text-[#0a0a0b]',
                      'shadow-[0_4px_20px_rgba(201,169,110,0.3)]',
                      'transition-all duration-300',
                      'hover:-translate-y-0.5 hover:bg-gradient-to-br',
                      'hover:from-[#e0c992] hover:to-[#a88b4a]',
                      'hover:shadow-[0_6px_28px_rgba(201,169,110,0.45)]',
                      'max-w-[320px] w-full',
                    )}
                  >
                    شروع تست استایل
                  </Button>
                </div>
              </section>
            )}

            {/* ==================== QUIZ ==================== */}
            {step === 'quiz' && (
              <section className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                {/* Progress */}
                <div className="mb-6 h-[3px] overflow-hidden rounded-full bg-[#1a1a1e]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#a88b4a] to-[#e0c992] transition-[width] duration-500 ease-out"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                {/* Counter */}
                <div className="mb-5">
                  <span className="text-[0.8rem] font-semibold tracking-[0.05em] text-[#c9a96e]">
                    سؤال {toPersianNum(currentQuestion + 1)} از{' '}
                    {toPersianNum(QUESTIONS.length)}
                  </span>
                </div>

                {/* Question */}
                <h2 className="mb-7 text-[clamp(1.1rem,3.5vw,1.35rem)] font-semibold leading-[1.5]">
                  {question.text}
                </h2>

                {/* Options */}
                <div
                  role="radiogroup"
                  aria-label={question.text}
                  className="mb-6 flex flex-col gap-3"
                >
                  {question.options.map((option, index) => {
                    const selected = answers[currentQuestion] === index;

                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => selectOption(index)}
                        className={cn(
                          'flex min-h-12 w-full items-start gap-3 rounded-xl border p-3.5 text-right',
                          'text-[clamp(0.875rem,3.5vw,0.95rem)] leading-[1.6]',
                          'transition-all duration-300',
                          'touch-manipulation',
                          selected
                            ? [
                                'border-[#c9a96e]',
                                'bg-[#c9a96e]/[0.08]',
                                'shadow-[0_0_0_1px_#c9a96e]',
                              ]
                            : [
                                'border-white/[0.08]',
                                'bg-[#1a1a1e]',
                                'hover:border-[#c9a96e]/40',
                                'hover:bg-[#141416]',
                              ],
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.8rem] font-semibold transition-all duration-300',
                            selected
                              ? 'border-[#c9a96e] bg-[#c9a96e] text-[#0a0a0b]'
                              : 'border-white/[0.08] bg-[#0a0a0b] text-[#9a9690]',
                          )}
                        >
                          {toPersianNum(index + 1)}
                        </span>

                        <span className="min-w-0 flex-1 break-words">
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex flex-col-reverse gap-3 min-[481px]:flex-row min-[481px]:justify-between min-[481px]:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentQuestion === 0}
                    onClick={goToPreviousQuestion}
                    className="min-h-12 border-white/[0.08] bg-transparent text-[#9a9690] hover:border-[#c9a96e]/40 hover:bg-transparent hover:text-[#f5f3ef]"
                  >
                    سؤال قبل
                  </Button>

                  <Button
                    type="button"
                    disabled={answers[currentQuestion] === null}
                    onClick={goToNextQuestion}
                    className={cn(
                      'min-h-12',
                      'bg-gradient-to-br from-[#c9a96e] to-[#a88b4a]',
                      'font-semibold text-[#0a0a0b]',
                      'shadow-[0_4px_20px_rgba(201,169,110,0.3)]',
                      'hover:bg-gradient-to-br hover:from-[#e0c992] hover:to-[#a88b4a]',
                      'disabled:cursor-not-allowed disabled:opacity-40',
                    )}
                  >
                    {currentQuestion === QUESTIONS.length - 1
                      ? 'ادامه'
                      : 'سؤال بعد'}
                  </Button>
                </div>
              </section>
            )}

            {/* ==================== LEAD ==================== */}
            {step === 'lead' && (
              <section className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="text-center">
                  <div className="mb-4 text-3xl text-[#c9a96e]">✦</div>

                  <h2 className="mb-2 text-[clamp(1.35rem,5vw,1.75rem)] font-bold">
                    تقریباً تمام شد
                  </h2>

                  <p className="mb-3 text-[clamp(0.95rem,3.5vw,1.1rem)] text-[#e0c992]">
                    نتیجه استایل شما آماده است.
                  </p>

                  <p className="mb-6 px-1 text-[clamp(0.85rem,3vw,0.9rem)] text-[#9a9690]">
                    برای دریافت نتیجه و فعال‌سازی اعتبار خرید:
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="text-right">
                  {/* Name */}
                  <div className="mb-5">
                    <label
                      htmlFor="full-name"
                      className="mb-2 block text-[0.85rem] font-medium text-[#9a9690]"
                    >
                      نام و نام خانوادگی
                    </label>

                    <Input
                      id="full-name"
                      name="fullName"
                      type="text"
                      placeholder="مثال: علی محمدی"
                      autoComplete="name"
                      value={fullName}
                      onChange={event => setFullName(event.target.value)}
                      className={cn(
                        'min-h-12 rounded-lg border-white/[0.08]',
                        'bg-[#1a1a1e]',
                        'text-base text-[#f5f3ef]',
                        'placeholder:text-[#9a9690]/60',
                        'focus-visible:border-[#c9a96e]',
                        'focus-visible:ring-[#c9a96e]/15',
                      )}
                    />

                    <span className="mt-1 block min-h-[1.1rem] text-xs text-red-400">
                      {errors.name}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="mb-5">
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-[0.85rem] font-medium text-[#9a9690]"
                    >
                      شماره موبایل
                    </label>

                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={phone}
                      onChange={event => setPhone(event.target.value)}
                      className={cn(
                        'min-h-12 rounded-lg border-white/[0.08]',
                        'bg-[#1a1a1e]',
                        'text-base text-[#f5f3ef]',
                        'placeholder:text-[#9a9690]/60',
                        'focus-visible:border-[#c9a96e]',
                        'focus-visible:ring-[#c9a96e]/15',
                      )}
                    />

                    <span className="mt-1 block min-h-[1.1rem] text-xs text-red-400">
                      {errors.phone}
                    </span>
                  </div>

                  {/* Birth date */}
                  <div className="mb-5">
                    <label className="mb-2 block text-[0.85rem] font-medium text-[#9a9690]">
                      تاریخ تولد
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Day */}
                      <Select value={birthDay} onValueChange={setBirthDay}>
                        <SelectTrigger className="min-h-12 border-white/[0.08] bg-[#1a1a1e] text-center text-[#f5f3ef] focus:ring-[#c9a96e]/20">
                          <SelectValue placeholder="روز" />
                        </SelectTrigger>

                        <SelectContent>
                          {Array.from(
                            { length: 31 },
                            (_, index) => index + 1,
                          ).map(day => (
                            <SelectItem key={day} value={String(day)}>
                              {toPersianNum(day)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Month */}
                      <Select value={birthMonth} onValueChange={setBirthMonth}>
                        <SelectTrigger className="min-h-12 border-white/[0.08] bg-[#1a1a1e] text-center text-[#f5f3ef] focus:ring-[#c9a96e]/20">
                          <SelectValue placeholder="ماه" />
                        </SelectTrigger>

                        <SelectContent>
                          {PERSIAN_MONTHS.map((month, index) => (
                            <SelectItem key={month} value={String(index + 1)}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Year */}
                      <Select value={birthYear} onValueChange={setBirthYear}>
                        <SelectTrigger className="min-h-12 border-white/[0.08] bg-[#1a1a1e] text-center text-[#f5f3ef] focus:ring-[#c9a96e]/20">
                          <SelectValue placeholder="سال" />
                        </SelectTrigger>

                        <SelectContent>
                          {Array.from(
                            {
                              length: currentYear - 15 - (currentYear - 80) + 1,
                            },
                            (_, index) => currentYear - 80 + index,
                          ).map(year => (
                            <SelectItem key={year} value={String(year)}>
                              {toPersianNum(year)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <span className="mt-1 block min-h-[1.1rem] text-xs text-red-400">
                      {errors.birth}
                    </span>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'mt-2 min-h-12 w-full rounded-lg',
                      'bg-gradient-to-br from-[#c9a96e] to-[#a88b4a]',
                      'font-semibold text-[#0a0a0b]',
                      'shadow-[0_4px_20px_rgba(201,169,110,0.3)]',
                      'hover:bg-gradient-to-br hover:from-[#e0c992] hover:to-[#a88b4a]',
                      'hover:shadow-[0_6px_28px_rgba(201,169,110,0.45)]',
                      'disabled:cursor-not-allowed disabled:opacity-40',
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-[#0a0a0b]" />
                        <span>در حال ثبت...</span>
                      </>
                    ) : (
                      'نتیجه استایل من'
                    )}
                  </Button>
                </form>
              </section>
            )}

            {/* ==================== RESULT ==================== */}
            {step === 'result' && leadData && (
              <section className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="text-center">
                  <div className="mb-3 text-[0.7rem] font-semibold tracking-[0.25em] text-[#c9a96e] max-[480px]:tracking-[0.1em]">
                    YOUR STYLE
                  </div>

                  <div className="mb-2 text-[0.85rem] tracking-[0.15em] text-[#9a9690] max-[480px]:tracking-[0.1em]">
                    نتیجه تست استایل شما
                  </div>

                  <h2 className="mb-6 text-[clamp(1.75rem,6vw,2.5rem)] font-bold leading-[1.2] tracking-[0.05em] text-[#e0c992]">
                    {leadData.result.titleEn}
                  </h2>

                  <div className="mx-auto mb-6 h-0.5 w-[60px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />

                  <div className="space-y-3">
                    {leadData.result.descriptions.map(description => (
                      <p
                        key={description}
                        className="mx-auto max-w-[440px] px-1 text-[clamp(0.9rem,3.5vw,1rem)] leading-[1.9] text-[#f5f3ef]"
                      >
                        {description}
                      </p>
                    ))}
                  </div>

                  {/* Credit */}
                  <div className="mt-6 rounded-[20px] border border-[#c9a96e]/40 bg-gradient-to-br from-[#c9a96e]/15 to-[#c9a96e]/5 p-4 sm:p-6">
                    <div className="mb-2 text-[clamp(1.15rem,5.5vw,1.5rem)] font-bold text-[#e0c992]">
                      {toPersianNum('2,000,000')} تومان
                    </div>

                    <p className="text-[clamp(0.8rem,3.2vw,0.9rem)] leading-[1.8] text-[#9a9690]">
                      اعتبار خرید شما فعال شد.
                      <br />
                      لطفاً کارت هدیه خود را از کانتر زوپینی در هدیش مال دریافت
                      کنید.
                      <br />
                      اعتبار شما تا پایان مهرماه در فروشگاه زوپینی قابل استفاده
                      می‌باشد.
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-8">
                    <a
                      href="https://www.zoppinico.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex min-h-12 w-full max-w-[320px]',
                        'items-center justify-center rounded-lg',
                        'bg-gradient-to-br from-[#c9a96e] to-[#a88b4a]',
                        'px-6 text-base font-semibold text-[#0a0a0b]',
                        'transition-all duration-300',
                        'hover:-translate-y-0.5',
                        'hover:shadow-[0_6px_28px_rgba(201,169,110,0.45)]',
                      )}
                    >
                      مشاهده فروشگاه زوپینی
                    </a>
                  </div>

                  {/* User */}
                  <p className="mt-6 px-1 text-[clamp(0.8rem,3vw,0.85rem)] text-[#9a9690]">
                    {leadData.fullName} عزیز، استایل شما{' '}
                    <strong className="font-bold text-[#e0c992]">
                      {leadData.result.titleFa}
                    </strong>{' '}
                    است.
                  </p>
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t border-white/[0.08] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
          <p className="text-xs tracking-[0.05em] text-[#9a9690]">
            © زوپینی — فروشگاه پوشاک مردانه
          </p>
        </footer>
      </div>
    </div>
  );
}
