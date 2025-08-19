// Minimal JSX-like parser to a simple tree, with text and expression slots
import { parseExpression, evalExpression } from './expr.js';

export function parseJSX(input) {
  // This is a naive parser handling nested tags, attributes, and {expr} in text/attrs
  const ctx = { s: input, i: 0 };
  const node = parseElement(ctx);
  skipWS(ctx);
  return node;
}

export function renderJSXTree(node, env) {
  if (node.type === 'Text') return escapeHtml(node.value);
  if (node.type === 'Expr') return escapeHtml(String(evalExpression(node.ast, env)));
  const isCustom = /^[A-Z]/.test(node.tag);
  if (isCustom && env.components) {
    // Build props object for custom component
    const props = {};
    for (const [k, v] of Object.entries(node.attrs)) {
      if (/^on[A-Za-z]/.test(k)) continue; // strip events
      if (v == null) continue;
      if (v.type === 'Text') props[k] = v.value;
      else if (v.type === 'Expr') props[k] = evalExpression(v.ast, env);
    }
    const childrenStr = node.children.map(c => renderJSXTree(c, env)).join('');
    props.children = childrenStr;
    const comp = env.components.get(node.tag);
    if (!comp) return '';
    // Render nested component using provided helper
    if (typeof env.renderNested === 'function') {
      return env.renderNested(comp, props);
    }
    return '';
  }
  const attrs = Object.entries(node.attrs).map(([k, v]) => {
    if (v == null) return null;
    if (/^on[A-Za-z]/.test(k)) return null; // strip events
    if (v.type === 'Text') return `${k}="${escapeHtml(v.value)}"`;
    if (v.type === 'Expr') return `${k}="${escapeHtml(String(evalExpression(v.ast, env)))}"`;
    return null;
  }).filter(Boolean).join(' ');
  const children = node.children.map(c => renderJSXTree(c, env)).join('');
  const open = attrs.length ? `<${node.tag} ${attrs}>` : `<${node.tag}>`;
  if (node.selfClosing) return open.replace(/>$/, ' />');
  return `${open}${children}</${node.tag}>`;
}

function parseElement(ctx) {
  skipWS(ctx);
  if (ctx.s[ctx.i] !== '<') {
    return parseTextOrExpr(ctx);
  }
  // <tag ...>
  expect(ctx, '<');
  const tag = readIdent(ctx);
  const attrs = {};
  skipWS(ctx);
  while (ctx.s[ctx.i] !== '>' && ctx.s[ctx.i] !== '/' ) {
    const name = readIdent(ctx);
    skipWS(ctx); expect(ctx, '='); skipWS(ctx);
    let value;
    const isEvent = /^on[A-Za-z]/.test(name);
    if (ctx.s[ctx.i] === '"' || ctx.s[ctx.i] === '\'') {
      const quote = ctx.s[ctx.i++];
      let raw = '';
      while (ctx.s[ctx.i] !== quote) { raw += ctx.s[ctx.i++]; }
      ctx.i++; // closing quote
      value = isEvent ? null : { type: 'Text', value: raw };
    } else if (ctx.s[ctx.i] === '{') {
      if (isEvent) {
        // skip balanced braces without parsing expression
        expect(ctx, '{');
        let depth = 1;
        while (ctx.i < ctx.s.length && depth > 0) {
          const c2 = ctx.s[ctx.i++];
          if (c2 === '{') depth++;
          if (c2 === '}') depth--;
        }
        value = null;
      } else {
        value = parseExprSlot(ctx);
      }
    } else {
      const identVal = readIdent(ctx);
      value = isEvent ? null : { type: 'Text', value: identVal };
    }
    attrs[name === 'className' ? 'class' : name] = value;
    skipWS(ctx);
  }
  if (ctx.s[ctx.i] === '/') {
    expect(ctx, '/'); expect(ctx, '>');
    return { type: 'Element', tag, attrs, children: [], selfClosing: true };
  }
  expect(ctx, '>');
  const children = [];
  while (!(ctx.s[ctx.i] === '<' && ctx.s[ctx.i+1] === '/')) {
    const child = parseElement(ctx);
    if (!child) break;
    children.push(child);
    skipWS(ctx);
  }
  expect(ctx, '<'); expect(ctx, '/');
  const closeTag = readIdent(ctx);
  if (closeTag !== tag) throw new Error('Mismatched closing tag: ' + closeTag + ' for ' + tag);
  expect(ctx, '>');
  return { type: 'Element', tag, attrs, children, selfClosing: false };
}

function parseTextOrExpr(ctx) {
  if (ctx.s[ctx.i] === '{') return parseExprSlot(ctx);
  let text = '';
  while (ctx.i < ctx.s.length && ctx.s[ctx.i] !== '<' && ctx.s[ctx.i] !== '{') {
    text += ctx.s[ctx.i++];
  }
  return { type: 'Text', value: text };
}

function parseExprSlot(ctx) {
  expect(ctx, '{');
  const start = ctx.i;
  let depth = 1;
  while (ctx.i < ctx.s.length && depth > 0) {
    const c = ctx.s[ctx.i++];
    if (c === '{') depth++;
    if (c === '}') depth--;
  }
  const end = ctx.i - 1;
  const exprSrc = ctx.s.slice(start, end);
  const ast = parseExpression(exprSrc);
  return { type: 'Expr', ast };
}

function readIdent(ctx) {
  skipWS(ctx);
  let id = '';
  while (/[a-zA-Z0-9_:-]/.test(ctx.s[ctx.i])) id += ctx.s[ctx.i++];
  return id;
}

function skipWS(ctx) { while (/(\s)/.test(ctx.s[ctx.i])) ctx.i++; }
function expect(ctx, ch) { if (ctx.s[ctx.i] !== ch) throw new Error('Expected ' + ch + ' got ' + ctx.s[ctx.i]); ctx.i++; }

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

