import { Link } from "@remix-run/react";


export default function Register() {
    return (
      <div className="w-[99vw] overflow-hidden relative">
        <div className="relative flex items-center justify-center p-6">
          {/* Image */}
          <img
            src="/registration.jpg"
            alt="Registration"
            className="w-[90vw] h-[70vh] rounded-lg shadow-md select-none object-cover"
            draggable={false}
          />
  
          {/* Text Block - Responsive Positioning */}
          <div className="absolute top-1/2 md:top-auto md:right-[17vw] transform -translate-y-1/2 md:translate-y-0  bg-opacity-70 p-6 rounded-md w-[90%] md:w-fit text-white text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Register your <br /> Hotels / Stays
            </h2>
            <p className="text-sm font-semibold mb-4">
              Provide services to a huge community <br />
              and earn good with our <span className="font-semibold">less</span><br />
              commission policy.
            </p>
            <button className="bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded hover:bg-orange-600 transition">
            <Link to="/add"> Register Now</Link>
             
            </button>
          </div>
        </div>
      </div>
    );
  }
  