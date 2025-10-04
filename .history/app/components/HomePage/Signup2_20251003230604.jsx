import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PropTypes from "prop-types";

const Signup2 = ({
  logo = {
    url: "https://www.shadcnblocks.com",
    src: "/FindoTripLogo.png",
    alt: "logo",
    title: "shadcnblocks.com",
  },
  buttonText = "Sign Up",
  signupText = "By signing up you agree to our",
  termsUrl = "#",
  privacyUrl = "#",
}) => {
  return (
    <section className="h-screen flex">
      {/* Left Side Form */}
      <div className="flex h-full items-center justify-center w-full lg:w-1/2 bg-white px-6 lg:px-12">
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Logo */}
          <a href={logo.url} target="_blank" rel="noreferrer">
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-12"
            />
          </a>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-center">
            Welcome to{" "}
            <span className="text-[#004F2D]">Findo</span>
            <span className="text-red-600">Trip</span>
          </h1>
          <p className="text-sm text-gray-600 text-center">
            Start your experience by signing in or signing up.
          </p>

          {/* Tabs */}
          <div className="flex items-center w-full rounded-md border border-gray-300 overflow-hidden">
            <div className="w-1/2 flex justify-center items-center py-2 font-medium text-gray-700 cursor-pointer hover:bg-gray-100">
              Sign In
            </div>
            <div className="w-1/2 flex justify-center items-center py-2 bg-gray-200 font-medium text-gray-700 cursor-pointer">
              Sign Up
            </div>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="font-medium text-gray-700">
                Your Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Full Name"
                className="w-full h-10 border border-gray-300 focus:border-[#004F2D] focus:ring-[#004F2D]"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full h-10 border border-gray-300 focus:border-[#004F2D] focus:ring-[#004F2D]"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="font-medium text-gray-700">
                Create a Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your Password"
                className="w-full h-10 border border-gray-300 focus:border-[#004F2D] focus:ring-[#004F2D]"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="confirm-password"
                className="font-medium text-gray-700"
              >
                Confirm Your Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Enter your Password"
                className="w-full h-10 border border-gray-300 focus:border-[#004F2D] focus:ring-[#004F2D]"
                required
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" id="terms" className="mt-1" />
              <label htmlFor="terms">
                {signupText}{" "}
                <a
                  href={termsUrl}
                  className="font-medium text-gray-800 hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href={privacyUrl}
                  className="font-medium text-gray-800 hover:underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#004F2D] hover:bg-[#003621] text-white font-semibold"
            >
              {buttonText}
            </Button>

            {/* Social Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                Continue With Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.svgrepo.com/show/452196/facebook-1.svg"
                  alt="Facebook"
                  className="h-5 w-5"
                />
                Continue With Facebook
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side (green background) */}
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
  signupText: PropTypes.string,
  termsUrl: PropTypes.string,
  privacyUrl: PropTypes.string,
};

export { Signup2 };
