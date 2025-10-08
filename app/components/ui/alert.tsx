import React from "react";

export function Alert({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: "default" | "destructive"; className?: string; }) {
  const base = "w-full rounded-md border p-3 text-sm";
  const styles = variant === "destructive"
    ? "border-red-300 bg-red-50 text-red-800"
    : "border-gray-200 bg-gray-50 text-gray-800";
  return <div role="alert" className={`${base} ${styles} ${className}`}>{children}</div>;
}

export function AlertDescription({ children, className = "" }: { children: React.ReactNode; className?: string; }) {
  return <div className={`mt-1 ${className}`}>{children}</div>;
}

export default Alert;
