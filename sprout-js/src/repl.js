'use strict';

const readline = require('readline');
const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Environment } = require('./environment');
const { evalProgram } = require('./evaluator');

function startRepl() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'sprout> ' });
  const env = new Environment();
  rl.prompt();
  rl.on('line', (line) => {
    try {
      const lexer = new Lexer(line);
      const parser = new Parser(lexer);
      const program = parser.parseProgram();
      if (parser.errors.length > 0) {
        console.log('Parser errors:');
        parser.errors.forEach(e => console.log('\t' + e));
      } else {
        const result = evalProgram(program, env);
        if (result && result.inspect) {
          const out = result.inspect();
          if (out !== 'null') console.log(out.replace(/^\"|\"$/g, ''));
        }
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
    rl.prompt();
  }).on('close', () => {
    console.log('Bye.');
    process.exit(0);
  });
}

module.exports = { startRepl };

