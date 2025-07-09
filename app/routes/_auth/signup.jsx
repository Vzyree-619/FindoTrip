import { useSearchParams } from "@remix-run/react";
import { useState } from "react";

const userFields = [
  { name: "name", label: "Full Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "password", label: "Password", type: "password", required: true },
  { name: "phone", label: "Phone Number", type: "tel", required: true },
];

const providerFields = [
  { name: "company", label: "Company/Business Name", type: "text", required: true },
  { name: "email", label: "Business Email", type: "email", required: true },
  { name: "password", label: "Password", type: "password", required: true },
  { name: "phone", label: "Business Phone", type: "tel", required: true },
  { name: "serviceType", label: "Service Type", type: "select", required: true, options: ["Car Rental", "Tour Provider", "Hotel", "Other"] },
  { name: "address", label: "Business Address", type: "text", required: true },
];

export default function Signup() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "user";
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const fields = type === "provider" ? providerFields : userFields;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would send the data to your backend
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-10 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up as {type === "provider" ? "Service Provider" : "User"}</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              {f.type === "select" ? (
                <select
                  name={f.name}
                  required={f.required}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  onChange={handleChange}
                  value={form[f.name] || ""}
                >
                  <option value="">Select...</option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type}
                  name={f.name}
                  required={f.required}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  onChange={handleChange}
                  value={form[f.name] || ""}
                />
              )}
            </div>
          ))}
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded mt-4">Sign Up</button>
        </form>
        {submitted && (
          <div className="mt-4 text-green-600 text-center font-semibold">Registration successful! (Dummy)</div>
        )}
      </div>
    </div>
  );
} 