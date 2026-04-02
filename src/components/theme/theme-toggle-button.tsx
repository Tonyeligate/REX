"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyThemePreference,
  getResolvedThemeFromEnvironment,
  getStoredThemePreference,
  resolveTheme,
  type ResolvedTheme,
} from "@/lib/theme";

function useResolvedTheme(): [ResolvedTheme, () => void] {
  const [theme, setTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getResolvedThemeFromEnvironment());
    };

    syncTheme();

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMediaChange = () => {
      if (getStoredThemePreference() === "system") {
        setTheme(resolveTheme("system"));
      }
    };

    if (media) {
      if (media.addEventListener) {
        media.addEventListener("change", onMediaChange);
      } else {
        media.addListener(onMediaChange);
      }
    }

    window.addEventListener("storage", syncTheme);
    window.addEventListener("themechange", syncTheme as EventListener);

    return () => {
      if (media) {
        if (media.removeEventListener) {
          media.removeEventListener("change", onMediaChange);
        } else {
          media.removeListener(onMediaChange);
        }
      }
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themechange", syncTheme as EventListener);
    };
  }, []);

  const toggle = () => {
    const nextPreference = theme === "dark" ? "light" : "dark";
    const nextResolved = applyThemePreference(nextPreference);
    setTheme(nextResolved);
  };

  return [theme, toggle];
}

export default function ThemeToggleButton({
  className = "",
}: {
  className?: string;
}) {
  const [resolvedTheme, toggleTheme] = useResolvedTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground",
        className,
      ]
        .join(" ")
        .trim()}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}