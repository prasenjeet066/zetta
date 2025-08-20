'use strict';

const readline = require('readline');
const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Environment } = require('./environment');
const { evalProgram } = require('./evaluator');

function startRepl() {
  const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout, 
    prompt: 'sprout> ' 
  });
  
  const env = new Environment();
  
  // Add some built-in functions
  addBuiltins(env);
  
  console.log('Welcome to Sprout! A tiny interpreted language.');
  console.log('Type "exit" or press Ctrl+C to quit.');
  console.log('');
  
  rl.prompt();
  
  rl.on('line', (line) => {
    const trimmedLine = line.trim();
    
    // Handle exit command
    if (trimmedLine === 'exit' || trimmedLine === 'quit') {
      rl.close();
      return;
    }
    
    // Skip empty lines
    if (trimmedLine === '') {
      rl.prompt();
      return;
    }
    
    try {
      const lexer = new Lexer(trimmedLine);
      const parser = new Parser(lexer);
      const program = parser.parseProgram();
      
      if (parser.errors.length > 0) {
        console.log('Parser errors:');
        parser.errors.forEach(e => console.log('\t' + e));
      } else {
        const result = evalProgram(program, env);
        if (result && result.inspect) {
          const out = result.inspect();
          if (out !== 'null') {
            console.log(out.replace(/^\"|\"$/g, ''));
          }
        }
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    rl.prompt();
  }).on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
  });
}

function addBuiltins(env) {
  // Add some basic built-in functions
  const builtins = {
    'len': {
      type: 'BUILTIN',
      fn: (args) => {
        if (args.length !== 1) {
          return { type: 'ERROR', message: 'wrong number of arguments for len()' };
        }
        const arg = args[0];
        if (arg.type === 'STRING') {
          return { type: 'INTEGER', value: arg.value.length };
        } else if (arg.type === 'ARRAY') {
          return { type: 'INTEGER', value: arg.elements.length };
        } else {
          return { type: 'ERROR', message: 'argument to len() not supported' };
        }
      }
    },
    'print': {
      type: 'BUILTIN',
      fn: (args) => {
        args.forEach(arg => {
          if (arg.inspect) {
            process.stdout.write(arg.inspect().replace(/^\"|\"$/g, ''));
          } else {
            process.stdout.write(String(arg));
          }
        });
        process.stdout.write('\n');
        return { type: 'NULL' };
      }
    }
  };
  
  // Register built-ins in environment
  Object.entries(builtins).forEach(([name, builtin]) => {
    env.set(name, builtin);
  });
}

module.exports = { startRepl };

