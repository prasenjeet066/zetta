import fs from 'node:fs';
import path from 'node:path';
import { parseZetta } from './parser.js';
import { renderComponent } from './runtime.js';

function usage() {
  console.log('Zetta CLI');
  console.log('Usage: zetta run <file> [--props JSON]');
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) { usage(); process.exit(1); }
  const cmd = argv[0];
  if (cmd === 'run') {
    const file = argv[1];
    if (!file) { usage(); process.exit(1); }
    const idxProps = argv.indexOf('--props');
    const props = idxProps !== -1 ? JSON.parse(argv[idxProps + 1]) : {};
    const abs = path.resolve(file);
    const source = fs.readFileSync(abs, 'utf8');
    const ast = parseZetta(source);
    const out = renderComponent(ast, props);
    console.log(out);
    return;
  }
  usage(); process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

