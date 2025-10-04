import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function Signup2({
  heading,
  logo,
  onSignup,
  onSignin,
  onGoogle,
  onFacebook,
}) {
  const [activeTab, setActiveTab] = useState("signup");

  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="flex flex-1 items-center justify-center bg-white">
        <div className="w-full max-w-md p-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src={logo?.src} alt={logo?.alt} className="h-10" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">{heading}</h2>
          <p className="text-center text-gray-600 mb-6">
            Start your experience by signing in or signing up.
          </p>

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <Button
              variant={activeTab === "signin" ? "default" : "outline"}
              className={`w-1/2 rounded-none ${
                activeTab === "signin" ? "bg-green-700 text-white" : ""
              }`}
              onClick={() => setActiveTab("signin")}
            >
              Sign In
            </Button>
            <Button
              variant={activeTab === "signup" ? "default" : "outline"}
              className={`w-1/2 rounded-none ${
                activeTab === "signup" ? "bg-green-100 text-black" : ""
              }`}
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </Button>
          </div>

          {/* Form */}
          {activeTab === "signup" ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSignup?.();
              }}
            >
              <div>
                <Label>Your Full Name</Label>
                <Input placeholder="Your Full Name" />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input type="email" placeholder="Enter your email" />
              </div>
              <div>
                <Label>Create a Password</Label>
                <Input type="password" placeholder="Enter your Password" />
              </div>
              <div>
                <Label>Confirm Your Password</Label>
                <Input type="password" placeholder="Enter your Password" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="text-sm">
                  By signing up you agree to our{" "}
                  <span className="font-semibold">Terms of Service</span> and{" "}
                  <span className="font-semibold">Privacy Policy</span>
                </Label>
              </div>
              <Button className="w-full bg-green-800 text-white">Sign Up</Button>

              <div className="flex flex-col space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onGoogle}
                >
                  <span className="mr-2">🌐</span> Continue With Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onFacebook}
                >
                  <span className="mr-2">📘</span> Continue With Facebook
                </Button>
              </div>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSignin?.();
              }}
            >
              <div>
                <Label>Email Address</Label>
                <Input type="email" placeholder="Enter your email" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" placeholder="Enter your Password" />
              </div>
              <Button className="w-full bg-green-800 text-white">Sign In</Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="hidden lg:block lg:w-1/2 bg-green-900"></div>
    </div>
  );
}

// ✅ PropTypes
Signup2.propTypes = {
  heading: PropTypes.string,
  logo: PropTypes.shape({
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
  }),
  onSignup: PropTypes.func,
  onSignin: PropTypes.func,
  onGoogle: PropTypes.func,
  onFacebook: PropTypes.func,
};

// ✅ Default Props
Signup2.defaultProps = {
  heading: (
    <>
      Welcome to <span className="text-green-600">Findo</span>
      <span className="text-orange-600">Trip</span>
    </>
  ),
  logo: {
    src: "https://i.ibb.co/jypV5yt/logo.png",
    alt: "FindoTrip Logo",
  },
};
