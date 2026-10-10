// Exact normalized aliases avoid guessing from partial words or cell contents.
export const HEADER_ICON_GROUPS: Array<{ id: string; icon: string; aliases: string[] }> = [
  ['email','EnvelopeSimpleIcon','email|e mail|email address|contact email|work email|business email|primary email|alternate email|secondary email|personal email'],
  ['phone','PhoneIcon','phone|phone number|telephone|telephone number|mobile|mobile number|cell|cell phone|contact number|work phone|business phone|fax|whatsapp'],
  ['website','GlobeIcon','website|web site|site|site url|website url|web address|url|homepage|home page|domain|company website|company domain|business website'],
  ['person','UserIcon','name|full name|person|person name|contact|contact name|customer name|client name|employee name|first name|last name|given name|surname|display name'],
  ['company','BuildingsIcon','company|company name|organization|organisation|organization name|organisation name|business|business name|employer|employer name|account name|legal name'],
  ['role','BriefcaseIcon','job title|title|role|position|occupation|designation|job role|profession|seniority'],
  ['department','UsersThreeIcon','department|team|division|business unit|team name|department name'],
  ['industry','FactoryIcon','industry|sector|business sector|industry type|vertical'],
  ['category','SquaresFourIcon','category|categories|type|record type|segment|classification|class'],
  ['identifier','IdentificationCardIcon','id|identifier|record id|record identifier|customer id|client id|contact id|employee id|user id|account id|external id|unique id|uuid|guid|row id'],
  ['code','BarcodeIcon','code|product code|sku|stock keeping unit|barcode|ean|upc|reference|reference number|reference id|order number|invoice number|tracking number'],
  ['serial','ListNumbersIcon','serial|serial number|row number|index|sequence|number|no'],
  ['address','MapPinIcon','address|street address|street|address line 1|address line 2|mailing address|billing address|shipping address|location'],
  ['city','CityIcon','city|town|municipality|locality'],
  ['region','MapTrifoldIcon','state|province|region|county|district|territory'],
  ['country','FlagIcon','country|country name|country code|nationality'],
  ['postal','MailboxIcon','postal code|postcode|post code|zip|zip code|zipcode|postal'],
  ['latitude','CompassIcon','latitude|lat'],
  ['longitude','CompassIcon','longitude|lon|lng|long'],
  ['coordinates','MapPinLineIcon','coordinates|geo coordinates|geolocation|gps|geo'],
  ['timezone','GlobeHemisphereEastIcon','timezone|time zone|utc offset'],
  ['language','TranslateIcon','language|languages|locale|preferred language|language code'],
  ['birthday','CakeIcon','birthday|birth date|date of birth|dob|birthdate'],
  ['age','HourglassIcon','age|age years|years old'],
  ['date','CalendarBlankIcon','date|signup date|sign up date|registration date|start date|end date|created date|updated date|due date|deadline|renewal date|expiry date|expiration date|purchase date|order date|invoice date|hire date|joined date|date joined'],
  ['timestamp','CalendarCheckIcon','timestamp|created at|updated at|deleted at|last seen|last seen utc|last login|last active|local timestamp|published at|submitted at|modified at|created on|updated on'],
  ['time','ClockIcon','time|meeting time|start time|end time|local time|appointment time'],
  ['duration','TimerIcon','duration|elapsed time|time spent|response time|processing time|runtime|tenure'],
  ['employees','UsersIcon','employee count|employees|headcount|head count|staff count|team size|company size|number of employees|workforce size'],
  ['count','HashIcon','count|quantity|qty|total count|item count|units|number of items|stock|inventory|stock quantity'],
  ['revenue','ChartLineUpIcon','revenue|annual revenue|monthly revenue|sales|total sales|turnover|arr|mrr|gross revenue|net revenue'],
  ['money','CurrencyDollarIcon','amount|price|unit price|cost|unit cost|total|subtotal|balance|budget|salary|wage|income|profit|net profit|gross profit|payment amount|order total|invoice total|spend|expenses'],
  ['currency','CoinsIcon','currency|currency code|payment currency'],
  ['percentage','PercentIcon','percentage|percent|discount|discount percent|discount percentage|tax rate|interest rate|conversion rate|growth rate|margin|profit margin|vat'],
  ['rating','StarIcon','rating|review rating|stars|star rating|average rating|customer rating'],
  ['score','ChartBarIcon','score|lead score|quality score|risk score|confidence|confidence score|priority score|rank|ranking'],
  ['numeric','CalculatorIcon','value|numeric value|number value|scientific number|large integer text|integer|decimal|measurement'],
  ['active','CheckCircleIcon','active|is active|enabled|is enabled|available|is available|in stock'],
  ['verified','SealCheckIcon','verified|is verified|validated|is validated|approved|is approved|confirmed'],
  ['consent','CheckSquareIcon','opt in|opted in|consent|marketing consent|email consent|subscribed|is subscribed|permission|accepted'],
  ['boolean','ToggleLeftIcon','boolean|bool|flag|yes no|true false'],
  ['status','PulseIcon','status|state status|stage|pipeline stage|order status|payment status|lead status|account status|workflow status'],
  ['plan','StackIcon','plan|subscription plan|tier|subscription tier|membership|membership level|package'],
  ['tags','TagIcon','tags|tag|labels|label|keywords|interests|topics'],
  ['skills','WrenchIcon','skills|skill|skills json|expertise|competencies|specialties|specialities'],
  ['json','BracketsCurlyIcon','json|metadata|metadata json|attributes|properties|payload|configuration|config|settings|structured data'],
  ['ip','NetworkIcon','ip|ip address|ipv4|ipv6|ipv4 address|ipv6 address|host|hostname|server address'],
  ['color','PaletteIcon','color|colour|hex|hex color|hex colour|color code|colour code|hex code|background color'],
  ['file','FileIcon','file|filename|file name|file path|filepath|path|document|document name|document filename|attachment|attachment name|attachment filename'],
  ['folder','FolderIcon','folder|directory|folder path|directory path'],
  ['image','ImageIcon','image|image url|image link|image filename|photo|photo url|picture|picture url|avatar|avatar url|profile image|profile picture|thumbnail|thumbnail url|logo|logo url|cover image'],
  ['video','VideoCameraIcon','video|video url|video link|movie|clip|recording url'],
  ['audio','MusicNoteIcon','audio|audio url|music|sound|podcast|recording'],
  ['notes','NoteIcon','notes|note|comments|comment|remarks|description|summary|bio|biography|about|details|long text'],
  ['link','LinkIcon','link|source url|source link|reference url|profile url|profile link|social url|social link'],
  ['source','DatabaseIcon','source|data source|origin|source name|source system|provider|provenance'],
  ['owner','UserCircleIcon','owner|assigned to|assignee|account owner|sales rep|representative|manager|created by|updated by|author'],
  ['priority','FlagPennantIcon','priority|urgency|severity|importance'],
  ['product','PackageIcon','product|product name|item|item name|goods|merchandise'],
  ['order','ShoppingCartIcon','order|order id|purchase|purchase id|cart|cart id'],
  ['invoice','ReceiptIcon','invoice|invoice id|receipt|receipt id|bill|bill id'],
  ['payment','CreditCardIcon','payment|payment id|payment method|billing method|transaction|transaction id'],
  ['bank','BankIcon','bank|bank name|bank account|account number|iban|swift|routing number'],
  ['shipping','TruckIcon','shipping|shipping method|carrier|delivery|delivery method|shipping cost|delivery date'],
  ['tracking','NavigationArrowIcon','tracking|tracking url|shipment|shipment id'],
  ['weight','ScalesIcon','weight|mass|weight kg|weight lbs|net weight|gross weight'],
  ['dimensions','RulerIcon','dimensions|length|width|height|depth|size|distance|area'],
  ['temperature','ThermometerIcon','temperature|temp|celsius|fahrenheit'],
  ['education','GraduationCapIcon','education|degree|qualification|school|university|college|graduation year'],
  ['experience','MedalIcon','experience|years of experience|experience years|certification|certifications|credentials'],
  ['project','KanbanIcon','project|project name|project id|task|task name|task id|milestone'],
  ['event','CalendarStarIcon','event|event name|event id|appointment|meeting|meeting title'],
  ['ticket','TicketIcon','ticket|ticket id|support ticket|issue|issue id|case id'],
  ['campaign','MegaphoneIcon','campaign|campaign name|campaign id|marketing channel|ad campaign'],
  ['channel','BroadcastIcon','channel|medium|acquisition channel|contact channel'],
  ['visits','EyeIcon','views|page views|impressions|visits|sessions|visitors|unique visitors'],
  ['clicks','CursorClickIcon','clicks|click count|ctr|click through rate'],
  ['conversion','FunnelIcon','conversions|conversion count|leads|lead count|opportunities'],
  ['followers','UsersFourIcon','followers|follower count|connections|subscribers|subscriber count'],
  ['social','ShareNetworkIcon','social|social media|social handle|username|user name|handle|twitter|x handle|linkedin|instagram|facebook|tiktok|github'],
  ['security','ShieldCheckIcon','security|permissions|access level|access role|privacy|visibility'],
  ['password','LockKeyIcon','password|secret|token|api key|access token|auth token'],
  ['version','GitBranchIcon','version|revision|release|branch|commit|commit hash'],
  ['platform','DesktopIcon','platform|operating system|os|device|device type|browser|user agent'],
  ['storage','HardDriveIcon','storage|file size|bytes|disk space|capacity'],
  ['urlmetric','GaugeIcon','speed|performance|latency|throughput|uptime'],
  ['nullable','MinusCircleIcon','nullable value|null value|missing value'],
  ['mixed','ShuffleIcon','mixed value|mixed type|mixed data'],
  ['test','TestTubeIcon','edge case|test case|test result|test status|sample|sample id'],
].map(([id, icon, aliases]) => ({ id, icon, aliases: aliases.split('|') }));

