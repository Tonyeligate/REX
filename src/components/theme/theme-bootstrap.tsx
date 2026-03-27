"use client";

import { useEffect } from "react";
import {
  applyResolvedTheme,
  applyStoredThemePreference,
  getStoredThemePreference,
  resolveTheme,
} from "@/lib/theme";

export default function ThemeBootstrap() {
  useEffect(() => {
    applyStoredThemePreference();

    if (!window.matchMedia) {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (getStoredThemePreference() !== "system") {
        return;
      }

      applyResolvedTheme(resolveTheme("system"));
    };

    if (media.addEventListener) {
      media.addEventListener("change", handleSystemThemeChange);
    } else {
      media.addListener(handleSystemThemeChange);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", handleSystemThemeChange);
      } else {
        media.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  return null;
}