"use client";

import { Popover } from "@base-ui/react/popover";
import { CircleIcon } from "@phosphor-icons/react/Circle";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/MagnifyingGlass";
import type { Icon } from "@phosphor-icons/react";
import {
  createElement,
  lazy,
  Suspense,
  useMemo,
  useRef,
  useState,
  type LazyExoticComponent,
} from "react";

import { cn } from "@/lib/utils";
import {
  loadPhosphorIcon,
  phosphorIconNames,
} from "@/lib/phosphor-icon-registry";

export const DEFAULT_ICON_NAME = "CircleIcon";

const INITIAL_ICON_RESULT_LIMIT = 32;
const SEARCH_RESULT_LIMIT = 64;

type IconEntry = {
  name: string;
};

const iconEntries: IconEntry[] = phosphorIconNames.map((name) => ({ name }));

const iconByName = new Map(iconEntries.map((entry) => [entry.name, entry]));
const lazyIconCache = new Map<string, LazyExoticComponent<Icon>>(
  phosphorIconNames.map((name) => [
    name,
    lazy(() =>
      loadPhosphorIcon(name).then((IconComponent) => ({
        default: IconComponent,
      })),
    ),
  ] as const),
);

function getIconLabel(name: string) {
  return name
    .replace(/Icon$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function getIconEntry(name: string) {
  return iconByName.get(name) ?? iconByName.get(DEFAULT_ICON_NAME)!;
}

function getLazyIcon(name: string) {
  return lazyIconCache.get(name) ?? lazyIconCache.get(DEFAULT_ICON_NAME)!;
}

function IconGlyph({ name, size }: { name: string; size: number }) {
  if (name === DEFAULT_ICON_NAME) {
    return (
      <CircleIcon
        aria-hidden="true"
        color="black"
        size={size}
        weight="regular"
      />
    );
  }

  return (
    <Suspense
      fallback={
        <CircleIcon
          aria-hidden="true"
          color="black"
          size={size}
          weight="regular"
        />
      }
    >
      {createElement(getLazyIcon(name), {
        "aria-hidden": true,
        color: "black",
        size,
        weight: "regular",
      })}
    </Suspense>
  );
}

type IconPickerProps = {
  columnLabel: string;
  iconName?: string;
  onIconChange: (iconName: string) => void;
  synonyms?: string[];
  onSynonymsAdd?: (synonyms: string[]) => void;
  onReset?: () => void;
};

export function IconPicker({
  columnLabel,
  iconName = DEFAULT_ICON_NAME,
  onIconChange,
  synonyms = [],
  onSynonymsAdd,
  onReset,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [synonymDraft, setSynonymDraft] = useState("");
  const [synonymSaved, setSynonymSaved] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedEntry = getIconEntry(iconName);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchingEntries = iconEntries.filter((entry) =>
      entry.name.toLocaleLowerCase().includes(normalizedQuery),
    );

    if (normalizedQuery) {
      return matchingEntries.slice(0, SEARCH_RESULT_LIMIT);
    }

    const selectedFirst = [
      selectedEntry,
      ...matchingEntries.filter((entry) => entry.name !== selectedEntry.name),
    ];

    return selectedFirst.slice(0, INITIAL_ICON_RESULT_LIMIT);
  }, [query, selectedEntry]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setQuery("");
      setSynonymDraft("");
      setSynonymSaved(false);
    }
  }

  function handleSelect(nextIconName: string) {
    onIconChange(nextIconName);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        aria-label={`Change icon for ${columnLabel}`}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-none text-muted-foreground outline-none transition-[background-color,color,box-shadow] duration-150 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-expanded:bg-accent aria-expanded:text-accent-foreground"
        type="button"
      >
        <IconGlyph name={selectedEntry.name} size={16} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          className="z-50"
          side="bottom"
          sideOffset={8}
        >
          <Popover.Popup
            className="w-[min(22rem,calc(100vw-2rem))] origin-[var(--transform-origin)] overflow-hidden rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
            initialFocus={searchInputRef}
          >
            <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2 text-muted-foreground shadow-xs transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
              <MagnifyingGlassIcon
                aria-hidden="true"
                className="shrink-0"
                color="black"
                size={16}
                weight="regular"
              />
              <input
                aria-label="Search Phosphor icons"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search icons"
                ref={searchInputRef}
                type="search"
                value={query}
              />
            </div>
            <div
              aria-label="Phosphor icons"
              className="mt-1 grid max-h-72 grid-cols-8 gap-0.5 overflow-y-auto p-0.5"
              role="listbox"
            >
              {visibleEntries.length > 0 ? (
                visibleEntries.map(({ name }) => {
                  const label = getIconLabel(name);
                  const isSelected = name === selectedEntry.name;

                  return (
                    <button
                      aria-label={label}
                      aria-selected={isSelected}
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-[background-color,color,box-shadow] duration-150 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
                        isSelected &&
                          "bg-accent text-accent-foreground ring-1 ring-ring/30",
                      )}
                      key={name}
                      onClick={() => handleSelect(name)}
                      role="option"
                      title={label}
                      type="button"
                    >
                      <IconGlyph name={name} size={18} />
                    </button>
                  );
                })
              ) : (
                <div className="col-span-8 px-2 py-8 text-center text-xs text-muted-foreground">
                  No icons found
                </div>
              )}
            </div>
            {onSynonymsAdd && (
              <form
                className="mt-2 space-y-2 border-t border-border px-2 py-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const additions = synonymDraft.split(",").map((value) => value.trim()).filter(Boolean);
                  if (!additions.length) return;
                  onSynonymsAdd(additions);
                  setSynonymDraft("");
                  setSynonymSaved(true);
                }}
              >
                <p className="text-xs text-muted-foreground">Icon choices apply to matching headers across files.</p>
                {synonyms.length > 0 && <p className="max-h-14 overflow-y-auto text-xs text-muted-foreground">Matches: {synonyms.join(", ")}</p>}
                <label className="block text-xs" htmlFor={`synonyms-${columnLabel}`}>Add synonyms (comma separated)</label>
                <div className="flex gap-2">
                  <input
                    id={`synonyms-${columnLabel}`}
                    className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="e.g. work contact, office line"
                    value={synonymDraft}
                    onChange={(event) => { setSynonymDraft(event.target.value); setSynonymSaved(false); }}
                  />
                  <button className="rounded-md bg-accent px-2 py-1 text-xs disabled:opacity-40" disabled={!synonymDraft.trim()} type="submit">Add</button>
                </div>
                <p className="text-xs text-muted-foreground">Adding a synonym replaces its previous mapping.</p>
                <div className="flex items-center justify-between">
                  <span aria-live="polite" className="text-xs text-muted-foreground">{synonymSaved ? "Synonyms saved" : ""}</span>
                  {onReset && <button className="text-xs text-muted-foreground underline underline-offset-2" type="button" onClick={() => { onReset(); setOpen(false); }}>Use automatic icon</button>}
                </div>
              </form>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
