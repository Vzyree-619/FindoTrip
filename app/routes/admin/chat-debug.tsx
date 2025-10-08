import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/lib/auth/auth.server";
import { prisma } from "~/lib/db/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "SUPER_ADMIN") throw new Response("Forbidden", { status: 403 });

  const stats = {
    totalMessages: await prisma.message.count(),
    totalConversations: await prisma.conversation?.count() || 0,
    totalNotifications: await prisma.notification.count({ where: { type: "MESSAGE_RECEIVED" } }),
    recentMessages: await prisma.message.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, content: true, senderId: true, createdAt: true },
    }),
  };

  return json({ stats });
}

export default function ChatDebug() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Chat System Debug Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-600">Total Messages</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalMessages}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-600">Active Conversations</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalConversations}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-600">Chat Notifications</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalNotifications}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
        <div className="space-y-2">
          {stats.recentMessages.map((msg) => (
            <div key={msg.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="text-sm text-gray-500">ID: {msg.id} | Sender: {msg.senderId}</div>
              <div className="text-gray-800">{msg.content.slice(0, 100)}...</div>
              <div className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
