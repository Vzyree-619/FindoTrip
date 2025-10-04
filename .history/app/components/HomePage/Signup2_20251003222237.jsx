import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "lucide-react"; // ⚠️ Only icon, not routing
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
      {/* Left: Form */}
      <div className="flex h-full items-center justify-center w-full shadow-md bg-background border border-green-500">
        <div className="flex flex-col items-center gap-6 w-full max-w-md px-6">
          
          {/* Logo */}
          <a href={logo.url}>
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-10 dark:invert"
            />
          </a>

          {/* Heading */}
          <h1 className="text-xl font-semibold text-center">
            Welcome to <br />
            <span className="text-green-700">Findo</span>
            <span className="text-green-500">Trip</span>
          </h1>

          <p className="text-sm font-medium text-muted-foreground text-center">
            Start your experience by signing in or signing up.
          </p>

          {/* Tabs */}
          <div className="flex w-full max-w-sm h-12 rounded border border-green-500 text-sm font-medium overflow-hidden">
            <div className="w-1/2 flex justify-center items-center cursor-pointer hover:bg-green-100">
              Sign In
            </div>
            <div className="w-1/2 flex justify-center items-center cursor-pointer hover:bg-green-100">
              Sign Up
            </div>
          </div>

          {/* Form */}
          <form className="flex w-full max-w-sm flex-col gap-4 px-2 py-6">
            <div className="flex flex-col gap-2">
              <Label>Your Full Name</Label>
              <Input
                type="text"
                placeholder="Your Full Name"
                className="text-sm border-green-500 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="Enter your Email"
                className="text-sm border-green-500 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Create a Password</Label>
              <Input
                type="password"
                placeholder="Enter your Password"
                className="text-sm border-green-500 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Confirm Your Password</Label>
              <Input
                type="password"
                placeholder="Enter Password Again"
                className="text-sm border-green-500 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {buttonText}
            </Button>
          </form>

          {/* Footer */}
          <div className="flex justify-center gap-1 text-sm text-muted-foreground">
            <p>{signupText}</p>
            <a href={signupUrl} className="text-green-600 font-medium hover:underline">
              Login
            </a>
          </div>
        </div>
      </div>

      {/* Right: Image placeholder */}
      <div className="hidden lg:block w-full bg-green-50"></div>
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
