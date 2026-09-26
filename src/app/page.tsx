"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_ICON_NAME, IconPicker } from "@/components/icon-picker";

type CsvRow = string[];
type ColumnWidths = Record<number, number>;
type ColumnIcons = Record<number, string>;
type CsvFileHandle = {
  getFile: () => Promise<File>;
};
type ResizeState = {
  columnIndex: number;
  startWidth: number;
  startX: number;
};

const MIN_COLUMN_WIDTH = 48;
const SERIAL_COLUMN_WIDTH = 48;
const HEADER_ICON_SPACE = 28;
const ROW_HEIGHT = 48;
const OVERSCAN_ROWS = 8;
type FilePickerWindow = Window & {
  showOpenFilePicker?: (options?: {
    excludeAcceptAllOption?: boolean;
    multiple?: boolean;
    types?: Array<{
      accept: Record<string, string[]>;
      description: string;
    }>;
  }) => Promise<CsvFileHandle[]>;
};

function parseCsv(input: string): CsvRow[] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (insideQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        field += character;
      }

      continue;
    }

    if (character === '"') {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }

      row.push(field);

      if (row.some((value) => value !== "") || row.length > 1) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function getWebsiteHref(value: string): string | null {
  const trimmedValue = value.trim();

  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue);

  if (!trimmedValue || /\s/.test(trimmedValue) || looksLikeEmail) {
    return null;
  }

  const href = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const url = new URL(href);

    if (!url.hostname.includes(".")) {
      return null;
    }

    return href;
  } catch {
    return null;
  }
}

function getFaviconSources(href: string): string[] {
  const url = new URL(href);

  return [
    `${url.origin}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url.hostname)}&sz=32`,
  ];
}

function WebsiteLink({ value, href }: { value: string; href: string }) {
  const faviconSources = getFaviconSources(href);
  const [faviconIndex, setFaviconIndex] = useState(0);
  const faviconSource = faviconSources[faviconIndex];

  return (
    <a
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-primary underline decoration-primary/40 underline-offset-4 transition-[color,text-decoration-color] duration-150 ease-out hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {faviconSource && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden="true"
          className="h-4 w-4 shrink-0 rounded-none object-contain outline outline-1 outline-black/10"
          decoding="async"
          height={16}
          loading="lazy"
          onError={() => setFaviconIndex((current) => current + 1)}
          referrerPolicy="no-referrer"
          src={faviconSource}
          width={16}
        />
      )}
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {value}
      </span>
    </a>
  );
}

function renderCellValue(value: string) {
  const href = getWebsiteHref(value);

  if (!href) {
    return value;
  }

  return <WebsiteLink href={href} value={value} />;
}

function getFileSignature(file: File) {
  return `${file.name}:${file.lastModified}:${file.size}`;
}

function getMaxLineWidth(
  context: CanvasRenderingContext2D,
  value: string,
) {
  return Math.max(
    0,
    ...value.split(/\r?\n/).map((line) => context.measureText(line).width),
  );
}

