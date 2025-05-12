import {
  createSignal,
  createContext,
  useContext,
  createEffect,
  onMount,
  JSX,
  Component,
} from "solid-js";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: () => Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>();

export const ThemeProvider: Component<{ children: JSX.Element }> = (props) => {
  const [theme, setTheme] = createSignal<Theme>(
    (localStorage.getItem("theme") as Theme) || "light"
  );

  const toggleTheme = () => {
    const newTheme = theme() === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    updateTheme(newTheme);
  };

  const updateTheme = (theme: Theme) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  onMount(() => {
    // Check for system preference if no theme is set
    if (!localStorage.getItem("theme")) {
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
    updateTheme(theme());
  });

  createEffect(() => {
    updateTheme(theme());
  });

  const contextValue: ThemeContextValue = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
