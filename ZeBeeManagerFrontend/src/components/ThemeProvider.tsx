
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Theme = "dark" | "light" | "system" | "fenix" | "pegaso" | "grifo";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark", "fenix", "pegaso", "grifo");

    let currentTheme = theme;

    if (user?.squad_name) {
      console.log(user?.squad_name);
      switch (user?.squad_name) {
        case "Fênix":
          currentTheme = "fenix";
          break;
        case "Pégaso":
          console.log(user?.squad_name);
          currentTheme = "pegaso";
          break;
        case "Grifo":
          console.log(user?.squad_name);
          currentTheme = "grifo";
          break;
        default:
          break;
      }
    }

    if (currentTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(currentTheme);
  }, [theme, user]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};