function getCanvasFont(style: CSSStyleDeclaration | null, weight: string) {
  if (!style) {
    return `${weight} 14px sans-serif`;
  }

  return `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
}

function getHorizontalPadding(style: CSSStyleDeclaration | null) {
  if (!style) {
    return 32;
  }

  return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
}

function measureSerialColumnWidth(
  dataRowCount: number,
  table: HTMLTableElement | null,
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return SERIAL_COLUMN_WIDTH;
  }

  const serialCell = table?.querySelector<HTMLElement>('th[scope="row"]');
  const serialStyle = serialCell ? getComputedStyle(serialCell) : null;

  context.font = getCanvasFont(serialStyle, "400");

  return Math.max(
    SERIAL_COLUMN_WIDTH,
    Math.ceil(
      context.measureText(String(Math.max(1, dataRowCount))).width +
        getHorizontalPadding(serialStyle) +
        1,
    ),
  );
}

function measureNaturalColumnWidths(
  rows: CsvRow[],
  table: HTMLTableElement | null,
) {
  const columnCount = rows.reduce(
    (largest, currentRow) => Math.max(largest, currentRow.length),
    0,
  );
  const [headerRow = []] = rows;
  const naturalWidths: ColumnWidths = {};
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context || columnCount === 0) {
    return naturalWidths;
  }

  const headerCell = table?.querySelector<HTMLElement>("[data-csv-column]");
  const bodyCell = table?.querySelector<HTMLElement>("[data-csv-cell]");
  const headerStyle = headerCell ? getComputedStyle(headerCell) : null;
  const bodyStyle = bodyCell ? getComputedStyle(bodyCell) : headerStyle;
  const headerFont = getCanvasFont(headerStyle, "500");
  const bodyFont = getCanvasFont(bodyStyle, "400");
  const headerPadding = getHorizontalPadding(headerStyle) + 1;
  const bodyPadding = getHorizontalPadding(bodyStyle) + 1;

  context.font = headerFont;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    let widest = getMaxLineWidth(
      context,
      headerRow[columnIndex] ?? "",
    ) + headerPadding + HEADER_ICON_SPACE;

    context.font = bodyFont;

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      const value = rows[rowIndex][columnIndex] ?? "";
      const faviconWidth = getWebsiteHref(value) ? 22 : 0;
      const width =
        getMaxLineWidth(context, value) + bodyPadding + faviconWidth;

      widest = Math.max(widest, width);
    }

    context.font = headerFont;
    naturalWidths[columnIndex] = Math.max(
      MIN_COLUMN_WIDTH,
      Math.ceil(widest),
    );
  }

  return naturalWidths;
}

function getTableWidth(
  columnWidths: ColumnWidths,
  serialColumnWidth = SERIAL_COLUMN_WIDTH,
) {
  return (
    serialColumnWidth +
    Object.values(columnWidths).reduce((total, width) => total + width, 0)
  );
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileSignatureRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);
  const naturalColumnWidthsRef = useRef<ColumnWidths | null>(null);
  const manualColumnWidthsRef = useRef<ColumnWidths>({});
  const pendingResizeWidthRef = useRef<number | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const serialColumnWidthRef = useRef<number | null>(null);
  const columnGroupRef = useRef<HTMLTableColElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const resetScrollRef = useRef(false);
  const scrollTopRef = useRef(0);
  const tableRef = useRef<HTMLTableElement>(null);
  const [naturalColumnWidths, setNaturalColumnWidths] =
    useState<ColumnWidths>({});
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({});
  const [serialColumnWidth, setSerialColumnWidth] =
    useState(SERIAL_COLUMN_WIDTH);
  const [columnIcons, setColumnIcons] = useState<ColumnIcons>({});
  const [isResizing, setIsResizing] = useState(false);
  const [rows, setRows] = useState<CsvRow[] | null>(null);
  const [fileHandle, setFileHandle] = useState<CsvFileHandle | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const activeColumnWidths = useMemo(
    () => ({ ...naturalColumnWidths, ...columnWidths }),
    [columnWidths, naturalColumnWidths],
  );
  const columnCount = useMemo(
    () =>
      rows?.reduce(
        (largest, currentRow) => Math.max(largest, currentRow.length),
        0,
      ) ?? 0,
    [rows],
  );
  const dataRowCount = Math.max(0, (rows?.length ?? 0) - 1);
  const bodyScrollTop = Math.max(0, scrollTop - ROW_HEIGHT);
  const visibleStartIndex = Math.max(
    0,
    Math.floor(bodyScrollTop / ROW_HEIGHT) - OVERSCAN_ROWS,
  );
  const visibleEndIndex = Math.min(
    dataRowCount,
    Math.ceil(
      (bodyScrollTop + Math.max(viewportHeight, ROW_HEIGHT)) / ROW_HEIGHT,
    ) + OVERSCAN_ROWS,
  );

  function applyColumnWidth(columnIndex: number, width: number) {
    const column = columnGroupRef.current?.children[
      columnIndex + 1
    ] as HTMLTableColElement | undefined;

    if (!column) {
      return;
    }

    column.style.maxWidth = `${width}px`;
    column.style.minWidth = `${MIN_COLUMN_WIDTH}px`;
    column.style.width = `${width}px`;
  }

  function applyTableWidth(columnWidths: ColumnWidths) {
    if (!tableRef.current) {
      return;
    }

    tableRef.current.style.width = `${getTableWidth(
      columnWidths,
      serialColumnWidthRef.current ?? SERIAL_COLUMN_WIDTH,
    )}px`;
  }

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const resize = resizeRef.current;

      if (!resize) {
        return;
      }

      const nextWidth = Math.max(
        MIN_COLUMN_WIDTH,
        resize.startWidth + event.clientX - resize.startX,
      );

      pendingResizeWidthRef.current = nextWidth;
      applyColumnWidth(resize.columnIndex, nextWidth);
      applyTableWidth({
        ...(naturalColumnWidthsRef.current ?? {}),
        ...manualColumnWidthsRef.current,
        [resize.columnIndex]: nextWidth,
      });
    }

    function endResize() {
      const resize = resizeRef.current;

      if (!resize) {
        return;
      }

      const nextWidth = pendingResizeWidthRef.current;

      if (nextWidth !== null) {
        const nextWidths = {
          ...manualColumnWidthsRef.current,
          [resize.columnIndex]: nextWidth,
        };

        manualColumnWidthsRef.current = nextWidths;
        setColumnWidths(nextWidths);
      }

      pendingResizeWidthRef.current = null;
      resizeRef.current = null;
      setIsResizing(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endResize);
    window.addEventListener("pointercancel", endResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endResize);
      window.removeEventListener("pointercancel", endResize);
    };
  }, []);

  useEffect(() => {
    if (!rows) {
      return;
    }

    naturalColumnWidthsRef.current = null;
    serialColumnWidthRef.current = null;
    const frameId = window.requestAnimationFrame(() => {
      const nextWidths = measureNaturalColumnWidths(rows, tableRef.current);
      const nextSerialColumnWidth = measureSerialColumnWidth(
        Math.max(1, rows.length - 1),
        tableRef.current,
      );

      naturalColumnWidthsRef.current = nextWidths;
      serialColumnWidthRef.current = nextSerialColumnWidth;
      setNaturalColumnWidths(nextWidths);
      setSerialColumnWidth(nextSerialColumnWidth);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [rows]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;

    if (!scrollContainer || !rows) {
      return;
    }

    const activeScrollContainer = scrollContainer;

    function updateViewportHeight() {
      setViewportHeight(activeScrollContainer.clientHeight);
    }

    if (resetScrollRef.current) {
      activeScrollContainer.scrollTop = 0;
      scrollTopRef.current = 0;
      setScrollTop(0);
      resetScrollRef.current = false;
    }
    updateViewportHeight();

    const resizeObserver = new ResizeObserver(updateViewportHeight);
    resizeObserver.observe(activeScrollContainer);

    return () => resizeObserver.disconnect();
  }, [rows]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    [],
  );

  function handleTableScroll(event: React.UIEvent<HTMLDivElement>) {
    scrollTopRef.current = event.currentTarget.scrollTop;

    if (scrollFrameRef.current !== null) {
      return;
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      setScrollTop(scrollTopRef.current);
    });
  }

  useEffect(() => {
    if (!fileHandle) {
      return;
    }

    const activeFileHandle = fileHandle;
    let cancelled = false;

    async function syncFile() {
      if (cancelled || isSyncingRef.current) {
        return;
      }

      isSyncingRef.current = true;

      try {
        const file = await activeFileHandle.getFile();
        const signature = getFileSignature(file);

        if (signature === fileSignatureRef.current) {
          return;
        }

        const nextRows = parseCsv(await file.text());

        if (!cancelled) {
          fileSignatureRef.current = signature;
          setRows(nextRows);
        }
      } catch {
        // Keep the last rendered snapshot if the file is temporarily unavailable.
      } finally {
        isSyncingRef.current = false;
      }
    }

    const intervalId = window.setInterval(() => void syncFile(), 500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [fileHandle]);

  function getNaturalSerialColumnWidth() {
    if (serialColumnWidthRef.current !== null) {
      return serialColumnWidthRef.current;
    }

    const nextWidth = measureSerialColumnWidth(
      Math.max(1, (rows?.length ?? 0) - 1),
      tableRef.current,
    );

    serialColumnWidthRef.current = nextWidth;
    setSerialColumnWidth(nextWidth);
    return nextWidth;
  }

  async function loadFile(file: File, handle: CsvFileHandle | null) {
    const nextRows = parseCsv(await file.text());

    fileSignatureRef.current = getFileSignature(file);
    naturalColumnWidthsRef.current = null;
    serialColumnWidthRef.current = null;
    manualColumnWidthsRef.current = {};
    resetScrollRef.current = true;
    scrollTopRef.current = 0;
    setScrollTop(0);
    setNaturalColumnWidths({});
    setColumnWidths({});
    setSerialColumnWidth(SERIAL_COLUMN_WIDTH);
    setColumnIcons({});
    setFileHandle(handle);
    setRows(nextRows);
  }

  function getNaturalColumnWidths() {
    getNaturalSerialColumnWidth();

    if (naturalColumnWidthsRef.current) {
      return naturalColumnWidthsRef.current;
    }

    const naturalWidths = measureNaturalColumnWidths(rows ?? [], tableRef.current);

    naturalColumnWidthsRef.current = naturalWidths;
    setNaturalColumnWidths(naturalWidths);
    return naturalWidths;
  }

  function resetColumnWidth(columnIndex: number) {
    const naturalWidths = getNaturalColumnWidths();
    const naturalWidth = naturalWidths[columnIndex];

    if (!naturalWidth) {
      return;
    }

    const nextWidths = { ...manualColumnWidthsRef.current };

    if (!(columnIndex in nextWidths)) {
      return;
    }

    delete nextWidths[columnIndex];
    manualColumnWidthsRef.current = nextWidths;
    setColumnWidths(nextWidths);
  }

  function beginColumnResize(
    columnIndex: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const headerCell = event.currentTarget.parentElement;

    if (!headerCell) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const naturalWidths = getNaturalColumnWidths();
    const activeWidths = {
      ...naturalWidths,
      ...manualColumnWidthsRef.current,
    };
    resizeRef.current = {
      columnIndex,
      startWidth:
        activeWidths[columnIndex] ?? headerCell.getBoundingClientRect().width,
      startX: event.clientX,
    };
    pendingResizeWidthRef.current = resizeRef.current.startWidth;
    applyTableWidth(activeWidths);
    setNaturalColumnWidths(naturalWidths);
    setIsResizing(true);
  }

  function handleColumnResizeKeyDown(
    columnIndex: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      resetColumnWidth(columnIndex);
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    const headerCell = event.currentTarget.parentElement;

    if (!headerCell) {
      return;
    }

    event.preventDefault();
    const naturalWidths = getNaturalColumnWidths();
    const currentWidth = activeColumnWidths[columnIndex] ??
      naturalWidths[columnIndex] ??
      headerCell.getBoundingClientRect().width;
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextWidths = {
      ...manualColumnWidthsRef.current,
      [columnIndex]: Math.max(
        MIN_COLUMN_WIDTH,
        currentWidth + direction * 16,
      ),
    };

    manualColumnWidthsRef.current = nextWidths;
    setNaturalColumnWidths(naturalWidths);
    setColumnWidths(nextWidths);
  }

  async function handleLoadFile() {
    const filePickerWindow = window as FilePickerWindow;

    if (!filePickerWindow.showOpenFilePicker) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const [handle] = await filePickerWindow.showOpenFilePicker({
        excludeAcceptAllOption: true,
        multiple: false,
        types: [
          {
            accept: { "text/csv": [".csv"] },
            description: "CSV files",
          },
        ],
      });

      await loadFile(await handle.getFile(), handle);
    } catch {
      // Keep the empty state when the picker is cancelled or unavailable.
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await loadFile(file, null);
  }

  if (rows) {
    const [headerRow = []] = rows;
    const hasColumnWidths = Object.keys(activeColumnWidths).length > 0;

    return (
      <main
        className={`h-svh w-full overflow-hidden bg-background${
          isResizing ? " cursor-col-resize select-none" : ""
        }`}
      >
        <div
          className="h-full w-full overflow-x-auto overflow-y-auto"
          onScroll={handleTableScroll}
          ref={scrollContainerRef}
        >
          <table
            className={`${
              hasColumnWidths ? "table-fixed" : "w-max table-auto"
            } border-separate border-spacing-0 text-left text-sm`}
            ref={tableRef}
            style={
              hasColumnWidths
                ? {
                    width: `${getTableWidth(
                      activeColumnWidths,
                      serialColumnWidth,
                    )}px`,
                  }
                : undefined
            }
          >
            {columnCount > 0 && (
              <colgroup ref={columnGroupRef}>
                <col
                  style={
                    hasColumnWidths
                      ? {
                          maxWidth: `${serialColumnWidth}px`,
                          minWidth: `${serialColumnWidth}px`,
                          width: `${serialColumnWidth}px`,
                        }
                      : undefined
                  }
                />
                {Array.from({ length: columnCount }, (_, columnIndex) => (
                  <col
                    key={`column-${columnIndex}`}
                    style={
                      activeColumnWidths[columnIndex] !== undefined
                        ? {
                            maxWidth: `${activeColumnWidths[columnIndex]}px`,
                            minWidth: `${MIN_COLUMN_WIDTH}px`,
                            width: `${activeColumnWidths[columnIndex]}px`,
                          }
                        : undefined
                    }
                  />
                ))}
              </colgroup>
            )}
            {columnCount > 0 && (
              <thead>
                <tr style={{ height: `${ROW_HEIGHT}px` }}>
                  <th
                    aria-hidden="true"
                    className="sticky top-0 border-b border-r border-border bg-muted px-4 py-3 align-top font-medium whitespace-pre last:border-r-0"
                  />
                  {Array.from({ length: columnCount }, (_, columnIndex) => (
                    <th
                      className="sticky top-0 min-w-0 overflow-hidden border-b border-r border-border bg-muted px-4 py-3 align-top font-medium whitespace-pre text-foreground last:border-r-0"
                      data-csv-column={columnIndex}
                      key={`header-${columnIndex}`}
                      scope="col"
                      style={
                        activeColumnWidths[columnIndex] !== undefined
                          ? { width: `${activeColumnWidths[columnIndex]}px` }
                          : undefined
                      }
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <IconPicker
                          columnLabel={
                            headerRow[columnIndex] ||
                            `column ${columnIndex + 1}`
                          }
                          iconName={
                            columnIcons[columnIndex] ?? DEFAULT_ICON_NAME
                          }
                          onIconChange={(nextIconName) =>
                            setColumnIcons((current) => ({
                              ...current,
                              [columnIndex]: nextIconName,
                            }))
                          }
                        />
                        <span className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {headerRow[columnIndex] ?? ""}
                        </span>
                      </div>
                      <button
                        aria-label={`Resize ${headerRow[columnIndex] || `column ${columnIndex + 1}`} column`}
                        className="absolute inset-y-0 right-0 z-10 w-3 touch-none cursor-col-resize bg-transparent opacity-0 transition-[opacity,background-color] duration-150 ease-out hover:bg-border/60 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        onKeyDown={(event) =>
                          handleColumnResizeKeyDown(columnIndex, event)
                        }
                        onDoubleClick={() => resetColumnWidth(columnIndex)}
                        onPointerDown={(event) =>
                          beginColumnResize(columnIndex, event)
                        }
                        type="button"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {visibleStartIndex > 0 && (
                <tr aria-hidden="true">
                  <td
                    className="border-0 p-0"
                    colSpan={columnCount + 1}
                    style={{ height: `${visibleStartIndex * ROW_HEIGHT}px` }}
                  />
                </tr>
              )}
              {Array.from(
                { length: visibleEndIndex - visibleStartIndex },
                (_, offset) => {
                  const rowIndex = visibleStartIndex + offset;
                  const currentRow = rows[rowIndex + 1] ?? [];

                  return (
                <tr
                  key={`row-${rowIndex}`}
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <th
                    className="border-b border-r border-border px-4 py-3 text-right align-top font-normal tabular-nums whitespace-nowrap text-muted-foreground last:border-r-0"
                    scope="row"
                  >
                    {rowIndex + 1}
                  </th>
                  {Array.from({ length: columnCount }, (_, columnIndex) => (
                    <td
                      className="min-w-0 overflow-hidden border-b border-r border-border px-4 py-3 align-top text-foreground last:border-r-0"
                      data-csv-cell
                      key={`cell-${rowIndex}-${columnIndex}`}
                    >
                      <div className="h-5 min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        {renderCellValue(currentRow[columnIndex] ?? "")}
                      </div>
                    </td>
                  ))}
                </tr>
                  );
                },
              )}
              {visibleEndIndex < dataRowCount && (
                <tr aria-hidden="true">
                  <td
                    className="border-0 p-0"
                    colSpan={columnCount + 1}
                    style={{
                      height: `${(dataRowCount - visibleEndIndex) * ROW_HEIGHT}px`,
                    }}
                  />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background">
      <Button
        className="active:scale-[0.97] motion-reduce:active:scale-100"
        onClick={handleLoadFile}
        size="lg"
        type="button"
      >
        Load file
      </Button>
      <input
        accept=".csv,text/csv"
        aria-hidden="true"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
    </main>
  );
}
