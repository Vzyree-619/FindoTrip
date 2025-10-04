import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom"; // ✅ Correct
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
    <section className="bg-muted h-screen flex items-center justify-center">
      <div className="flex h-full w-full lg:w-[500px] flex-col items-center justify-center shadow-md bg-background border border-muted px-8 py-10 rounded-md">
        
        {/* Logo */}
        <Link to={logo.url} className="mb-4">
          <img
            src={logo.src}
            alt={logo.alt}
            title={logo.title}
            className="h-12 dark:invert"
          />
        </Link>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-center mb-2">
          Welcome to <br />
          <span className="text-green-700">Findo</span>
          <span className="text-red-600">Trip</span>
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Start your experience by signing in or signing up.
        </p>

        {/* Tabs */}
        <div className="flex w-full max-w-sm rounded-md border overflow-hidden mb-6">
          <div className="w-1/2 flex justify-center items-center py-3 cursor-pointer hover:bg-muted font-medium">
            Sign In
          </div>
          <div className="w-1/2 flex justify-center items-center py-3 cursor-pointer hover:bg-muted font-medium">
            Sign Up
          </div>
        </div>

        {/* Form */}
        <form className="w-full max-w-sm flex flex-col gap-4 mb-6">
          <div>
            <Label className="mb-1 block">Your Full Name</Label>
            <Input type="text" placeholder="Enter your full name" required />
          </div>
          <div>
            <Label className="mb-1 block">Email Address</Label>
            <Input type="email" placeholder="Enter your email" required />
          </div>
          <div>
            <Label className="mb-1 block">Create a Password</Label>
            <Input type="password" placeholder="Enter your password" required />
          </div>
          <div>
            <Label className="mb-1 block">Confirm Your Password</Label>
            <Input type="password" placeholder="Confirm password" required />
          </div>
          <Button type="submit" className="w-full rounded mt-2">
            {buttonText}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-muted-foreground text-sm flex gap-1">
          <p>{signupText}</p>
          <a href={signupUrl} className="text-primary font-medium hover:underline">
            Login
          </a>
        </div>
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
