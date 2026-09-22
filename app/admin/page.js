import { redirect } from "next/navigation";
import { getActiveAdminSession } from "@/lib/auth-helpers";

export default async function AdminPage() {
  const session = await getActiveAdminSession();
  redirect(session ? "/admin/dashboard" : "/login");
}
