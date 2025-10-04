import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "lucide-react";
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
    <section className="bg-muted h-screen flex">
      <div className="flex h-full items-center justify-center w-full shadow-md bg-background border-muted border">
        <div className="flex flex-col items-center gap-6 lg:justify-start">
          {/* Logo */}
          <Link to={logo.url}>
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-10 dark:invert"
            />
          </Link>
          <h1 className="text-xl font-semibold">
            Welcome to <br />
            <span className="text-green-700">Findo</span>
            <span className="text-red-600">Trip</span>
          </h1>
          <p>Start your experience by signing in or signing up.</p>
          <div
            className="flex h-9 rounded-md border justify-between items-center min-w-sm  w-full max-w-sm bg-transparent px-3 py-1 text-base shadow-sm md:text-sm"
          >
            <div>Sign In</div>
            <div>Sign Up</div>
          </div>
          <div className="min-w-sm flex w-full max-w-sm flex-col items-center gap-y-4 rounded-md  px-6 py-8 ">
            <div className="flex w-full flex-col gap-2">
              <Label>Your Full Name</Label>
              <Input
                type="email"
                placeholder="Your Full Name"
                className="text-sm"
                required
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="Enter your Email"
                className="text-sm"
                required
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label>Create a Password</Label>
              <Input
                type="password"
                placeholder="Enter your Password"
                className="text-sm"
                required
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label>Confirm Your Password</Label>
              <Input
                type="password"
                placeholder="Enter Password Again"
                className="text-sm"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {buttonText}
            </Button>
          </div>
          <div className="text-muted-foreground flex justify-center gap-1 text-sm">
            <p>{signupText}</p>
            <a
              href={signupUrl}
              className="text-primary font-medium hover:underline"
            >
              Login
            </a>
          </div>
        </div>
      </div>

      {/* for image */}
      <div className="w-full"></div>
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
