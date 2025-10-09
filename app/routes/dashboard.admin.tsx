import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth/middleware";
import { prisma } from "~/lib/db/db.server";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Shield, BarChart3, Activity, ServerCog, MessagesSquare, Megaphone, Users, FileText } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAdmin(request);
  return json({ user });
}

export default function AdminDashboard() {
  const { user } = useLoaderData<typeof loader>();

  const sections = [
    { href: "/admin/analytics", icon: BarChart3, title: "Analytics", desc: "Platform metrics and trends" },
    { href: "/admin/analytics/chat", icon: Activity, title: "Chat Analytics", desc: "Conversations and engagement" },
    { href: "/admin/live", icon: MessagesSquare, title: "Live Monitor", desc: "Monitor live chats and activity" },
    { href: "/admin/support", icon: Users, title: "Support Center", desc: "Tickets and provider support" },
    { href: "/admin/templates", icon: FileText, title: "Response Templates", desc: "Manage canned responses" },
    { href: "/admin/broadcast", icon: Megaphone, title: "Broadcasts", desc: "Send announcements" },
    { href: "/admin/moderation", icon: Shield, title: "Moderation", desc: "Content and user moderation" },
    { href: "/admin/security", icon: ServerCog, title: "Security", desc: "Security monitoring tools" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name?.split(" ")[0] || "Admin"}. Manage the platform using the tools below.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map(({ href, icon: Icon, title, desc }) => (
            <Card key={href} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-[#01502E]" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{desc}</p>
                <Button asChild variant="outline">
                  <Link to={href}>Open {title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
