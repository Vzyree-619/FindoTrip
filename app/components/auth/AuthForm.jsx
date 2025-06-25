import { Form } from "@remix-run/react";
import { FaLock } from "react-icons/fa";


function AuthForm() {
  return (
    <Form
      method="post"
      className="max-w-md mx-auto mt-8 p-6 bg-blue-200 text-gray-900 rounded-lg shadow-lg text-center animate-fadeInUp"
    >
      <div className="w-16 h-16 flex items-center justify-center border-2 border-blue-600 rounded-full mb-4 mx-auto">
        <FaLock className="text-xl text-blue-600" />
      </div>
      <p className="mb-4">
        <label htmlFor="email" className="block text-sm font-semibold mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </p>
      <p className="mb-4">
        <label htmlFor="password" className="block text-sm font-semibold mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          minLength={7}
          className="w-full px-4 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </p>
      <div className="flex flex-col gap-3">
        <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
          Login
        </button>
        <a
          href="/auth"
          className="text-xs text-blue-600 hover:text-blue-800 transition"
        >
          Log in with existing user
        </a>
      </div>
    </Form>
  );
}

export default AuthForm;
