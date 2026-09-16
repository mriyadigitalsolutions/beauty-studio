#!/usr/bin/env node
/**
 * Prints what the studio owner still has to fill in inside
 * `config/studio.config.ts`. Always exits with 0: an unfilled field is a
 * to-do, not a broken build.
 */
import { isPlaceholder, studio } from '../config/studio.config.ts';

const missing = [];
const filled = [];

function walk(value, path) {
  if (typeof value === 'string') {
    const target = value.trim() === '' || isPlaceholder(value) ? missing : filled;
    target.push({ path, value });
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      missing.push({ path, value: '(пустой список — блок скрыт)' });
      return;
    }
    value.forEach((item, index) => walk(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key);
    return;
  }
  filled.push({ path, value: String(value) });
}

walk(studio, '');

const width = missing.reduce((max, item) => Math.max(max, item.path.length), 0);

console.log('\nconfig/studio.config.ts — что осталось вписать\n');

if (missing.length === 0) {
  console.log('  Всё заполнено. Заглушек не осталось.\n');
} else {
  for (const item of missing) {
    console.log(`  ${item.path.padEnd(width)}  ${item.value}`);
  }
  console.log(`\n  Осталось полей: ${missing.length}. Заполнено: ${filled.length}.`);
  console.log('  Пока поле не заполнено, на сайте видна заглушка, а пустой блок скрыт.\n');
}

process.exit(0);
