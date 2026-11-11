'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
  /** عنوان بخشی که خطا داده (برای نمایش در کارت خطا) */
  title?: string;
  /** پیام خطا؛ اگر داده نشود متن پیش‌فرض نمایش داده می‌شود */
  message?: string;
  /**
   * کلید تغییر؛ با تغییر آن boundary ریست می‌شود
   * (مثلاً با عوض‌شدن داده‌های دریافتی از سرور).
   */
  resetKey?: unknown;
};

type State = {
  hasError: boolean;
  resetKey?: unknown;
};

/**
 * مرز خطای محلی بخش‌های صفحه.
 *
 * صفحه‌ی `/dashboard/club` از چند بخش مستقل تشکیل شده که هر کدام داده‌ی
 * خودشان را جدا می‌گیرند. اگر یکی از این بخش‌ها هنگام رندر خطا بدهد،
 * بدون یک Error Boundary کل درخت React (و در نتیجه کل صفحه) از کار
 * می‌افتد و کاربر فقط پیام خطای کلاینت را می‌بیند. این کامپوننت خطا را
 * در همان بخش نگه می‌دارد و بقیه‌ی صفحه سالم می‌ماند.
 */
export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, resetKey: props.resetKey };
    }

    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // خطا در کنسول می‌ماند تا برای تیم فنی قابل ردیابی باشد،
    // ولی تجربه‌ی کاربر به هم نمی‌ریزد.
    console.error(
      `[club] render error in section "${this.props.title ?? '-'}"`,
      error,
      errorInfo?.componentStack,
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-8 text-center">
        <AlertTriangle className="h-9 w-9 text-amber-500" strokeWidth={1.2} />
        <p className="text-sm font-medium text-gray-700">
          {this.props.title
            ? `نمایش «${this.props.title}» با خطا مواجه شد`
            : 'نمایش این بخش با خطا مواجه شد'}
        </p>
        <p className="text-xs text-gray-500">
          {this.props.message ??
            'سایر بخش‌های صفحه در دسترس هستند. می‌توانید دوباره تلاش کنید.'}
        </p>
        <Button variant="outline" size="sm" onClick={this.handleRetry}>
          <RefreshCcw className="h-3.5 w-3.5" />
          تلاش مجدد
        </Button>
      </div>
    );
  }
}
