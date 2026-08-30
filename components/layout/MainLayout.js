// /components/layout/MainLayout.js
import Header from '@/components/common/Header';
import Navbar from '@/components/common/Navbar';

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </>
  );
}