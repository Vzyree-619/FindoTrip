import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAdmin } from "~/lib/admin.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  throw redirect("/admin/settings/general");
}

export default function AdminSettingsPlatformRedirect() {
  return null;
}

