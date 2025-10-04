import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom"; // ✅ Correct import
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
      <div className="flex h-full items-center justify-center w-full shadow-md bg-background border border-muted">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <Link to={logo.url}>
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-10 dark:invert"
            />
          </Link>

          <h1 className="text-xl font-semibold text-center">
            Welcome to <br />
            <span className="text-green-700">Findo</span>
            <span className="text-red-600">Trip</span>
          </h1>

          <p className="text-sm text-muted-foreground text-center">
            Start your experience by signing in or signing up.
          </p>

          {/* Tabs */}
          <div className="flex items-center w-[385px] h-[50px] rounded border">
            <div className="w-1/2 flex justify-center items-center cursor-pointer hover:bg-muted">
              Sign In
            </div>
            <div className="w-1/2 flex justify-center items-center cursor-pointer hover:bg-muted">
              Sign Up
            </div>
          </div>

          {/* Form */}
          <div className="flex w-full max-w-sm flex-col items-center gap-y-4 rounded-md px-6 py-8">
            {["Your Full Name", "Email Address", "Create a Password", "Confirm Your Password"].map(
              (label, idx) => (
                <div key={idx} className="flex w-full flex-col gap-2">
                  <Label className="text-base">{label}</Label>
                  <Input
                    type={idx === 1 ? "email" : idx > 1 ? "password" : "text"}
                    placeholder={label}
                    className="w-full h-10 md:w-96 lg:w-[400px]"
                    required
                  />
                </div>
              )
            )}
            <Button type="submit" className="w-full md:w-96 lg:w-[400px] rounded">
              {buttonText}
            </Button>
          </div>

          {/* Footer */}
          <div className="text-muted-foreground flex justify-center gap-1 text-sm">
            <p>{signupText}</p>
            <a href={signupUrl} className="text-primary font-medium hover:underline">
              Login
            </a>
          </div>
        </div>
      </div>

      {/* Right side image placeholder */}
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
