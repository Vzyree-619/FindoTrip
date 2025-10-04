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
    <section className="bg-muted h-screen">
      <div className="flex h-full items-center justify-center">
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
          <div className="min-w-sm border-muted bg-background flex w-full max-w-sm flex-col items-center gap-y-4 rounded-md border px-6 py-8 shadow-md">
            <h1 className="text-xl font-semibold">Welcome to <br /><span className="text-green-700">Findo</span><span className="text-red-600">Trip</span></h1>
            <div className="flex w-full flex-col gap-2">
              <Label>Your Full Name</Label>
              <Input
                type="email"
                placeholder="Email"
                className="text-sm"
                required
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="Email"
                className="text-sm"
                required
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label>Create a Password</Label>
              <Input
                type="password"
                placeholder="Password"
                className="text-sm"
                required
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label>Confirm Your Password</Label>
              <Input
                type="password"
                placeholder="Password"
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
