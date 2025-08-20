# Sprout - A Tiny Interpreted Language

Sprout is a small, educational programming language implemented in JavaScript. It demonstrates the fundamental concepts of language design including lexical analysis, parsing, and interpretation.

## Features

### Data Types
- **Integers**: `42`, `-17`, `0`
- **Floats**: `3.14`, `-2.5`, `0.0`
- **Strings**: `"Hello, World!"`
- **Booleans**: `true`, `false`
- **Arrays**: `[1, 2, 3]`
- **Hashes**: `{"key": "value"}`
- **Functions**: `fn(x, y) { x + y }`

### Operators
- **Arithmetic**: `+`, `-`, `*`, `/`
- **Comparison**: `==`, `!=`, `<`, `>`
- **Logical**: `!` (not)

### Control Structures
- **Conditionals**: `if (condition) { ... } else { ... }`
- **Functions**: `fn name(params) { ... }`
- **Return**: `return value;`

### Built-in Functions
- `len(array_or_string)` - Returns the length of an array or string
- `print(value1, value2, ...)` - Prints values to stdout

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sprout-js

# Install dependencies (optional, for development)
npm install

# Make the executable available globally
npm link
```

### Usage

#### Interactive REPL
```bash
# Start the REPL
sprout

# Or use npm script
npm run repl
```

#### Run from file
```bash
# Create a .sprout file
echo 'let x = 5; print(x + 3);' > example.sprout

# Run it
sprout example.sprout
```

### Examples

#### Basic Arithmetic
```sprout
let x = 10;
let y = 5;
print(x + y);        // 15
print(x - y);        // 5
print(x * y);        // 50
print(x / y);        // 2
```

#### Variables and Assignment
```sprout
let name = "World";
let greeting = "Hello, " + name + "!";
print(greeting);     // Hello, World!
```

#### Functions
```sprout
let add = fn(x, y) {
    return x + y;
};

let result = add(5, 3);
print(result);       // 8
```

#### Conditionals
```sprout
let age = 18;
if (age >= 18) {
    print("Adult");
} else {
    print("Minor");
}
```

#### Arrays
```sprout
let numbers = [1, 2, 3, 4, 5];
let sum = 0;
let i = 0;
while (i < len(numbers)) {
    sum = sum + numbers[i];
    i = i + 1;
}
print(sum);          // 15
```

#### Comments
```sprout
// This is a single-line comment
let x = 5;           // Inline comment
```

## Development

### Project Structure
```
sprout-js/
├── src/
│   ├── lexer.js      # Tokenizes input
│   ├── parser.js     # Builds AST
│   ├── evaluator.js  # Executes AST
│   ├── ast.js        # AST node definitions
│   ├── object.js     # Runtime objects
│   ├── environment.js # Variable scope
│   └── repl.js       # Interactive shell
├── bin/
│   └── sprout        # Executable
├── test/
│   └── run-tests.js  # Test suite
└── package.json
```

### Running Tests
```bash
npm test
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Architecture

1. **Lexer**: Converts source code into tokens
2. **Parser**: Builds an Abstract Syntax Tree (AST)
3. **Evaluator**: Executes the AST
4. **Environment**: Manages variable scope and values

## Language Specification

### Lexical Elements
- **Identifiers**: Start with letter or underscore, followed by letters, digits, or underscores
- **Numbers**: Integer or decimal literals
- **Strings**: Double-quoted with escape sequences (`\"`, `\\`, `\n`, `\t`, `\r`)
- **Comments**: Single-line comments starting with `//`

### Grammar
The language follows a simple expression-based grammar with statements and expressions.

### Error Handling
- Lexical errors include unterminated strings and invalid characters
- Parser errors include syntax violations
- Runtime errors include type mismatches and undefined variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

This project is inspired by the "Writing An Interpreter In Go" book and similar educational language implementations. It's designed to be simple enough to understand in a few hours while demonstrating real language implementation concepts.