const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const source = fs.readFileSync('src/lib/header-icons.ts', 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const api = context.exports;
const empty = api.EMPTY_HEADER_ICON_PREFERENCES;

test('all registered aliases resolve to existing icons without collisions', () => {
  const registry = fs.readFileSync('src/lib/phosphor-icon-registry.ts', 'utf8');
  let count = 0;
  for (const group of api.HEADER_ICON_GROUPS) {
    assert.ok(registry.includes(`"${group.icon}"`), group.icon);
    for (const alias of group.aliases) {
      assert.equal(api.resolveHeaderIcon(alias, empty), group.icon, alias);
      count++;
    }
  }
  console.log(`${api.HEADER_ICON_GROUPS.length} concepts, ${count} aliases verified`);
});

test('header normalization handles casing, punctuation, camelCase, and Unicode', () => {
  for (const header of ['EMAIL_ADDRESS', 'Email-Address', '  email address ', 'emailAddress', 'Ｅｍａｉｌ Ａｄｄｒｅｓｓ']) {
    assert.equal(api.resolveHeaderIcon(header, empty), 'EnvelopeSimpleIcon');
  }
  assert.equal(api.resolveHeaderIcon('e-mail', empty), 'EnvelopeSimpleIcon');
});

test('unknown, blank, and misleading partial headers stay circles', () => {
  for (const header of ['', '   ', 'email delivery notes', 'age verification details', 'constructor', '__proto__', 'unmapped field']) {
    assert.equal(api.resolveHeaderIcon(header, empty), 'CircleIcon', header);
  }
});

test('manual choices carry across built-in synonyms and survive serialization', () => {
  const preferences = api.assignHeaderIcon('Contact Number', 'CircleIcon', empty);
  assert.equal(api.resolveHeaderIcon('phone', preferences), 'CircleIcon');
  assert.equal(api.resolveHeaderIcon('mobile_number', JSON.parse(JSON.stringify(preferences))), 'CircleIcon');
  assert.equal(api.resolveHeaderIcon('email', preferences), 'EnvelopeSimpleIcon');
  assert.equal(Object.keys(empty.icons).length, 0);
});

test('custom synonyms share future changes and can explicitly replace mappings', () => {
  let preferences = api.addHeaderSynonyms('phone', ['Office Line', 'Custom Contact', ''], empty);
  assert.equal(api.resolveHeaderIcon('office_line', preferences), 'PhoneIcon');
  preferences = api.assignHeaderIcon('customContact', 'AddressBookIcon', preferences);
  assert.equal(api.resolveHeaderIcon('telephone', preferences), 'AddressBookIcon');
  preferences = api.addHeaderSynonyms('email', ['office line'], preferences);
  assert.equal(api.resolveHeaderIcon('office line', preferences), 'EnvelopeSimpleIcon');
});

test('unknown custom concepts support synonyms and reset to the fallback', () => {
  let preferences = api.assignHeaderIcon('Client handle', 'UserIcon', empty);
  preferences = api.addHeaderSynonyms('Client handle', ['Preferred Handle'], preferences);
  assert.equal(api.resolveHeaderIcon('preferred_handle', preferences), 'UserIcon');
  delete preferences.icons[api.getHeaderConcept('preferred handle', preferences)];
  assert.equal(api.resolveHeaderIcon('Client handle', preferences), 'CircleIcon');
});
