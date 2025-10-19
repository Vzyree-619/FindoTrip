import { redirect } from "@remix-run/node";

export async function loader() {
  // Redirect to the existing moderation route
  return redirect("/admin/moderation");
}
