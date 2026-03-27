export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

function canUseDOM(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getStoredThemePreference(): ThemePreference {
  if (!canUseDOM()) {
    return "system";
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light" || saved === "system") {
    return saved;
  }

  return "system";
}

export function getSystemTheme(): ResolvedTheme {
  if (!canUseDOM() || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    return getSystemTheme();
  }

  return preference;
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  if (!canUseDOM()) {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function applyThemePreference(preference: ThemePreference): ResolvedTheme {
  if (!canUseDOM()) {
    return "light";
  }

  const resolved = resolveTheme(preference);
  applyResolvedTheme(resolved);
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  return resolved;
}

export function applyStoredThemePreference(): ResolvedTheme {
  const preference = getStoredThemePreference();
  return applyThemePreference(preference);
}

export function getResolvedThemeFromEnvironment(): ResolvedTheme {
  if (!canUseDOM()) {
    return "light";
  }

  if (document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  return resolveTheme(getStoredThemePreference());
}

export const themeStorageKey = THEME_STORAGE_KEY;