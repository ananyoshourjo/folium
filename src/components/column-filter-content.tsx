"use client";

import { XIcon } from "@phosphor-icons/react/X";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/MagnifyingGlass";
import { ArrowUpIcon } from "@phosphor-icons/react/ArrowUp";
import { ArrowDownIcon } from "@phosphor-icons/react/ArrowDown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { PopoverContent, PopoverTitle } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterSelect } from "@/components/filter-select";
import { FilterRules } from "@/components/filter-rules";
import type { Column, ColumnType, Group, Sort, View } from "@/lib/dataset-view";

export function ColumnFilterContent({ column, view, group, type, sort, active, tab, setTab, search, setSearch, distinct, selected, setValues, setSort, updateGroup, onChange, onClear, onClose }: {
  column: Column; view: View; group: Group; type: ColumnType; sort?: Sort; active: boolean;
  tab: string; setTab: (value: string) => void; search: string; setSearch: (value: string) => void;
  distinct: Array<[string, number]>; selected: string[] | null; setValues: (values: string[] | null) => void;
  setSort: (direction: "asc" | "desc" | null) => void; updateGroup: (group: Group) => void;
  onChange: (view: View) => void; onClear: () => void; onClose: () => void;
}) {
  const displayedValues = distinct.filter(([value]) => value.toLowerCase().includes(search.toLowerCase()));
  return (
    <PopoverContent align="end" sideOffset={8} className="max-h-[min(640px,80vh)] w-[min(400px,calc(100vw-24px))] gap-0 overflow-y-auto p-0">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <PopoverTitle className="min-w-0 flex-1 truncate text-sm font-semibold">{column.label}</PopoverTitle>
        <Button variant="ghost" size="icon" className="-mr-1 text-muted-foreground" aria-label={`Close ${column.label} filters`} onClick={onClose}><XIcon /></Button>
      </div>
      <Tabs value={tab} onValueChange={value => setTab(String(value))} className="gap-0">
        <div className="px-4 pb-4"><TabsList className="w-full"><TabsTrigger value="conditions">Conditions</TabsTrigger><TabsTrigger value="values">Values</TabsTrigger><TabsTrigger value="sort">Sort</TabsTrigger></TabsList></div>
        <Separator />
        <TabsContent value="conditions" className="m-0 flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-4"><Label className="text-xs font-normal text-muted-foreground">Compare as</Label><FilterSelect label={`Type for ${column.label}`} value={view.types[column.index] ?? "auto"} options={[{ value: "auto", label: `Auto (${column.type})` }, ...["text", "number", "date", "boolean"].map(value => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))]} onChange={value => { const types = { ...view.types }; if (value === "auto") delete types[column.index]; else types[column.index] = value as ColumnType; onChange({ ...view, types }); }} className="w-40" /></div>
          <FilterRules group={group} column={column} view={view} onChange={updateGroup} />
        </TabsContent>
        <TabsContent value="values" className="m-0 flex flex-col gap-3 p-4">
          <InputGroup><InputGroupInput aria-label={`Search ${column.label} values`} placeholder="Find values…" value={search} onChange={e => setSearch(e.target.value)} /><InputGroupAddon><MagnifyingGlassIcon /></InputGroupAddon></InputGroup>
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{distinct.length} distinct values</span><div className="flex gap-1"><Button variant="ghost" className="h-8 text-xs" onClick={() => setValues(null)}>Select all</Button><Button variant="ghost" className="h-8 text-xs" onClick={() => setValues([])}>Select none</Button></div></div>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-border p-1">{displayedValues.length ? displayedValues.map(([value, count]) => <Label key={value} className="flex min-h-8 cursor-pointer items-center gap-3 rounded-md px-2 py-2 font-normal hover:bg-muted"><Checkbox checked={selected === null || selected.includes(value)} onCheckedChange={checked => { const current = selected ?? distinct.map(([v]) => v); setValues(checked ? [...current, value] : current.filter(v => v !== value)); }} /><span className="min-w-0 flex-1 truncate text-[13px]" title={value}>{value.trim() ? value : "(Empty)"}</span><span className="text-xs text-muted-foreground tabular-nums">{count}</span></Label>) : <p className="px-3 py-6 text-center text-xs text-muted-foreground">No matching values</p>}</div>
        </TabsContent>
        <TabsContent value="sort" className="m-0 flex flex-col gap-4 p-4">
          <ToggleGroup variant="outline" value={sort ? [sort.direction] : []} onValueChange={values => setSort(values[0] === "asc" ? "asc" : values[0] === "desc" ? "desc" : null)} className="w-full"><ToggleGroupItem value="asc" className="flex-1"><ArrowUpIcon data-icon="inline-start" />{type === "number" ? "Smallest first" : type === "date" ? "Oldest first" : "Ascending"}</ToggleGroupItem><ToggleGroupItem value="desc" className="flex-1"><ArrowDownIcon data-icon="inline-start" />{type === "number" ? "Largest first" : type === "date" ? "Newest first" : "Descending"}</ToggleGroupItem></ToggleGroup>
          {sort ? <><div className="flex items-center justify-between gap-4"><Label className="text-xs font-normal text-muted-foreground">Empty values</Label><FilterSelect label="Empty value placement" value={sort.blanks} options={[{ value: "last", label: "Show last" }, { value: "first", label: "Show first" }]} onChange={blanks => onChange({ ...view, sorts: view.sorts.map(s => s.column === column.index ? { ...s, blanks: blanks as "first" | "last" } : s) })} className="w-40" /></div><div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Priority {view.sorts.findIndex(s => s.column === column.index) + 1} of {view.sorts.length}</span><Button variant="outline" className="h-8 text-xs" onClick={() => onChange({ ...view, sorts: [sort, ...view.sorts.filter(s => s.column !== column.index)] })}>Make primary sort</Button></div><Button variant="ghost" className="h-8 w-full text-xs text-muted-foreground" onClick={() => setSort(null)}>Remove sort</Button></> : <p className="text-xs text-muted-foreground">Choose a direction to sort this column.</p>}
        </TabsContent>
      </Tabs>
      <Separator />
      <div className="flex items-center justify-end px-4 py-3"><Button variant="ghost" className="h-8 text-xs" disabled={!active} onClick={onClear}>Clear filters</Button></div>
    </PopoverContent>
  );
}
