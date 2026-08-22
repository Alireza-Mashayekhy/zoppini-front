export function CatalogCover({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-[calc(100vh-52px)] w-full items-center justify-center p-6 text-right"
    >
      <div
        className="
            relative
            aspect-[3/4]
            w-[min(82vw,460px)]
            overflow-hidden
            rounded-sm
            bg-[#191817]
            shadow-[0_30px_80px_rgba(0,0,0,0.25)]
            transition-transform
            duration-700
            group-hover:scale-[1.015]
          "
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/40" />

        <div
          dir="rtl"
          className="relative z-10 flex h-full flex-col justify-between p-8 text-white sm:p-10"
        >
          <div>
            <span className="text-[10px] tracking-[0.4em] text-white/50">
              ZOPPINI
            </span>

            <h1 className="mt-6 text-4xl font-light tracking-wide sm:text-5xl">
              کاتالوگ
            </h1>

            <p className="mt-2 text-sm text-white/50">پاییز / زمستان ۱۴۰۵</p>
          </div>

          <div>
            <div className="mb-5 h-px w-16 bg-white/30" />

            <p className="text-xs text-white/50">
              برای مشاهده کاتالوگ کلیک کنید
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

export function CatalogCoverPage() {
  return (
    <div
      dir="rtl"
      className="
          flex
          h-full
          w-full
          flex-col
          justify-between
          bg-[#191817]
          p-8
          text-white
          sm:p-10
        "
    >
      <div>
        <span className="text-[10px] tracking-[0.4em] text-white/40">
          ZOPPINI
        </span>

        <h1 className="mt-8 text-4xl font-light">COLLECTION</h1>

        <p className="mt-2 text-sm text-white/40">AUTUMN / WINTER 2026</p>
      </div>

      <div>
        <div className="mb-5 h-px w-12 bg-white/30" />

        <p className="text-xs leading-7 text-white/50">
          مجموعه‌ای برای کسانی که
          <br />
          به جزئیات اهمیت می‌دهند.
        </p>
      </div>
    </div>
  );
}

export function CatalogBackCover() {
  return (
    <div
      dir="rtl"
      className="
          flex
          h-full
          w-full
          items-center
          justify-center
          bg-[#191817]
          text-center
          text-white
        "
    >
      <div>
        <div className="text-2xl font-light tracking-[0.3em]">ZOPPINI</div>

        <p className="mt-4 text-xs text-white/40">www.zoppini.ir</p>
      </div>
    </div>
  );
}
