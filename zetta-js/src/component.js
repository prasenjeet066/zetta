// Parse a component with optional state and a return JSX
import { parseJSX, renderJSXTree } from './jsx.js';
import { parseExpression, evalExpression } from './expr.js';

export function parseComponent(source) {
  const compMatch = source.match(/component\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}$/m);
  if (!compMatch) throw new Error('Only single component is supported');
  const name = compMatch[1];
  const body = compMatch[2];
  // state lines: state name = expr
  const state = {};
  const effects = [];
  const stateRe = /state\s+(\w+)(?::\s*[A-Za-z0-9_\[\]| ]+)?\s*=\s*(.*)/g;
  let m;
  while ((m = stateRe.exec(body)) !== null) {
    state[m[1]] = parseExpression(m[2]);
  }
  const effectRe = /effect\s+onMount\(\)\s*\{([\s\S]*?)\}/g;
  while ((m = effectRe.exec(body)) !== null) {
    effects.push(m[1].trim());
  }
  const returnMatch = body.match(/return\s*\((([\s\S]*))\)\s*;/m);
  if (!returnMatch) throw new Error('Expected return (...)');
  const jsxAst = parseJSX(returnMatch[1]);
  return { type: 'Component', name, state, effects, jsxAst };
}

export function renderComponentAst(ast, props = {}, builtins = {}) {
  const env = { props, ...builtins };
  const state = {};
  for (const [k, vAst] of Object.entries(ast.state)) {
    state[k] = evalExpression(vAst, env);
  }
  env.state = state;
  // env may receive components and renderNested via builtins
  return renderJSXTree(ast.jsxAst, env);
}

// Multi-component module parsing with brace matching
export function parseModule(source, loadImport, baseDir = '.') {
  const registry = new Map();
  let i = 0;
  const s = source;
  const len = s.length;
  while (i < len) {
    const idx = s.indexOf('component', i);
    if (idx === -1) break;
    // ensure word boundary
    if (idx > 0 && /[A-Za-z0-9_]/.test(s[idx - 1])) { i = idx + 9; continue; }
    let j = idx + 'component'.length;
    // read name
    while (j < len && /\s/.test(s[j])) j++;
    let name = '';
    while (j < len && /[A-Za-z0-9_]/.test(s[j])) { name += s[j++]; }
    while (j < len && /\s/.test(s[j])) j++;
    if (s[j] !== '(') { i = j + 1; continue; }
    // skip params parens
    let paren = 0;
    while (j < len) {
      if (s[j] === '(') paren++;
      else if (s[j] === ')') { paren--; if (paren === 0) { j++; break; } }
      j++;
    }
    while (j < len && /\s/.test(s[j])) j++;
    if (s[j] !== '{') { i = j + 1; continue; }
    // capture body with brace counting
    let k = j;
    let brace = 0;
    while (k < len) {
      if (s[k] === '{') brace++;
      else if (s[k] === '}') { brace--; if (brace === 0) { k++; break; } }
      k++;
    }
    const body = s.slice(j + 1, k - 1);
    const comp = parseComponent('component ' + name + '() {' + body + '}');
    registry.set(name, comp);
    i = k;
  }
  return { type: 'Module', components: registry };
}

export function renderModuleComponent(moduleAst, name, props = {}, builtins = {}) {
  const comp = moduleAst.components.get(name);
  if (!comp) throw new Error('Component not found: ' + name);
  const withComponents = {
    ...builtins,
    components: moduleAst.components,
  };
  withComponents.renderNested = (nestedComp, nestedProps) => renderComponentAst(nestedComp, nestedProps, withComponents);
  return renderComponentAst(comp, props, withComponents);
}