export function normalizeHeader(header: string): string {
  return header.normalize('NFKC')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .toLowerCase().replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

const aliasGroups = new Map<string, string>();
const groupIcons = new Map<string, string>();
for (const group of HEADER_ICON_GROUPS) {
  groupIcons.set(`concept:${group.id}`, group.icon);
  for (const alias of group.aliases) {
    const key = normalizeHeader(alias);
    if (aliasGroups.has(key)) throw new Error(`Duplicate header icon alias: ${alias}`);
    aliasGroups.set(key, `concept:${group.id}`);
  }
}

export type HeaderIconPreferences = {
  icons: Record<string, string>;
  aliases: Record<string, string>;
};
export const EMPTY_HEADER_ICON_PREFERENCES: HeaderIconPreferences = { icons: {}, aliases: {} };

export function getHeaderConcept(header: string, preferences: HeaderIconPreferences): string {
  const normalized = normalizeHeader(header);
  return (Object.hasOwn(preferences.aliases, normalized) ? preferences.aliases[normalized] : undefined) ?? aliasGroups.get(normalized) ?? `header:${normalized}`;
}

export function resolveHeaderIcon(header: string, preferences: HeaderIconPreferences): string {
  if (!normalizeHeader(header)) return 'CircleIcon';
  const concept = getHeaderConcept(header, preferences);
  return (Object.hasOwn(preferences.icons, concept) ? preferences.icons[concept] : undefined) ?? groupIcons.get(concept) ?? 'CircleIcon';
}

export function assignHeaderIcon(header: string, icon: string, preferences: HeaderIconPreferences): HeaderIconPreferences {
  return { ...preferences, icons: { ...preferences.icons, [getHeaderConcept(header, preferences)]: icon } };
}

export function addHeaderSynonyms(header: string, synonyms: string[], preferences: HeaderIconPreferences): HeaderIconPreferences {
  const concept = getHeaderConcept(header, preferences);
  const aliases = { ...preferences.aliases };
  for (const synonym of synonyms) {
    const normalized = normalizeHeader(synonym);
    if (normalized) aliases[normalized] = concept;
  }
  return { ...preferences, aliases };
}

export function getHeaderSynonyms(header: string, preferences: HeaderIconPreferences): string[] {
  const concept = getHeaderConcept(header, preferences);
  const group = HEADER_ICON_GROUPS.find((item) => `concept:${item.id}` === concept);
  return [...new Set([...(group?.aliases ?? []).filter((alias) => getHeaderConcept(alias, preferences) === concept), ...Object.keys(preferences.aliases).filter((alias) => preferences.aliases[alias] === concept)])];
}
