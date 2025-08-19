// Extremely small prototype: parses a single `component Name(props) { return (<...>); }`

export function parseZetta(source) {
  // naive extraction
  const compMatch = source.match(/component\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}$/m);
  if (!compMatch) throw new Error('Only single component supported in prototype');
  const name = compMatch[1];
  const body = compMatch[2];
  const returnMatch = body.match(/return\s*\((([\s\S]*))\)\s*;/m);
  if (!returnMatch) throw new Error('Expected return (...) in component');
  const jsx = returnMatch[1].trim();
  return { type: 'Component', name, jsx };
}

