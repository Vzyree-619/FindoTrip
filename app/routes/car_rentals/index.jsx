import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

export default function CarRentalsRedirect() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the modern vehicles page
    navigate('/vehicles', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#01502E] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to vehicle rentals...</p>
      </div>
    </div>
  );
}
