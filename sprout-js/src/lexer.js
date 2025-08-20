'use strict';

const { TokenType, lookupIdent } = require('./token');

class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.readPosition = 0;
    this.ch = '';
    this.line = 1;
    this.column = 0;
    this._readChar();
  }

  _readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = '\0';
    } else {
      this.ch = this.input[this.readPosition];
      if (this.ch === '\n') {
        this.line++;
        this.column = 0;
      } else {
        this.column++;
      }
    }
    this.position = this.readPosition;
    this.readPosition += 1;
  }

  _peekChar() {
    if (this.readPosition >= this.input.length) return '\0';
    return this.input[this.readPosition];
  }

  _skipWhitespace() {
    while (true) {
      // Handle line comments
      if (this.ch === '/' && this._peekChar() === '/') {
        while (this.ch !== '\n' && this.ch !== '\0') {
          this._readChar();
        }
        // Don't continue here, let the newline be processed normally
      }
      
      if (this.ch === ' ' || this.ch === '\t' || this.ch === '\r' || this.ch === '\n') {
        this._readChar();
        continue;
      }
      break;
    }
  }

  _readIdentifier() {
    const start = this.position;
    while (/[a-zA-Z_0-9]/.test(this.ch)) {
      this._readChar();
    }
    return this.input.slice(start, this.position);
  }

  _readNumber() {
    const start = this.position;
    let hasDecimal = false;
    
    // Read integer part
    while (/[0-9]/.test(this.ch)) {
      this._readChar();
    }
    
    // Check for decimal point
    if (this.ch === '.' && /[0-9]/.test(this._peekChar())) {
      hasDecimal = true;
      this._readChar(); // consume the decimal point
      
      // Read decimal part
      while (/[0-9]/.test(this.ch)) {
        this._readChar();
      }
    }
    
    const numStr = this.input.slice(start, this.position);
    return hasDecimal ? parseFloat(numStr) : parseInt(numStr, 10);
  }

  _readString() {
    this._readChar(); // consume opening quote
    const start = this.position;
    
    while (this.ch !== '"' && this.ch !== '\0') {
      if (this.ch === '\\') {
        const nextChar = this._peekChar();
        if (['"', '\\', 'n', 't', 'r'].includes(nextChar)) {
          this._readChar(); // consume the escape character
        }
      }
      this._readChar();
    }
    
    if (this.ch === '\0') {
      throw new Error(`Unterminated string at line ${this.line}, column ${this.column}`);
    }
    
    const raw = this.input.slice(start, this.position);
    this._readChar(); // consume closing quote
    
    // Decode simple escapes using JSON parse trick
    try {
      return JSON.parse('"' + raw.replace(/"/g, '\\"') + '"');
    } catch (e) {
      return raw;
    }
  }

  nextToken() {
    this._skipWhitespace();

    let tok;
    switch (this.ch) {
      case '=':
        if (this._peekChar() === '=') {
          const ch = this.ch; 
          this._readChar();
          tok = { type: TokenType.EQ, literal: ch + this.ch, line: this.line, column: this.column - 1 };
          this._readChar();
          return tok;
        }
        tok = { type: TokenType.ASSIGN, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case ';': 
        tok = { type: TokenType.SEMICOLON, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case ',': 
        tok = { type: TokenType.COMMA, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case ':': 
        tok = { type: TokenType.COLON, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '+': 
        tok = { type: TokenType.PLUS, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '-': 
        tok = { type: TokenType.MINUS, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '!':
        if (this._peekChar() === '=') {
          const ch = this.ch; 
          this._readChar();
          tok = { type: TokenType.NOT_EQ, literal: ch + this.ch, line: this.line, column: this.column - 1 };
          this._readChar();
          return tok;
        }
        tok = { type: TokenType.BANG, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '/':
        tok = { type: TokenType.SLASH, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '*': 
        tok = { type: TokenType.ASTERISK, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '<': 
        tok = { type: TokenType.LT, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '>': 
        tok = { type: TokenType.GT, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '(': 
        tok = { type: TokenType.LPAREN, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case ')': 
        tok = { type: TokenType.RPAREN, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '{': 
        tok = { type: TokenType.LBRACE, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '}': 
        tok = { type: TokenType.RBRACE, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '[': 
        tok = { type: TokenType.LBRACKET, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case ']': 
        tok = { type: TokenType.RBRACKET, literal: this.ch, line: this.line, column: this.column }; 
        this._readChar(); 
        return tok;
      case '"':
        const strValue = this._readString();
        return { type: TokenType.STRING, literal: strValue, line: this.line, column: this.column - 1 };
      case '\0':
        return { type: TokenType.EOF, literal: '', line: this.line, column: this.column };
      default:
        if (/[a-zA-Z_]/.test(this.ch)) {
          const ident = this._readIdentifier();
          return { 
            type: lookupIdent(ident), 
            literal: ident, 
            line: this.line, 
            column: this.column - ident.length + 1 
          };
        }
        if (/[0-9]/.test(this.ch)) {
          const num = this._readNumber();
          const isFloat = typeof num === 'number' && num % 1 !== 0;
          return { 
            type: isFloat ? TokenType.FLOAT : TokenType.INT, 
            literal: num, 
            line: this.line, 
            column: this.column - String(num).length + 1 
          };
        }
        tok = { 
          type: TokenType.ILLEGAL, 
          literal: this.ch, 
          line: this.line, 
          column: this.column 
        };
        this._readChar();
        return tok;
    }
  }
}

module.exports = { Lexer };

