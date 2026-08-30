// app/login/layout.js
import LoginLayout from '@/components/layout/LoginLayout';
export default function Layout({ children }) {
 
  return (
      <>
        <LoginLayout >
          {children}
        </LoginLayout>
      </>
  );
}
