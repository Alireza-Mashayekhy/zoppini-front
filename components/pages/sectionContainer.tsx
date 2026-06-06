export default function SectionContainer({
  children,
  isFirstChild,
}: Readonly<{
  children: React.ReactNode;
  isFirstChild?: boolean;
}>) {
  return (
    <section
      className={`panel ${isFirstChild ? '' : 'opacity-0'} fixed inset-0 flex items-center justify-center text-7xl text-white bg-white`}
    >
      {children}
    </section>
  );
}
