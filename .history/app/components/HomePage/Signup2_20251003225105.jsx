import { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignupPage({
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
          {logo?.src && (
            <div className="flex justify-center mb-4">
              <img src={logo.src} alt={logo.alt} className="h-10" />
            </div>
          )}

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
              variant={activeTab === "signup" ? "defau
