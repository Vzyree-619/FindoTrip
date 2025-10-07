import { useEffect } from "react";
import { Form, useSubmit } from "@remix-run/react";
import { redirect, type ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/lib/auth/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}

export async function loader() {
  return null;
}

export default function LogoutNow() {
  const submit = useSubmit();

  useEffect(() => {
    // Auto-submit the logout form when component mounts
    const form = document.getElementById("logout-form") as HTMLFormElement;
    if (form) {
      submit(form, { method: "post" });
    }
  }, [submit]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Logging out...</h2>
          <p className="text-gray-600">Please wait while we log you out.</p>
        </div>

        <Form id="logout-form" method="post" className="hidden">
          <button type="submit">Logout</button>
        </Form>

        <div className="mt-6">
          <p className="text-sm text-gray-500 text-center">
            If you're not redirected automatically, click below:
          </p>
          <Form method="post" className="mt-4">
            <button
              type="submit"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Click here to logout
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}

