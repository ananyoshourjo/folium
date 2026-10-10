export type ColumnType = 'text' | 'number' | 'date' | 'boolean';
export type Rule = { id: string; kind: 'rule'; column: number; op: string; value: string; second: string; caseSensitive: boolean };
export type Group = { id: string; kind: 'group'; mode: 'and' | 'or'; children: FilterNode[] };
export type FilterNode = Rule | Group;
export type Sort = { column: number; direction: 'asc' | 'desc'; blanks: 'first' | 'last' };
export type View = { search: string; searchColumn: number; exactSearch: boolean; caseSensitive: boolean; filters: Group; sorts: Sort[]; types: Record<number, ColumnType>; hidden: number[] };
export type Column = { index: number; key: string; label: string; type: ColumnType };
export const freshView = (): View => ({ search: '', searchColumn: -1, exactSearch: false, caseSensitive: false, filters: { id: 'root', kind: 'group', mode: 'and', children: [] }, sorts: [], types: {}, hidden: [] });
export const OPERATORS: Record<string, string> = {
  contains: 'Contains', notContains: 'Does not contain', equals: 'Equals', notEquals: 'Does not equal', starts: 'Starts with', ends: 'Ends with', regex: 'Matches regex', any: 'Is any of', none: 'Is none of',
  gt: 'Greater than', gte: 'At least', lt: 'Less than', lte: 'At most', between: 'Between', before: 'Before', after: 'After', recent: 'Within last N days',
  true: 'Is true', false: 'Is false', empty: 'Is empty', notEmpty: 'Is not empty', validEmail: 'Valid email format', invalidEmail: 'Invalid email format', validUrl: 'Valid website format', invalidUrl: 'Invalid website format', domain: 'Has domain', tagsAny: 'Has any tags', tagsAll: 'Has all tags', duplicate: 'Is duplicated', unique: 'Is unique', invalidType: 'Invalid for column type',
};
export function operatorsFor(type: ColumnType): string[] {
  const shared = ['equals','notEquals','any','none','empty','notEmpty','duplicate','unique'];
  if (type === 'number') return [...shared,'gt','gte','lt','lte','between','invalidType'];
  if (type === 'date') return [...shared,'before','after','between','recent','invalidType'];
  if (type === 'boolean') return [...shared,'true','false','invalidType'];
  return ['contains','notContains','starts','ends','regex',...shared,'validEmail','invalidEmail','validUrl','invalidUrl','domain','tagsAny','tagsAll'];
}
export function numberValue(value: string): number | null {
  const text = value.trim();
  if (!text || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null;
  const n = Number(text); return Number.isFinite(n) ? n : null;
}
export function dateValue(value: string): number | null {
  const text = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(text);
  if (!match) return null;
  const dateOnly = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  if (dateOnly.getUTCFullYear() !== +match[1] || dateOnly.getUTCMonth()+1 !== +match[2] || dateOnly.getUTCDate() !== +match[3]) return null;
  const n = Date.parse(text.length === 10 ? `${text}T00:00:00Z` : /(?:Z|[+-]\d{2}:\d{2})$/.test(text) ? text : `${text}Z`);
  return Number.isFinite(n) ? n : null;
}
export function booleanValue(value: string): boolean | null {
  if (/^(true|yes|1)$/i.test(value.trim())) return true;
  if (/^(false|no|0)$/i.test(value.trim())) return false;
  return null;
}
export function inferType(values: string[], label: string): ColumnType {
  const sample = values.filter(v => v.trim()).slice(0,500);
  if (!sample.length) return 'text';
  if (sample.every(v => booleanValue(v) !== null) && (sample.some(v => /^(true|false|yes|no)$/i.test(v.trim())) || /\b(active|verified|enabled|consent|opt.?in|boolean)\b/i.test(label))) return 'boolean';
  if (sample.every(v => dateValue(v) !== null)) return 'date';
  // IDs and postal codes remain text; leading zeros are meaningful.
  if (!/\b(id|code|postal|zip|phone|uuid|sku)\b/i.test(label) && !sample.some(v => /^[+-]?0\d/.test(v.trim())) && sample.every(v => numberValue(v) !== null)) return 'number';
  return 'text';
}
export function describeColumns(rows: string[][]): Column[] {
  const count = rows.reduce((n,r) => Math.max(n,r.length),0);
  const occurrences = new Map<string,number>();
  return Array.from({length:count},(_,index) => {
    const label = rows[0]?.[index] || `Column ${index+1}`;
    const normalized = label.normalize('NFKC').toLowerCase().replace(/[\s_-]+/g,' ').trim();
    const occurrence = occurrences.get(normalized) ?? 0; occurrences.set(normalized,occurrence+1);
    return {index,label,key:JSON.stringify([normalized,occurrence]),type:inferType(rows.slice(1).map(r=>r[index]??''),label)};
  });
}
export function newRule(column = 0): Rule { return {id:crypto.randomUUID(),kind:'rule',column,op:'contains',value:'',second:'',caseSensitive:false}; }
export function newGroup(): Group { return {id:crypto.randomUUID(),kind:'group',mode:'and',children:[]}; }
export function ruleNeedsValue(op: string): boolean { return !['true','false','empty','notEmpty','validEmail','invalidEmail','validUrl','invalidUrl','duplicate','unique','invalidType'].includes(op); }
function website(value: string): URL | null {
  try { const u = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); return /^(https?:)$/.test(u.protocol) && !u.username && !u.password && /^[a-z\d.-]+\.(?:[a-z]{2,63}|xn--[a-z\d-]+)$/i.test(u.hostname) && !/\s/.test(value) ? u : null; } catch { return null; }
}
export function ruleError(rule: Rule, type: ColumnType): string | null {
  if (ruleNeedsValue(rule.op) && !rule.value.trim()) return 'Enter a value';
  if (rule.op === 'regex') { try { new RegExp(rule.value,rule.caseSensitive?'':'i'); } catch { return 'Invalid regular expression'; } }
  const numeric = ['gt','gte','lt','lte'];
  if (['equals','notEquals'].includes(rule.op)) {
    if(type==='number'&&numberValue(rule.value)===null)return 'Enter a valid number';
    if(type==='date'&&dateValue(rule.value)===null)return 'Use YYYY-MM-DD';
    if(type==='boolean'&&booleanValue(rule.value)===null)return 'Use true, false, yes, no, 1, or 0';
  }
  if (numeric.includes(rule.op) && numberValue(rule.value) === null) return 'Enter a valid number';
  if (['before','after'].includes(rule.op) && dateValue(rule.value) === null) return 'Use YYYY-MM-DD';
  if (rule.op === 'recent' && (numberValue(rule.value) === null || Number(rule.value) < 0)) return 'Enter a non-negative number of days';
  if (rule.op === 'between') {
    const parse = type === 'date' ? dateValue : numberValue;
    const a=parse(rule.value), b=parse(rule.second);
    if (a === null || b === null) return type==='date'?'Enter two ISO dates':'Enter two numbers';
    if (a>b) return 'Lower bound must come first';
  }
  return null;
}
export function getViewErrors(view: View, columns: Column[]): string[] {
  const errors: string[]=[];
  const visit=(node:FilterNode) => { if(node.kind==='group') node.children.forEach(visit); else { const col=columns[node.column]; if(!col) errors.push('Missing filter column'); else {const error=ruleError(node,view.types[node.column]??col.type);if(error) errors.push(`${col.label}: ${error}`);} } };
  visit(view.filters);return errors;
}
export function deriveView(rows: string[][], columns: Column[], view: View, now = Date.now()): Array<{row: string[]; sourceIndex:number}> {
  const source = rows.slice(1).map((row,sourceIndex)=>({row,sourceIndex}));
  const counts=new Map<number,Map<string,number>>();
  const countFor=(column:number,value:string)=>{let m=counts.get(column);if(!m){m=new Map();for(const {row} of source){const v=(row[column]??'').trim();m.set(v,(m.get(v)??0)+1);}counts.set(column,m);}return m.get(value)??0;};
  const match=(node:FilterNode,row:string[]):boolean=>{
    if(node.kind==='group') return !node.children.length || (node.mode==='and'?node.children.every(n=>match(n,row)):node.children.some(n=>match(n,row)));
    const type=view.types[node.column]??columns[node.column]?.type??'text';
    if(ruleError(node,type)) return false;
    const raw=(row[node.column]??'').trim(), fold=(s:string)=>node.caseSensitive?s:s.toLowerCase(),v=fold(raw),q=fold(node.value.trim());
    let list:string[];
    try { const json=JSON.parse(node.value);list=Array.isArray(json)&&json.every(v=>typeof v==='string')?json:node.value.split(/\r?\n/).filter(s=>s.trim()); } catch { list=node.value.split(/\r?\n/).filter(s=>s.trim()); }
    const items=list.map(s=>fold(s.trim()));
    const parse=type==='date'?dateValue:numberValue,a=parse(raw),b=parse(node.value);
    switch(node.op){
      case 'empty':return !raw; case 'notEmpty':return !!raw;
      case 'contains':return v.includes(q);case 'notContains':return !v.includes(q);case 'starts':return v.startsWith(q);case 'ends':return v.endsWith(q);
      case 'equals':case 'notEquals':{let equal=v===q;if(type==='number'||type==='date')equal=a!==null&&b!==null&&a===b;else if(type==='boolean')equal=booleanValue(raw)!==null&&booleanValue(node.value)!==null&&booleanValue(raw)===booleanValue(node.value);return node.op==='equals'?equal:!equal;}
      case 'any':return items.includes(v);case 'none':return !items.includes(v);
      case 'regex':return new RegExp(node.value,node.caseSensitive?'':'i').test(raw);
      case 'gt':case 'after':return a!==null&&b!==null&&a>b;case 'gte':return a!==null&&b!==null&&a>=b;
      case 'lt':case 'before':return a!==null&&b!==null&&a<b;case 'lte':return a!==null&&b!==null&&a<=b;
      case 'between':{const upper=parse(node.second);const end=upper!==null&&type==='date'&&node.second.trim().length===10?upper+86400000-1:upper;return a!==null&&b!==null&&end!==null&&a>=b&&a<=end;}
      case 'recent':{const d=dateValue(raw);return d!==null&&d<=now&&d>=now-Number(node.value)*86400000;}
      case 'true':return booleanValue(raw)===true;case 'false':return booleanValue(raw)===false;
      case 'validEmail':return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);case 'invalidEmail':return !!raw&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
      case 'validUrl':return website(raw)!==null;case 'invalidUrl':return !!raw&&website(raw)===null;
      case 'domain':{const host=raw.includes('@')?raw.split('@').at(-1):website(raw)?.hostname;const domain=node.value.trim().toLowerCase().replace(/^@/,'');return !!host&&(host.toLowerCase()===domain||host.toLowerCase().endsWith(`.${domain}`));}
      case 'tagsAny':case 'tagsAll':{const tags=raw.split(/[;,|]/).map(s=>fold(s.trim()));return node.op==='tagsAny'?items.some(i=>tags.includes(i)):items.every(i=>tags.includes(i));}
      case 'duplicate':return !!raw&&countFor(node.column,raw)>1;case 'unique':return !!raw&&countFor(node.column,raw)===1;
      case 'invalidType':return !!raw&&(type==='number'?numberValue(raw)===null:type==='date'?dateValue(raw)===null:type==='boolean'?booleanValue(raw)===null:false);
      default:return false;
    }
  };
  const search=view.caseSensitive?view.search.trim():view.search.trim().toLowerCase();
  const visible=source.filter(({row})=>match(view.filters,row)&&(!search||(view.searchColumn<0?row:[row[view.searchColumn]??'']).some(cell=>{const v=view.caseSensitive?cell:cell.toLowerCase();return view.exactSearch?v.trim()===search:v.includes(search);})));
  const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
  visible.sort((left,right)=>{
    for(const sort of view.sorts){const a=(left.row[sort.column]??'').trim(),b=(right.row[sort.column]??'').trim();if(!a||!b){if(a!==b)return(!a?-1:1)*(sort.blanks==='first'?1:-1);continue;}
      const type=view.types[sort.column]??columns[sort.column]?.type??'text';
      const parse=type==='number'?numberValue:type==='date'?dateValue:type==='boolean'?(s:string)=>{const v=booleanValue(s);return v===null?null:Number(v);}:null;
      let comparison=0;
      if(parse){const av=parse(a),bv=parse(b);if(av===null||bv===null){if(av!==bv)return av===null?1:-1;comparison=collator.compare(a,b);}else comparison=av-bv;}else comparison=collator.compare(a,b);
      if(comparison)return comparison*(sort.direction==='asc'?1:-1);
    }return left.sourceIndex-right.sourceIndex;
  });return visible;
}

