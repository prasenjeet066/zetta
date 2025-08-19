'use strict';

const { TokenType } = require('./token');
const AST = require('./ast');
const { Environment, newEnclosedEnvironment } = require('./environment');
const { IntegerObj, StringObj, BooleanObj, NullObj, ReturnValue, FunctionObj } = require('./object');

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
  if (!(right instanceof IntegerObj)) return NULL;
  return new IntegerObj(-right.value);
}

function evalInfixExpression(operator, leftNode, rightNode, env) {
  const left = evalNode(leftNode, env);
  const right = evalNode(rightNode, env);
  if (left instanceof IntegerObj && right instanceof IntegerObj) {
    switch (operator) {
      case '+': return new IntegerObj(left.value + right.value);
      case '-': return new IntegerObj(left.value - right.value);
      case '*': return new IntegerObj(left.value * right.value);
      case '/': return new IntegerObj(Math.trunc(left.value / right.value));
      case '<': return nativeBool(left.value < right.value);
      case '>': return nativeBool(left.value > right.value);
      case '==': return nativeBool(left.value === right.value);
      case '!=': return nativeBool(left.value !== right.value);
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
  if (obj instanceof StringObj) return obj.value.length > 0;
  return true;
}

function evalIdentifier(ident, env) {
  const val = env.get(ident.value);
  if (val !== undefined) return val;
  const builtin = builtins[ident.value];
  if (builtin) return builtin;
  return NULL;
}

function applyFunction(fn, args) {
  if (fn instanceof FunctionObj) {
    const extendedEnv = extendFunctionEnv(fn, args);
    const evaluated = evalNode(fn.body, extendedEnv);
    if (evaluated instanceof ReturnValue) return evaluated.value;
    return evaluated;
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
};

module.exports = {
  evalNode,
  evalProgram,
  NULL,
  TRUE,
  FALSE
};

