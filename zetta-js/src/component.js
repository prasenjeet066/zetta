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
  const stateRe = /state\s+(\w+)\s*=\s*(.*)/g;
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
  return renderJSXTree(ast.jsxAst, env);
}

