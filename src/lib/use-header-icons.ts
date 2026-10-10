"use client";

import { useMemo, useSyncExternalStore } from "react";
import { phosphorIconNames } from "@/lib/phosphor-icon-registry";
import { EMPTY_HEADER_ICON_PREFERENCES, type HeaderIconPreferences } from "@/lib/header-icons";

const STORAGE_KEY = "folium.header-icons.v1";
const CHANGE_EVENT = "folium-header-icons-change";
const validIcons = new Set<string>(phosphorIconNames);
let volatileSnapshot: string | null = null;

function snapshot(): string | null {
  if (volatileSnapshot !== null) return volatileSnapshot;
  try { return localStorage.getItem(STORAGE_KEY) ?? volatileSnapshot; }
  catch { return volatileSnapshot; }
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      volatileSnapshot = null;
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

export function parseHeaderIconPreferences(raw: string | null): HeaderIconPreferences {
  if (!raw) return EMPTY_HEADER_ICON_PREFERENCES;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object") return EMPTY_HEADER_ICON_PREFERENCES;
    const icons: Record<string, string> = Object.create(null);
    const aliases: Record<string, string> = Object.create(null);
    for (const [key, icon] of Object.entries(value.icons ?? {})) {
      if (typeof icon === "string" && validIcons.has(icon) && /^(concept|header):.+/.test(key)) icons[key] = icon;
    }
    for (const [key, concept] of Object.entries(value.aliases ?? {})) {
      if (key && typeof concept === "string" && /^(concept|header):.+/.test(concept)) aliases[key] = concept;
    }
    return { icons, aliases };
  } catch { return EMPTY_HEADER_ICON_PREFERENCES; }
}

export function useHeaderIcons() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const preferences = useMemo(() => parseHeaderIconPreferences(raw), [raw]);
  function update(transform: (current: HeaderIconPreferences) => HeaderIconPreferences) {
    const next = JSON.stringify(transform(parseHeaderIconPreferences(snapshot())));
    try { localStorage.setItem(STORAGE_KEY, next); volatileSnapshot = null; }
    catch { volatileSnapshot = next; }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return { preferences, update };
}
