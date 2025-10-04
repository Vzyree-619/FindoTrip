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
      className="h-11 border-gray-300 w-full text-base"
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
  const [formType, setFormType] = useState("signup");

  const handleSignup = (e) => {
    e.preventDefault();
    console.log("Signup form submitted");
  };

  const handleSignin = (e) => {
    e.preventDefault();
    console.log("Signin form submitted");
  };

  return (
    <section className="bg-muted flex flex-col lg:flex-row h-screen w-full overflow-hidden">
      {/* Left Side */}
      <div className="flex flex-col justify-center items-center lg:items-start flex-1 bg-background border-r border-gray-200 px-6 sm:px-10 lg:px-16 2xl:px-24">
        {/* Logo */}
        <div className="absolute top-6 left-6">
          <a href={logo.url} target="_blank" rel="noreferrer">
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-10 md:h-12 xl:h-14"
            />
          </a>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center lg:items-start justify-center gap-8 w-full max-w-md xl:max-w-lg">
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-semibold text-gray-900 text-center lg:text-left leading-tight">
            Welcome to <br />
            <span className="text-[#004F2D]">Findo</span>
            <span className="text-red-700">Trip</span>
          </h1>
          <p className="text-sm sm:text-base xl:text-lg text-center lg:text-left text-gray-600 max-w-sm">
            Start your journey by signing in or creating an account.
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
                  label="Full Name"
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
                  label="Create Password"
                  type="password"
                  placeholder="Enter your Password"
                />
                <InputField
                  id="confirm-password"
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your Password"
                />

                {/* Terms */}
                <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 cursor-pointer"
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="cursor-pointer select-none leading-snug"
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
                <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600">
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
              className="w-full h-12 sm:h-14 bg-[#004F2D] hover:bg-[#003621] text-white font-semibold text-base sm:text-lg tracking-wide shadow-md hover:shadow-lg transition-all duration-300"
            >
              {formType === "signup" ? buttonText : "Sign In"}
            </Button>
          </form>

          {/* Social Auth */}
          <div className="flex flex-col gap-3 w-full mt-2">
            <Button
              variant="outline"
              className="w-full h-12 rounded border-gray-300 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
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
              className="w-full h-12 rounded border-gray-300 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
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

      {/* Right Side */}
      <div className="hidden lg:flex flex-1 bg-[#004F2D] relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#004F2D] to-[#03623B] opacity-90" />
        <img
          src="/FindoTripSideImage.jpg"
          alt="Scenic background"
          className="absolute inset-0 object-cover w-full h-full opacity-20"
        />
        <h2 className="relative z-10 text-white text-4xl xl:text-6xl font-semibold drop-shadow-lg text-center">
          Explore the World with Us
        </h2>
      </div>
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
