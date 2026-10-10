"use client";
import { useMemo, useState } from 'react';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { ColumnFilterContent } from '@/components/column-filter-content';
import { FunnelIcon } from '@phosphor-icons/react/Funnel';
import { newRule, type Column, type FilterNode, type Group, type View } from '@/lib/dataset-view';

function containsColumn(node:FilterNode,column:number):boolean{return node.kind==='rule'?node.column===column:node.children.some(n=>containsColumn(n,column));}
function removeColumn(group:Group,column:number):Group{return {...group,children:group.children.filter(n=>n.kind!=='rule'||n.column!==column).map(n=>n.kind==='group'?removeColumn(n,column):n).filter(n=>n.kind!=='group'||n.children.length>0)};}

export function ColumnFilter({column,rows,view,onChange}:{column:Column;columns:Column[];rows:string[][];view:View;onChange:(v:View)=>void}){
  const [open,setOpen]=useState(false);
  const [tab,setTab]=useState('conditions');
  const [search,setSearch]=useState('');
  const id=`column-${column.index}`;
  const existing=view.filters.children.find(n=>n.kind==='group'&&n.id===id) as Group|undefined;
  const group:Group=existing??{id,kind:'group',mode:'and',children:[]};
  const active=containsColumn(view.filters,column.index);
  const sort=view.sorts.find(s=>s.column===column.index);
  const type=view.types[column.index]??column.type;
  const distinct=useMemo(()=>{if(!open)return [];const counts=new Map<string,number>();for(const row of rows.slice(1)){const v=row[column.index]??'';counts.set(v,(counts.get(v)??0)+1);}return [...counts].sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true}));},[rows,column.index,open]);
  const quickId=`values-${column.index}`;
  const quick=group.children.find(n=>n.kind==='rule'&&n.id===quickId);
  let selected:string[]|null=null;
  if(quick?.kind==='rule'&&quick.op==='any'){try{const values=JSON.parse(quick.value);if(Array.isArray(values)&&values.every(v=>typeof v==='string'))selected=values;}catch{/* Editable conditions may use newline-separated values. */}}
  function updateGroup(next:Group){let root=view.filters;if(root.mode==='or'&&root.children.length)root={...root,mode:'and',children:[{...root,id:crypto.randomUUID()}]};const children=root.children.filter(n=>n.id!==id);onChange({...view,filters:{...root,children:next.children.length?[...children,next]:children}});}
  function setValues(values:string[]|null){let children=group.children.filter(n=>n.id!==quickId);if(group.mode==='or'&&children.length)children=[{...group,id:crypto.randomUUID(),children}];updateGroup({...group,mode:'and',children:values===null?children:[...children,{...newRule(column.index),id:quickId,op:'any',value:JSON.stringify(values),caseSensitive:true}]});}
  function setSort(direction:'asc'|'desc'|null){const sorts=view.sorts.filter(s=>s.column!==column.index);onChange({...view,sorts:direction?(sort?view.sorts.map(s=>s.column===column.index?{...s,direction}:s):[...sorts,{column:column.index,direction,blanks:'last'}]):sorts});}
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label={`Filter ${column.label}`} title={`Filter and sort ${column.label}`} className={`ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-md opacity-0 pointer-events-none outline-none transition-[opacity,background-color] duration-150 group-hover/header:opacity-100 group-hover/header:pointer-events-auto group-focus-within/header:opacity-100 group-focus-within/header:pointer-events-auto aria-expanded:opacity-100 aria-expanded:pointer-events-auto hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto ${active||sort?'text-primary':'text-muted-foreground'}`}>
        <FunnelIcon color="black" size={16} weight="regular" aria-hidden="true" />
        {sort && <span className="text-[10px]" aria-hidden="true">{sort.direction==='asc'?'↑':'↓'}</span>}
      </PopoverTrigger>
      <ColumnFilterContent column={column} view={view} group={group} type={type} sort={sort} active={active} tab={tab} setTab={setTab} search={search} setSearch={setSearch} distinct={distinct} selected={selected} setValues={setValues} setSort={setSort} updateGroup={updateGroup} onChange={onChange} onClear={() => onChange({...view,filters:removeColumn(view.filters,column.index)})} onClose={() => setOpen(false)} />
    </Popover>
  );
}
