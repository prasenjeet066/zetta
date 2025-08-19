'use strict';

class Node {
  tokenLiteral() { return ''; }
  toString() { return ''; }
}

class Statement extends Node {}
class Expression extends Node {}

class Program extends Node {
  constructor() { super(); this.statements = []; }
  tokenLiteral() { return this.statements.length > 0 ? this.statements[0].tokenLiteral() : ''; }
  toString() { return this.statements.map(s => s.toString()).join(''); }
}

class Identifier extends Expression {
  constructor(token, value) { super(); this.token = token; this.value = value; }
  tokenLiteral() { return this.token.literal; }
  toString() { return this.value; }
}

class LetStatement extends Statement {
  constructor(token, name, value) { super(); this.token = token; this.name = name; this.value = value; }
  tokenLiteral() { return this.token.literal; }
  toString() { return `${this.tokenLiteral()} ${this.name.toString()} = ${this.value ? this.value.toString() : ''};`; }
}

class ReturnStatement extends Statement {
  constructor(token, returnValue) { super(); this.token = token; this.returnValue = returnValue; }
  tokenLiteral() { return this.token.literal; }
  toString() { return `${this.tokenLiteral()} ${this.returnValue ? this.returnValue.toString() : ''};`; }
}

class ExpressionStatement extends Statement {
  constructor(token, expression) { super(); this.token = token; this.expression = expression; }
  tokenLiteral() { return this.token.literal; }
  toString() { return this.expression ? this.expression.toString() : ''; }
}

class IntegerLiteral extends Expression {
  constructor(token, value) { super(); this.token = token; this.value = value; }
  tokenLiteral() { return this.token.literal; }
  toString() { return String(this.value); }
}

class StringLiteral extends Expression {
  constructor(token, value) { super(); this.token = token; this.value = value; }
  tokenLiteral() { return this.token.literal; }
  toString() { return JSON.stringify(this.value); }
}

class BooleanLiteral extends Expression {
  constructor(token, value) { super(); this.token = token; this.value = value; }
  tokenLiteral() { return this.token.literal; }
  toString() { return String(this.value); }
}

class PrefixExpression extends Expression {
  constructor(token, operator, right) { super(); this.token = token; this.operator = operator; this.right = right; }
  tokenLiteral() { return this.token.literal; }
  toString() { return `(${this.operator}${this.right.toString()})`; }
}

class InfixExpression extends Expression {
  constructor(token, left, operator, right) { super(); this.token = token; this.left = left; this.operator = operator; this.right = right; }
  tokenLiteral() { return this.token.literal; }
  toString() { return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`; }
}

class BlockStatement extends Statement {
  constructor(token, statements) { super(); this.token = token; this.statements = statements || []; }
  tokenLiteral() { return this.token.literal; }
  toString() { return this.statements.map(s => s.toString()).join(''); }
}

class IfExpression extends Expression {
  constructor(token, condition, consequence, alternative) { super(); this.token = token; this.condition = condition; this.consequence = consequence; this.alternative = alternative; }
  tokenLiteral() { return this.token.literal; }
  toString() {
    let out = `if ${this.condition.toString()} ${this.consequence.toString()}`;
    if (this.alternative) out += ` else ${this.alternative.toString()}`;
    return out;
  }
}

class FunctionLiteral extends Expression {
  constructor(token, parameters, body) { super(); this.token = token; this.parameters = parameters || []; this.body = body; }
  tokenLiteral() { return this.token.literal; }
  toString() { return `${this.tokenLiteral()}(${this.parameters.map(p => p.toString()).join(', ')}) ${this.body.toString()}`; }
}

class CallExpression extends Expression {
  constructor(token, func, args) { super(); this.token = token; this.func = func; this.arguments = args || []; }
  tokenLiteral() { return this.token.literal; }
  toString() { return `${this.func.toString()}(${this.arguments.map(a => a.toString()).join(', ')})`; }
}

module.exports = {
  Program,
  Identifier,
  LetStatement,
  ReturnStatement,
  ExpressionStatement,
  IntegerLiteral,
  StringLiteral,
  BooleanLiteral,
  PrefixExpression,
  InfixExpression,
  BlockStatement,
  IfExpression,
  FunctionLiteral,
  CallExpression
};

