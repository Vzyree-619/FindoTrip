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
}) => {
  return (
    <section className="bg-muted h-full lg:flex lg:h-screen">
      {/* Left Side Form */}
      <div className="flex flex-col h-full w-full lg:w-1/2 bg-background border-r border-gray-200">
        {/* Logo Top Left */}
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

        {/* Form Content Centered */}
        <div className="flex flex-col  items-center justify-center px-2 ">
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 font-inter text-center">
              Welcome to <br />
              <span className="text-[#004F2D]">Findo</span>
              <span className="text-red-700">Trip</span>
            </h1>
            <p className="text-md text-center text-gray-600">
              Start your experience by signing in or signing up.
            </p>

            {/* Tabs */}
            <div className="flex w-full border border-gray-300 rounded-md overflow-hidden h-12">
              <div className="w-1/2 py-2 flex items-center justify-center text-gray-700 cursor-pointer hover:bg-gray-100">
                Sign In
              </div>
              <div className="w-1/2 py-2 flex items-center justify-center bg-[#E6F0EB] text-gray-900 font-medium">
                Sign Up
              </div>
            </div>

            {/* Form (wrapper controls font + width) */}
            <form className="flex flex-col gap-4 w-full text-sm font-inter">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="name" className="text-gray-700 font-medium leading-5">
                  Your Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Full Name"
                  className="h-10 border-gray-300 w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="email" className="text-gray-700 font-medium leading-5">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-10 border-gray-300 w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="password" className="text-gray-700 font-medium leading-5">
                  Create a Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your Password"
                  className="h-10 border-gray-300 w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label
                  htmlFor="confirm-password"
                  className="text-gray-700 font-medium leading-5"
                >
                  Confirm Your Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Enter your Password"
                  className="h-10 border-gray-300 w-full"
                  required
                />
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <input type="checkbox" id="terms" className="mt-1" />
                <label htmlFor="terms">
                  By signing up you agree to our{" "}
                  <span className="font-semibold">Terms of Service</span> and{" "}
                  <span className="font-semibold">Privacy Policy</span>
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size='lg'
                className="w-full h-12 bg-[#004F2D] hover:bg-[#003621] text-white font-semibold"
              >
                {buttonText}
              </Button>
            </form>

            {/* Social Auth */}
            <div className="flex flex-col gap-2 w-full ">
              <Button
                variant="outline"
                className="w-full h-12 rounded border-gray-300 flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="h-5 w-5"
                />
                Continue With Google
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
                Continue With Facebook
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
