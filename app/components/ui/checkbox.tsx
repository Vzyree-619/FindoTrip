import React from "react";

export function Checkbox({ id, checked, onCheckedChange, className, ...rest }: {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={"h-4 w-4 rounded border-gray-300 text-[#01502E] focus:ring-[#01502E] " + (className || "")}
      {...rest}
    />
  );
}

export default Checkbox;
