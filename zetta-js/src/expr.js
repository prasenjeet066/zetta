// Tiny expression tokenizer, parser (Pratt), and evaluator for Zetta { ... } slots

export function parseExpression(input) {
  const lexer = new ExprLexer(input);
  const parser = new ExprParser(lexer);
  return parser.parseExpression(Precedence.LOWEST);
}

export function evalExpression(ast, env) {
  switch (ast.type) {
    case 'NumberLiteral': return ast.value;
    case 'StringLiteral': return ast.value;
    case 'BooleanLiteral': return ast.value;
    case 'Identifier': {
      if (ast.name in env) return env[ast.name];
      return undefined;
    }
    case 'UnaryExpr': {
      const v = evalExpression(ast.right, env);
      if (ast.op === '!') return !truthy(v);
      if (ast.op === '-') return -Number(v);
      return undefined;
    }
    case 'BinaryExpr': {
      const l = evalExpression(ast.left, env);
      const r = evalExpression(ast.right, env);
      switch (ast.op) {
        case '+': return (isString(l) || isString(r)) ? String(l) + String(r) : Number(l) + Number(r);
        case '-': return Number(l) - Number(r);
        case '*': return Number(l) * Number(r);
        case '/': return Number(l) / Number(r);
        case '==': return l === r;
        case '!=': return l !== r;
        case '<': return Number(l) < Number(r);
        case '<=': return Number(l) <= Number(r);
        case '>': return Number(l) > Number(r);
        case '>=': return Number(l) >= Number(r);
        case '&&': return truthy(l) ? r : l;
        case '||': return truthy(l) ? l : r;
        default: return undefined;
      }
    }
    case 'ConditionalExpr': {
      const c = evalExpression(ast.test, env);
      return truthy(c) ? evalExpression(ast.consequent, env) : evalExpression(ast.alternate, env);
    }
    case 'MemberExpr': {
      const obj = evalExpression(ast.object, env);
      const prop = ast.computed ? evalExpression(ast.property, env) : ast.property.name;
      if (obj == null) return undefined;
      return obj[prop];
    }
    case 'CallExpr': {
      const callee = evalExpression(ast.callee, env);
      const args = ast.args.map(a => evalExpression(a, env));
      if (typeof callee === 'function') return callee.apply(null, args);
      return undefined;
    }
    default:
      return undefined;
  }
}

function isString(v) { return typeof v === 'string'; }
function truthy(v) { return !!v; }

// Lexer
class ExprLexer {
  constructor(input) {
    this.s = input;
    this.i = 0;
    this.ch = '';
    this._read();
  }
  _read() {
    this.ch = this.i < this.s.length ? this.s[this.i++] : '\0';
  }
  _peek() { return this.i < this.s.length ? this.s[this.i] : '\0'; }
  _skipWS() { while (/\s/.test(this.ch)) this._read(); }
  next() {
    this._skipWS();
    const start = this.i - 1;
    switch (this.ch) {
      case '\0': return { type: 'eof', value: '' };
      case '(':
      case ')':
      case '[':
      case ']':
      case ',':
      case '.': { const c = this.ch; this._read(); return { type: c, value: c }; }
      case '?': case ':': { const c = this.ch; this._read(); return { type: c, value: c }; }
      case '+': case '*': case '/': { const c = this.ch; this._read(); return { type: c, value: c }; }
      case '-': {
        const c = this.ch; this._read(); return { type: '-', value: '-' };
      }
      case '!': {
        if (this._peek() === '=') { this._read(); this._read(); return { type: '!=', value: '!=' }; }
        this._read(); return { type: '!', value: '!' };
      }
      case '=': {
        if (this._peek() === '=') { this._read(); this._read(); return { type: '==', value: '==' }; }
        this._read(); return { type: '=', value: '=' };
      }
      case '<': {
        if (this._peek() === '=') { this._read(); this._read(); return { type: '<=', value: '<=' }; }
        this._read(); return { type: '<', value: '<' };
      }
      case '>': {
        if (this._peek() === '=') { this._read(); this._read(); return { type: '>=', value: '>=' }; }
        this._read(); return { type: '>', value: '>' };
      }
      case '&': if (this._peek() === '&') { this._read(); this._read(); return { type: '&&', value: '&&' }; } break;
      case '|': if (this._peek() === '|') { this._read(); this._read(); return { type: '||', value: '||' }; } break;
      case '"': case '\'': {
        const quote = this.ch; this._read();
        let buf = '';
        while (this.ch !== quote && this.ch !== '\0') {
          if (this.ch === '\\') { const n = this._peek(); this._read(); buf += escapeChar(n); this._read(); continue; }
          buf += this.ch; this._read();
        }
        this._read();
        return { type: 'string', value: buf };
      }
      default:
        if (/[0-9]/.test(this.ch)) {
          let num = this.ch; this._read();
          while (/[0-9]/.test(this.ch)) { num += this.ch; this._read(); }
          if (this.ch === '.') { num += this.ch; this._read(); while (/[0-9]/.test(this.ch)) { num += this.ch; this._read(); } }
          return { type: 'number', value: Number(num) };
        }
        if (/[a-zA-Z_]/.test(this.ch)) {
          let id = this.ch; this._read();
          while (/[a-zA-Z0-9_]/.test(this.ch)) { id += this.ch; this._read(); }
          if (id === 'true' || id === 'false') return { type: 'boolean', value: id === 'true' };
          return { type: 'ident', value: id };
        }
    }
    throw new Error('Unexpected char in expression at ' + (this.i - 1) + ': ' + this.ch);
  }
}

