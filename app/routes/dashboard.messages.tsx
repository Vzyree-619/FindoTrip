import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/lib/auth/auth.server";
import { useLoaderData } from "@remix-run/react";
import ChatContainer from "~/components/chat/ChatContainer";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  return json({ userId });
}

export default function MessagesPage() {
  useLoaderData<typeof loader>();
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Messages</h1>
      <ChatContainer />
    </div>
  );
}
