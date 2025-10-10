import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getUser, requireUserId } from "~/lib/auth/auth.server";
import { useLoaderData } from "@remix-run/react";
import ChatContainer from "~/components/chat/ChatContainer";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUser(request);
  return json({ userId, user });
}

export default function MessagesPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <h1 className="text-xl font-semibold mb-4">Messages</h1>
        </div>
        <div className="md:col-span-2" />
      </div>
      <ChatContainer currentUserId={data.userId} />
    </div>
  );
}
