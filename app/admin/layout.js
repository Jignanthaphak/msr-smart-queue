import AdminLayout from '@/components/layout/AdminLayout';
import { getSessionServer } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Layout({ children }) {

  const session = await getSessionServer();
  
  if (!session?.user?.isAdminPanel) redirect("/");

  return (
   
    <AdminLayout >
      {children}
    </AdminLayout>

  );
}
