'use strict';

const { TokenType } = require('./token');
const AST = require('./ast');
const { Environment, newEnclosedEnvironment } = require('./environment');
const { IntegerObj, FloatObj, StringObj, BooleanObj, NullObj, ReturnValue, FunctionObj, ArrayObj, HashObj } = require('./object');

const NULL = new NullObj();
const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);

function evalProgram(program, env) {
  let result = NULL;
  for (const stmt of program.statements) {
    result = evalNode(stmt, env);
    if (result instanceof ReturnValue) return result.value;
  }
  return result;
}

function evalNode(node, env) {
  if (node instanceof AST.Program) return evalProgram(node, env);
  if (node instanceof AST.ExpressionStatement) return evalNode(node.expression, env);
  if (node instanceof AST.IntegerLiteral) return new IntegerObj(node.value);
  if (node instanceof AST.FloatLiteral) return new FloatObj(node.value);
  if (node instanceof AST.StringLiteral) return new StringObj(node.value);
  if (node instanceof AST.BooleanLiteral) return nativeBool(node.value);
  if (node instanceof AST.PrefixExpression) return evalPrefixExpression(node.operator, node.right, env);
  if (node instanceof AST.InfixExpression) return evalInfixExpression(node.operator, node.left, node.right, env);
  if (node instanceof AST.BlockStatement) return evalBlockStatement(node, env);
  if (node instanceof AST.IfExpression) return evalIfExpression(node, env);
  if (node instanceof AST.LetStatement) {
    const val = evalNode(node.value, env);
    env.set(node.name.value, val);
    return val;
  }
  if (node instanceof AST.Identifier) return evalIdentifier(node, env);
  if (node instanceof AST.ReturnStatement) {
    const val = evalNode(node.returnValue, env);
    return new ReturnValue(val);
  }
  if (node instanceof AST.FunctionLiteral) {
    return new FunctionObj(node.parameters, node.body, env);
  }
  if (node instanceof AST.CallExpression) {
    const fn = evalNode(node.func, env);
    const args = node.arguments.map(a => evalNode(a, env));
    return applyFunction(fn, args);
  }
  if (node instanceof AST.ArrayLiteral) {
    const elements = node.elements.map(e => evalNode(e, env));
    return new ArrayObj(elements);
  }
  if (node instanceof AST.IndexExpression) {
    return evalIndexExpression(node, env);
  }
  if (node instanceof AST.HashLiteral) {
    const pairs = new Map();
    for (const [kNode, vNode] of node.pairs.entries()) {
      const key = evalNode(kNode, env);
      const value = evalNode(vNode, env);
      const hashKey = hashableKey(key);
      if (hashKey == null) continue;
      pairs.set(hashKey, { key, value });
    }
    return new HashObj(pairs);
  }
  return NULL;
}

function evalPrefixExpression(operator, rightNode, env) {
  const right = evalNode(rightNode, env);
  switch (operator) {
    case '!': return evalBangOperatorExpression(right);
    case '-': return evalMinusPrefixOperatorExpression(right);
    default: return NULL;
  }
}

function evalBangOperatorExpression(right) {
  if (right === TRUE) return FALSE;
  if (right === FALSE) return TRUE;
  if (right instanceof NullObj) return TRUE;
  return FALSE;
}

function evalMinusPrefixOperatorExpression(right) {
  if (right instanceof IntegerObj) {
    return new IntegerObj(-right.value);
  }
  if (right instanceof FloatObj) {
    return new FloatObj(-right.value);
  }
  return NULL;
}

function evalInfixExpression(operator, leftNode, rightNode, env) {
  const left = evalNode(leftNode, env);
  const right = evalNode(rightNode, env);
  // Handle numeric operations (integers and floats)
  if ((left instanceof IntegerObj || left instanceof FloatObj) && 
      (right instanceof IntegerObj || right instanceof FloatObj)) {
    const leftVal = left.value;
    const rightVal = right.value;
    const isFloat = left instanceof FloatObj || right instanceof FloatObj;
    
    switch (operator) {
      case '+': 
        const sum = leftVal + rightVal;
        return isFloat ? new FloatObj(sum) : new IntegerObj(sum);
      case '-': 
        const diff = leftVal - rightVal;
        return isFloat ? new FloatObj(diff) : new IntegerObj(diff);
      case '*': 
        const product = leftVal * rightVal;
        return isFloat ? new FloatObj(product) : new IntegerObj(product);
      case '/': 
        const quotient = leftVal / rightVal;
        return isFloat ? new FloatObj(quotient) : new IntegerObj(Math.trunc(quotient));
      case '<': return nativeBool(leftVal < rightVal);
      case '>': return nativeBool(leftVal > rightVal);
      case '==': return nativeBool(leftVal === rightVal);
      case '!=': return nativeBool(leftVal !== rightVal);
      default: return NULL;
    }
  }
  if (operator === '==') return nativeBool(left.inspect() === right.inspect());
  if (operator === '!=') return nativeBool(left.inspect() !== right.inspect());
  if (operator === '+') {
    if (left instanceof StringObj && right instanceof StringObj) return new StringObj(left.value + right.value);
  }
  return NULL;
}

