import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded bg-gray-200 dark:bg-gray-800"
    >
      {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    </button>
  );
}