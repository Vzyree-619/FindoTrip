import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PropTypes from "prop-types";
import { useState } from "react";

/* Reusable Input Field */
const InputField = ({ id, label, type, placeholder, autoComplete = "off" }) => (
  <div className="flex flex-col gap-2 w-full">
    <Label htmlFor={id} className="text-gray-700 font-medium leading-5">
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="h-10 border-gray-300 w-full"
      required
    />
  </div>
);

InputField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  autoComplete: PropTypes.string,
};

/* Main Component */
const Signup2 = ({
  logo = {
    url: "/",
    src: "/FindoTripLogo.png",
    alt: "logo",
    title: "shadcnblocks.com",
  },
  buttonText = "Sign Up",
}) => {
  const [formType, setFormType] = useState("signup"); // "signup" or "signin"

  const handleSignup = (e) => {
    e.preventDefault();
    console.log("Signup form submitted");
  };

  const handleSignin = (e) => {
    e.preventDefault();
    console.log("Signin form submitted");
  };

  return (
   <section className="bg-muted h-screen overflow-hidden flex">

      {/* Left Side */}
       <div className="flex flex-col h-full w-full lg:w-1/2 bg-background border-r border-gray-200">
        {/* Logo */}
        <div className="p-6">
          <a href={logo.url} target="_blank" rel="noreferrer">
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-12"
            />
          </a>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Heading */}
            <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 font-inter text-center">
              Welcome to <br />
              <span className="text-[#004F2D]">Findo</span>
              <span className="text-red-700">Trip</span>
            </h1>
            <p className="text-md text-center text-gray-600">
              Start your experience by signing in or signing up.
            </p>

            {/* Tabs */}
            <div className="flex w-full border border-gray-300 rounded-md overflow-hidden h-12 transition-all duration-300">
              <button
                onClick={() => setFormType("signin")}
                className={`w-1/2 py-2 flex items-center justify-center font-medium transition-all duration-200 ${
                  formType === "signin"
                    ? "bg-[#E6F0EB] text-gray-900"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Sign In Tab"
              >
                Sign In
              </button>
              <button
                onClick={() => setFormType("signup")}
                className={`w-1/2 py-2 flex items-center justify-center font-medium transition-all duration-200 ${
                  formType === "signup"
                    ? "bg-[#E6F0EB] text-gray-900"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Sign Up Tab"
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={formType === "signup" ? handleSignup : handleSignin}
              className="flex flex-col gap-4 w-full"
            >
              {formType === "signup" ? (
                <>
                  <InputField
                    id="name"
                    label="Your Full Name"
                    type="text"
                    placeholder="Your Full Name"
                  />
                  <InputField
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                  />
                  <InputField
                    id="password"
                    label="Create a Password"
                    type="password"
                    placeholder="Enter your Password"
                  />
                  <InputField
                    id="confirm-password"
                    label="Confirm Your Password"
                    type="password"
                    placeholder="Confirm your Password"
                  />

                  {/* Terms */}
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 cursor-pointer"
                      required
                    />
                    <label
                      htmlFor="terms"
                      className="cursor-pointer select-none"
                    >
                      By signing up you agree to our{" "}
                      <span className="font-semibold">Terms of Service</span> and{" "}
                      <span className="font-semibold">Privacy Policy</span>.
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <InputField
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                  />
                  <InputField
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="Enter your Password"
                  />

                  {/* Remember Me / Forgot Password */}
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <label
                      htmlFor="remember"
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        id="remember"
                        className="cursor-pointer"
                      />
                      <span className="font-semibold">Remember Me</span>
                    </label>
                    <span className="font-semibold cursor-pointer hover:underline">
                      Forgot Password?
                    </span>
                  </div>
                </>
              )}

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 bg-[#004F2D] hover:bg-[#003621] text-white font-semibold mt-2"
              >
                {formType === "signup" ? buttonText : "Sign In"}
              </Button>
            </form>

            {/* Social Auth */}
            <div className="flex flex-col gap-2 w-full mt-4">
              <Button
                variant="outline"
                className="w-full h-12 rounded border-gray-300 flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded border-gray-300 flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  alt="Facebook"
                  className="h-5 w-5"
                />
                Continue with Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex w-1/2 bg-[#004F2D]"></div>
    </section>
  );
};

Signup2.propTypes = {
  logo: PropTypes.shape({
    url: PropTypes.string,
    src: PropTypes.string,
    alt: PropTypes.string,
    title: PropTypes.string,
  }),
  buttonText: PropTypes.string,
};

export { Signup2 };
