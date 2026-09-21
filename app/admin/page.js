import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();
  redirect(session?.user ? "/admin/dashboard" : "/login");
}
