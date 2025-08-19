// Very small renderer: turns <tag attr="...">text{expr}</tag> into HTML string

export function renderComponent(ast, props = {}) {
  if (ast.type !== 'Component') throw new Error('Unsupported AST');
  const html = renderJSX(ast.jsx, props);
  return html;
}

function renderJSX(jsx, props) {
  // Replace simple {props.foo} occurrences
  let out = jsx.replace(/\{\s*props\.(\w+)\s*\}/g, (_, key) => escapeHtml(String(props[key] ?? '')));
  // Replace className="..." with class="..."
  out = out.replace(/className=/g, 'class=');
  // Replace self-closing tags normalization (no-op here)
  // Minimal sanitization for attributes and text is done via escapeHtml on insertions only
  return out;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

