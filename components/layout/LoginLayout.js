// /components/layout/LoginLayout.js
export default function LoginLayout({ children }) {
  return (
    <>
      <main className="login-content">
        {children}
      </main>
    </>
  );
}