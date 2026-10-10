"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FilterSelect({ value, options, onChange, label, className, invalid = false }: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  invalid?: boolean;
}) {
  return (
    <Select value={value} items={options} onValueChange={(next) => { if (next !== null) onChange(next); }}>
      <SelectTrigger aria-label={label} aria-invalid={invalid || undefined} className={`h-8 w-full text-[13px] ${className ?? ""}`}>
        <SelectValue>{options.find(option => option.value === value)?.label ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectGroup>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup>
      </SelectContent>
    </Select>
  );
}
