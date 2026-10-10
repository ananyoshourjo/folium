"use client";

import { useId } from "react";
import { PlusIcon } from "@phosphor-icons/react/Plus";
import { TrashIcon } from "@phosphor-icons/react/Trash";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { FilterSelect } from "@/components/filter-select";
import { newGroup, newRule, operatorsFor, OPERATORS, ruleError, ruleNeedsValue, type Column, type FilterNode, type Group, type Rule, type View } from "@/lib/dataset-view";

function FilterRule({ rule, column, view, onChange, onRemove }: {
  rule: Rule; column: Column; view: View; onChange: (rule: Rule) => void; onRemove: () => void;
}) {
  const fieldId = useId();
  const type = view.types[column.index] ?? column.type;
  const error = ruleError(rule, type);
  const multiple = ["any", "none", "tagsAny", "tagsAll"].includes(rule.op);
  const allowed = operatorsFor(type);
  const options = [...new Set([...allowed, rule.op])].map(value => ({ value, label: OPERATORS[value] }));
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <FilterSelect label="Filter condition" value={rule.op} options={options} onChange={op => onChange({ ...rule, op })} className="flex-1" />
        <Button variant="ghost" size="icon" aria-label="Remove filter" onClick={onRemove} className="text-muted-foreground"><TrashIcon /></Button>
      </div>
      {ruleNeedsValue(rule.op) && (
        <FieldGroup className={cn("gap-3", rule.op === "between" && "grid grid-cols-2")}>
          <Field data-invalid={!!error} className="gap-1.5">
            <FieldLabel htmlFor={fieldId}>{rule.op === "between" ? "From" : multiple ? "Values" : "Value"}</FieldLabel>
            {multiple ? (
              <Textarea id={fieldId} aria-label="Filter values" aria-invalid={!!error} aria-describedby={error ? `${fieldId}-error` : undefined} className="min-h-20 resize-y text-[13px]" placeholder="One value per line" value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })} />
            ) : (
              <Input id={fieldId} aria-label="Filter value" aria-invalid={!!error} aria-describedby={error ? `${fieldId}-error` : undefined} className="h-8 text-[13px]" placeholder={type === "date" && rule.op !== "recent" ? "YYYY-MM-DD" : rule.op === "recent" ? "Number of days" : "Enter a value"} value={rule.value} onChange={e => onChange({ ...rule, value: e.target.value })} />
            )}
            {error && <FieldError id={`${fieldId}-error`} role="status">{error}</FieldError>}
          </Field>
          {rule.op === "between" && <Field data-invalid={!!error} className="gap-1.5"><FieldLabel htmlFor={`${fieldId}-upper`}>To</FieldLabel><Input id={`${fieldId}-upper`} aria-label="Upper bound" aria-invalid={!!error} className="h-8" placeholder={type === "date" ? "YYYY-MM-DD" : "Upper bound"} value={rule.second} onChange={e => onChange({ ...rule, second: e.target.value })} /></Field>}
        </FieldGroup>
      )}
      {type === "text" && <Label className="flex w-fit items-center gap-2 text-xs font-normal"><Checkbox checked={rule.caseSensitive} onCheckedChange={caseSensitive => onChange({ ...rule, caseSensitive })} />Case sensitive</Label>}
    </div>
  );
}

export function FilterRules({ group, column, view, onChange, depth = 0, onRemove }: {
  group: Group; column: Column; view: View; onChange: (group: Group) => void; depth?: number; onRemove?: () => void;
}) {
  const type = view.types[column.index] ?? column.type;
  return (
    <div className={cn("flex flex-col gap-3", depth && "rounded-lg border border-border bg-muted/30 p-3")}>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Match</span>
        {onRemove && <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Remove group" onClick={onRemove}><TrashIcon /></Button>}
        <FilterSelect label="Group logic" value={group.mode} options={[{ value: "and", label: "All conditions" }, { value: "or", label: "Any condition" }]} onChange={mode => onChange({ ...group, mode: mode as "and" | "or" })} className="ml-auto w-40" />
      </div>
      {group.children.length === 0 && <Empty className="border border-dashed px-4 py-6"><EmptyHeader><EmptyTitle>No conditions yet</EmptyTitle><EmptyDescription>Add a condition to narrow this column.</EmptyDescription></EmptyHeader></Empty>}
      {group.children.map(node => {
        const update = (next: FilterNode) => onChange({ ...group, children: group.children.map(n => n.id === node.id ? next : n) });
        const remove = () => onChange({ ...group, children: group.children.filter(n => n.id !== node.id) });
        return node.kind === "rule" ? <FilterRule key={node.id} rule={node} column={column} view={view} onChange={update} onRemove={remove} /> : <FilterRules key={node.id} group={node} column={column} view={view} onChange={update} onRemove={remove} depth={depth + 1} />;
      })}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-8" onClick={() => onChange({ ...group, children: [...group.children, { ...newRule(column.index), op: operatorsFor(type)[0] }] })}><PlusIcon data-icon="inline-start" />Add condition</Button>
        {depth < 5 && <Button variant="ghost" className="h-8 text-[13px]" onClick={() => onChange({ ...group, children: [...group.children, newGroup()] })}>Add group</Button>}
      </div>
    </div>
  );
}
