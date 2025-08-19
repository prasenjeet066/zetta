import fs from 'node:fs';
import path from 'node:path';
import { parseZetta } from './parser.js';
import { renderComponent } from './runtime.js';
import { parseModule, renderModuleComponent } from './component.js';

function usage() {
  console.log('Zetta CLI');
  console.log('Usage: zetta run <file> [--props JSON] [--component Name]');
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
    const mod = parseModule(source, (rel, baseDir) => {
      const absImp = path.resolve(path.dirname(abs), rel);
      return { source: fs.readFileSync(absImp, 'utf8'), baseDir: path.dirname(absImp) };
    }, path.dirname(abs));
    const idxComp = argv.indexOf('--component');
    if (idxComp !== -1) {
      const name = argv[idxComp + 1];
      const out = renderModuleComponent(mod, name, props, {});
      console.log(out);
    } else {
      // fallback: try first component found
      const first = mod.components.keys().next().value;
      const out = renderModuleComponent(mod, first, props, {});
      console.log(out);
    }
    return;
  }
  usage(); process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