function escapeChar(n) {
  switch (n) {
    case 'n': return '\n';
    case 't': return '\t';
    case 'r': return '\r';
    case '"': return '"';
    case '\'': return '\'';
    case '\\': return '\\';
    default: return n;
  }
}

const Precedence = {
  LOWEST: 1,
  CONDITIONAL: 2, // ? :
  OR: 3,
  AND: 4,
  EQUALITY: 5,
  RELATIONAL: 6,
  SUM: 7,
  PRODUCT: 8,
  PREFIX: 9,
  CALL: 10,
  MEMBER: 11,
};

class ExprParser {
  constructor(lexer) {
    this.l = lexer;
    this.cur = this.l.next();
    this.peek = this.l.next();
  }
  _next() { this.cur = this.peek; this.peek = this.l.next(); }
  parseExpression(precedence) {
    let left = this.parsePrefix();
    while (true) {
      // handle postfix immediately when current token is postfix operator
      if (this.cur.type === '(' || this.cur.type === '[' || this.cur.type === '.') {
        left = this.parsePostfix(left);
        continue;
      }
      const nextPrec = this.peekPrecedence();
      if (this.peek.type === 'eof' || precedence >= nextPrec) break;
      this._next();
      left = this.parseInfix(left);
    }
    return left;
  }
  parsePrefix() {
    switch (this.cur.type) {
      case 'number': { const n = this.cur.value; this._next(); return { type: 'NumberLiteral', value: n }; }
      case 'string': { const s = this.cur.value; this._next(); return { type: 'StringLiteral', value: s }; }
      case 'boolean': { const b = this.cur.value; this._next(); return { type: 'BooleanLiteral', value: b }; }
      case 'ident': { const n = this.cur.value; this._next(); return { type: 'Identifier', name: n }; }
      case '!': { this._next(); const right = this.parseExpression(Precedence.PREFIX); return { type: 'UnaryExpr', op: '!', right }; }
      case '-': { this._next(); const right = this.parseExpression(Precedence.PREFIX); return { type: 'UnaryExpr', op: '-', right }; }
      case '(': {
        this._next();
        const expr = this.parseExpression(Precedence.LOWEST);
        if (this.cur.type !== ')') throw new Error('Expected )');
        this._next();
        return expr;
      }
      default: throw new Error('Unexpected token in expression: ' + this.cur.type);
    }
  }
  parseInfix(left) {
    switch (this.cur.type) {
      case '+': case '-': case '*': case '/': case '==': case '!=': case '<': case '<=': case '>': case '>=': case '&&': case '||': {
        const op = this.cur.type; this._next();
        const right = this.parseExpression(this.curPrecedence(op));
        return { type: 'BinaryExpr', op, left, right };
      }
      case '?': {
        // conditional
        this._next();
        const consequent = this.parseExpression(Precedence.LOWEST);
        if (this.cur.type !== ':') throw new Error('Expected : in conditional');
        this._next();
        const alternate = this.parseExpression(Precedence.LOWEST);
        return { type: 'ConditionalExpr', test: left, consequent, alternate };
      }
      default: throw new Error('Unexpected infix token: ' + this.cur.type);
    }
  }
  parsePostfix(left) {
    switch (this.cur.type) {
      case '(':
        const args = [];
        if (this.peek.type !== ')') {
          this._next();
          args.push(this.parseExpression(Precedence.LOWEST));
          while (this.cur.type === ',' ) { this._next(); args.push(this.parseExpression(Precedence.LOWEST)); }
        } else {
          this._next();
        }
        if (this.cur.type !== ')') throw new Error('Expected ) after args');
        this._next();
        return { type: 'CallExpr', callee: left, args };
      case '[':
        this._next();
        const prop = this.parseExpression(Precedence.LOWEST);
        if (this.cur.type !== ']') throw new Error('Expected ]');
        this._next();
        return { type: 'MemberExpr', object: left, property: prop, computed: true };
      case '.':
        this._next();
        if (this.cur.type !== 'ident') throw new Error('Expected identifier after .');
        const name = { type: 'Identifier', name: this.cur.value };
        this._next();
        return { type: 'MemberExpr', object: left, property: name, computed: false };
      default: return left;
    }
  }
  peekPrecedence() { return precedenceOf(this.peek.type); }
  curPrecedence(op) { return precedenceOf(op); }
}

function precedenceOf(tok) {
  switch (tok) {
    case '.': return Precedence.MEMBER;
    case '(': case '[': return Precedence.CALL;
    case '*': case '/': return Precedence.PRODUCT;
    case '+': case '-': return Precedence.SUM;
    case '<': case '<=': case '>': case '>=': return Precedence.RELATIONAL;
    case '==': case '!=': return Precedence.EQUALITY;
    case '&&': return Precedence.AND;
    case '||': return Precedence.OR;
    case '?': return Precedence.CONDITIONAL;
    default: return Precedence.LOWEST;
  }
}

