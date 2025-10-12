import React from "react";
import { useTheme, updateGlobalTheme } from "~/contexts/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'auto', label: 'Auto', icon: Monitor },
  ];

  return (
    <div className="flex items-center gap-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => {
            setTheme(value as any);
            updateGlobalTheme(value as any);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            theme === value
              ? 'bg-[#01502E] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
