// app/page.js
import MainLayout from '@/components/layout/MainLayout';
export default function LayOutReport({ children }) {
  return (
    <>
      <MainLayout >

        {children}

      </MainLayout>    
    
    </>
  );
}
