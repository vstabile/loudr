import { LucideMoon, LucideSun } from "lucide-solid";
import { useTheme } from "../lib/theme";
import { Button } from "./ui/button";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={`Switch to ${theme() === "light" ? "dark" : "light"} mode`}
      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
    >
      {theme() === "light" ? (
        <LucideMoon class="h-5 w-5" />
      ) : (
        <LucideSun class="h-5 w-5" />
      )}
    </Button>
  );
}
