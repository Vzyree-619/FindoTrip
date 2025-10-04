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
  buttonText = "Create Account",
  signupText = "Already a user?",
  signupUrl = "https://shadcnblocks.com",
}) => {
  return (
    <section className="bg-muted h-screen lg:flex">
      {/* Left Side Form */}
      <div className="flex h-full items-center justify-center w-full lg:w-1/2 shadow-xl bg-background border border-gray-200 rounded-none lg:rounded-r-2xl p-8">
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* Logo */}
          <a href={logo.url} target="_blank" rel="noreferrer">
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-12 dark:invert"
            />
          </a>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-center">
            Welcome to <br />
            <span className="text-[#004F2D]">Findo</span>
            <span className="text-red-600">Trip</span>
          </h1>
          <p className="font-inter text-sm font-medium text-center text-gray-600">
            Start your experience by signing in or signing up.
          </p>

          {/* Tabs */}
          <div className="flex items-center w-full rounded-md border border-[#004F2D] overflow-hidden">
            <div className="w-1/2 flex justify-center items-center py-2 text-[#004F2D] font-medium cursor-pointer hover:bg-green-50">
              Sign In
            </div>
            <div className="w-1/2 flex justify-center items-center py-2 text-[#004F2D] font-medium cursor-pointer hover:bg-[#004F2D] hover:text-white">
              Sign Up
            </div>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-[#004F2D] font-medium">
                Your Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Full Name"
                className="w-full h-10 border-2 border-gray-300 focus:border-[#004F2D] focus:ring-2 focus:ring-[#004F2D]"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[#004F2D] font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your Email"
                className="w-full h-10 border-2 border-gray-300 focus:border-[#004F2D] focus:ring-2 focus:ring-[#004F2D]"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-[#004F2D] font-medium">
                Create a Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your Password"
                className="w-full h-10 border-2 border-gray-300 focus:border-[#004F2D] focus:ring-2 focus:ring-[#004F2D]"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="confirm-password"
                className="text-[#004F2D] font-medium"
              >
                Confirm Your Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Enter Password Again"
                className="w-full h-10 border-2 border-gray-300 focus:border-[#004F2D] focus:ring-2 focus:ring-[#004F2D]"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#004F2D] hover:bg-[#003621] text-white font-semibold rounded-md"
            >
              {buttonText}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-muted-foreground flex justify-center gap-1 text-sm">
            <p>{signupText}</p>
            <a
              href={signupUrl}
              className="text-[#004F2D] font-medium hover:underline"
            >
              Login
            </a>
          </div>
        </div>
      </div>

      {/* Right Side Empty Div (for image later) */}
      <div className="hidden lg:flex w-1/2 bg-gray-100 items-center justify-center">
        {/* You can add an <img> here */}
      </div>
    </section>
  );
};

Signup2.propTypes = {
  heading: PropTypes.string,
  logo: PropTypes.shape({
    url: PropTypes.string,
    src: PropTypes.string,
    alt: PropTypes.string,
    title: PropTypes.string,
  }),
  buttonText: PropTypes.string,
  signupText: PropTypes.string,
  signupUrl: PropTypes.string,
};

export { Signup2 };