export type SavedView={id:string;name:string;keys:string[];view:View;widths:Record<number,number>};
export function restoreView(saved:SavedView,columns:Column[]):{view:View;widths:Record<number,number>;missing:string[]} {
  const mapping=new Map(saved.keys.map((key,index)=>[index,columns.find(c=>c.key===key)?.index]));
  const missing:string[]=[];
  const col=(index:number)=>{const result=mapping.get(index);if(result===undefined){let label='Unknown column';try{label=JSON.parse(saved.keys[index])[0];}catch{/* A damaged saved key must not crash the current dataset. */}missing.push(label);}return result;};
  const node=(n:FilterNode):FilterNode|null=>{if(n.kind==='group'){const children=n.children.map(node).filter((x):x is FilterNode=>x!==null);const match=/^column-(\d+)$/.exec(n.id);const mapped=match?mapping.get(+match[1]):undefined;return {...n,children,id:mapped!==undefined?`column-${mapped}`:n.id};}const column=col(n.column);return column===undefined?null:{...n,column,id:n.id.startsWith('quick-')?`quick-${column}`:n.id.startsWith('values-')?`values-${column}`:n.id};};
  const remapRecord=<T,>(record:Record<number,T>):Record<number,T>=>Object.fromEntries(Object.entries(record).flatMap(([key,v])=>{const i=col(+key);return i===undefined?[]:[[i,v]];}));
  return {view:{...saved.view,filters:node(saved.view.filters) as Group,sorts:saved.view.sorts.flatMap(s=>{const column=col(s.column);return column===undefined?[]:[{...s,column}];}),searchColumn:saved.view.searchColumn<0?-1:col(saved.view.searchColumn)??-1,types:remapRecord(saved.view.types),hidden:saved.view.hidden.flatMap(i=>{const index=col(i);return index===undefined?[]:[index];})},widths:remapRecord(saved.widths),missing:[...new Set(missing)]};
}