function evalIndexExpression(node, env) {
  const left = evalNode(node.left, env);
  const index = evalNode(node.index, env);
  if (left instanceof ArrayObj && (index instanceof IntegerObj || index instanceof FloatObj)) {
    const idx = Math.floor(index.value);
    if (idx < 0 || idx >= left.elements.length) return NULL;
    return left.elements[idx];
  }
  if (left instanceof HashObj) {
    const key = hashableKey(index);
    if (key == null) return NULL;
    const pair = left.pairs.get(key);
    return pair ? pair.value : NULL;
  }
  return NULL;
}

function hashableKey(obj) {
  if (obj instanceof IntegerObj) return `I:${obj.value}`;
  if (obj instanceof FloatObj) return `F:${obj.value}`;
  if (obj instanceof BooleanObj) return `B:${obj.value}`;
  if (obj instanceof StringObj) return `S:${obj.value}`;
  return null;
}

function evalBlockStatement(block, env) {
  let result = NULL;
  for (const stmt of block.statements) {
    result = evalNode(stmt, env);
    if (result instanceof ReturnValue) return result;
  }
  return result;
}

function evalIfExpression(iff, env) {
  const condition = evalNode(iff.condition, env);
  if (isTruthy(condition)) return evalNode(iff.consequence, env);
  if (iff.alternative) return evalNode(iff.alternative, env);
  return NULL;
}

function isTruthy(obj) {
  if (obj instanceof NullObj) return false;
  if (obj === TRUE) return true;
  if (obj === FALSE) return false;
  if (obj instanceof IntegerObj) return obj.value !== 0;
  if (obj instanceof FloatObj) return obj.value !== 0;
  if (obj instanceof StringObj) return obj.value.length > 0;
  return true;
}

function evalIdentifier(ident, env) {
  const val = env.get(ident.value);
  if (val !== undefined) return val;
  return NULL;
}

function applyFunction(fn, args) {
  if (fn instanceof FunctionObj) {
    const extendedEnv = extendFunctionEnv(fn, args);
    const evaluated = evalNode(fn.body, extendedEnv);
    if (evaluated instanceof ReturnValue) return evaluated.value;
    return evaluated;
  }
  if (fn && fn.type === 'BUILTIN' && fn.fn) {
    return fn.fn(args);
  }
  if (typeof fn === 'function') {
    return fn(args);
  }
  return NULL;
}

function extendFunctionEnv(fn, args) {
  const env = newEnclosedEnvironment(fn.env);
  for (let i = 0; i < fn.parameters.length; i += 1) {
    env.set(fn.parameters[i].value, args[i] ?? NULL);
  }
  return env;
}

function nativeBool(input) { return input ? TRUE : FALSE; }

// builtins
const builtins = {
  print: function(args) {
    const out = args.map(a => a.inspect()).join(' ');
    console.log(out.replace(/^\"|\"$/g, ''));
    return NULL;
  },
  len: function(args) {
    if (args.length !== 1) return NULL;
    const arg = args[0];
    if (arg instanceof StringObj) return new IntegerObj(arg.value.length);
    if (arg instanceof ArrayObj) return new IntegerObj(arg.elements.length);
    return NULL;
  },
  first: function(args) {
    if (args.length !== 1) return NULL;
    const arr = args[0];
    if (!(arr instanceof ArrayObj)) return NULL;
    return arr.elements[0] ?? NULL;
  },
  last: function(args) {
    if (args.length !== 1) return NULL;
    const arr = args[0];
    if (!(arr instanceof ArrayObj)) return NULL;
    return arr.elements[arr.elements.length - 1] ?? NULL;
  },
  rest: function(args) {
    if (args.length !== 1) return NULL;
    const arr = args[0];
    if (!(arr instanceof ArrayObj)) return NULL;
    if (arr.elements.length <= 1) return new ArrayObj([]);
    return new ArrayObj(arr.elements.slice(1));
  },
  push: function(args) {
    if (args.length !== 2) return NULL;
    const arr = args[0];
    if (!(arr instanceof ArrayObj)) return NULL;
    const el = args[1];
    return new ArrayObj(arr.elements.concat([el]));
  },
  type: function(args) {
    if (args.length !== 1) return NULL;
    const a = args[0];
    if (a instanceof IntegerObj) return new StringObj('INTEGER');
    if (a instanceof StringObj) return new StringObj('STRING');
    if (a instanceof BooleanObj) return new StringObj('BOOLEAN');
    if (a instanceof ArrayObj) return new StringObj('ARRAY');
    if (a instanceof HashObj) return new StringObj('HASH');
    if (a instanceof NullObj) return new StringObj('NULL');
    return new StringObj('UNKNOWN');
  },
  keys: function(args) {
    if (args.length !== 1) return NULL;
    const h = args[0];
    if (!(h instanceof HashObj)) return NULL;
    const keys = [];
    for (const key of h.pairs.keys()) keys.push(key);
    return new ArrayObj(keys);
  },
  values: function(args) {
    if (args.length !== 1) return NULL;
    const h = args[0];
    if (!(h instanceof HashObj)) return NULL;
    const vals = [];
    for (const pair of h.pairs.values()) vals.push(pair.value);
    return new ArrayObj(vals);
  }
};

module.exports = {
  evalNode,
  evalProgram,
  NULL,
  TRUE,
  FALSE
};

