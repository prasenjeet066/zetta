#!/usr/bin/env node

'use strict';

const { Lexer } = require('../src/lexer');
const { Parser } = require('../src/parser');
const { Environment } = require('../src/environment');
const { evalProgram } = require('../src/evaluator');

let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name, testFn) {
  testCount++;
  try {
    testFn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failCount++;
  }
}

function expect(value) {
  return {
    toBe: (expected) => {
      if (value !== expected) {
        throw new Error(`Expected ${expected}, but got ${value}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(value)}`);
      }
    },
    toBeInstanceOf: (constructor) => {
      if (!(value instanceof constructor)) {
        throw new Error(`Expected instance of ${constructor.name}, but got ${typeof value}`);
      }
    }
  };
}

// Test lexer
test('Lexer - basic tokens', () => {
  const lexer = new Lexer('let x = 5;');
  const tokens = [];
  let token;
  do {
    token = lexer.nextToken();
    tokens.push(token);
  } while (token.type !== 'EOF');
  
  expect(tokens.length).toBe(6);
  expect(tokens[0].type).toBe('LET');
  expect(tokens[1].type).toBe('IDENT');
  expect(tokens[2].type).toBe('=');
  expect(tokens[3].type).toBe('INT');
  expect(tokens[4].type).toBe(';');
  expect(tokens[5].type).toBe('EOF');
});

test('Lexer - decimal numbers', () => {
  const lexer = new Lexer('3.14');
  const token = lexer.nextToken();
  expect(token.type).toBe('FLOAT');
  expect(token.literal).toBe(3.14);
});

test('Lexer - line comments', () => {
  const lexer = new Lexer('// This is a comment\n5');
  const token = lexer.nextToken();
  expect(token.type).toBe('INT');
  expect(token.literal).toBe(5);
});

// Test parser
test('Parser - let statement', () => {
  const lexer = new Lexer('let x = 5;');
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  
  expect(program.statements.length).toBe(1);
  expect(program.statements[0].constructor.name).toBe('LetStatement');
  expect(parser.errors.length).toBe(0);
});

test('Parser - float literal', () => {
  const lexer = new Lexer('3.14');
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  
  expect(program.statements.length).toBe(1);
  expect(program.statements[0].expression.constructor.name).toBe('FloatLiteral');
  expect(program.statements[0].expression.value).toBe(3.14);
});

// Test evaluator
test('Evaluator - integer arithmetic', () => {
  const env = new Environment();
  const lexer = new Lexer('5 + 3');
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  const result = evalProgram(program, env);
  
  expect(result.type()).toBe('INTEGER');
  expect(result.value).toBe(8);
});

test('Evaluator - float arithmetic', () => {
  const env = new Environment();
  const lexer = new Lexer('3.5 + 2.5');
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  const result = evalProgram(program, env);
  
  expect(result.type()).toBe('FLOAT');
  expect(result.value).toBe(6.0);
});

test('Evaluator - mixed arithmetic', () => {
  const env = new Environment();
  const lexer = new Lexer('5 + 2.5');
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  const result = evalProgram(program, env);
  
  expect(result.type()).toBe('FLOAT');
  expect(result.value).toBe(7.5);
});

test('Evaluator - let statement', () => {
  const env = new Environment();
  const lexer = new Lexer('let x = 10; x');
  const parser = new Parser(lexer);
  const program = parser.parseProgram();
  const result = evalProgram(program, env);
  
  expect(result.type()).toBe('INTEGER');
  expect(result.value).toBe(10);
});

// Test environment
test('Environment - variable storage', () => {
  const env = new Environment();
  env.set('x', 5);
  const value = env.get('x');
  expect(value).toBe(5);
});

test('Environment - outer scope', () => {
  const outer = new Environment();
  outer.set('x', 5);
  const inner = new Environment(outer);
  const value = inner.get('x');
  expect(value).toBe(5);
});

console.log('\nTest Results:');
console.log(`Total: ${testCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failCount === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}