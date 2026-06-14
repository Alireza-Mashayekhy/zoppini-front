import Footer from '@/components/layout/public/footer';
import Header from '@/components/layout/public/header';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
