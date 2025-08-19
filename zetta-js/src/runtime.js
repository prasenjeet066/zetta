import { parseComponent, renderComponentAst } from './component.js';

export function renderComponent(ast, props = {}) {
	if (ast.type === 'Raw') {
		const comp = parseComponent(ast.source);
		return renderComponentAst(comp, props, defaultBuiltins());
	}
	if (ast.type === 'Component') {
		return renderComponentAst(ast, props, defaultBuiltins());
	}
	throw new Error('Unsupported AST');
}

function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function defaultBuiltins() {
	return {
		upper: (s) => String(s).toUpperCase(),
		lower: (s) => String(s).toLowerCase(),
		join: (arr, sep = ',') => Array.isArray(arr) ? arr.join(sep) : String(arr),
	};
}