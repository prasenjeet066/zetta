'use strict';

const { TokenType, lookupIdent } = require('./token');

class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.readPosition = 0;
    this.ch = '';
    this._readChar();
  }

  _readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = '\0';
    } else {
      this.ch = this.input[this.readPosition];
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
      // line comments //...
      if (this.ch === '/' && this._peekChar() === '/') {
        while (this.ch !== '\n' && this.ch !== '\0') this._readChar();
      }
      if (this.ch === ' ' || this.ch === '\t' || this.ch === '\n' || this.ch === '\r') {
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
    while (/[0-9]/.test(this.ch)) {
      this._readChar();
    }
    return this.input.slice(start, this.position);
  }

  _readString() {
    this._readChar(); // consume opening quote
    const start = this.position;
    while (this.ch !== '"' && this.ch !== '\0') {
      if (this.ch === '\\' && ['"', '\\', 'n', 't', 'r'].includes(this._peekChar())) {
        this._readChar();
      }
      this._readChar();
    }
    const raw = this.input.slice(start, this.position);
    this._readChar(); // closing quote
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
          const ch = this.ch; this._readChar();
          tok = { type: TokenType.EQ, literal: ch + this.ch };
          this._readChar();
          return tok;
        }
        tok = { type: TokenType.ASSIGN, literal: this.ch }; this._readChar(); return tok;
      case ';': tok = { type: TokenType.SEMICOLON, literal: this.ch }; this._readChar(); return tok;
      case ',': tok = { type: TokenType.COMMA, literal: this.ch }; this._readChar(); return tok;
      case ':': tok = { type: TokenType.COLON, literal: this.ch }; this._readChar(); return tok;
      case '+': tok = { type: TokenType.PLUS, literal: this.ch }; this._readChar(); return tok;
      case '-': tok = { type: TokenType.MINUS, literal: this.ch }; this._readChar(); return tok;
      case '!':
        if (this._peekChar() === '=') {
          const ch = this.ch; this._readChar();
          tok = { type: TokenType.NOT_EQ, literal: ch + this.ch };
          this._readChar();
          return tok;
        }
        tok = { type: TokenType.BANG, literal: this.ch }; this._readChar(); return tok;
      case '/':
        // if next is /, it will be consumed by _skipWhitespace next time
        tok = { type: TokenType.SLASH, literal: this.ch }; this._readChar(); return tok;
      case '*': tok = { type: TokenType.ASTERISK, literal: this.ch }; this._readChar(); return tok;
      case '<': tok = { type: TokenType.LT, literal: this.ch }; this._readChar(); return tok;
      case '>': tok = { type: TokenType.GT, literal: this.ch }; this._readChar(); return tok;
      case '(': tok = { type: TokenType.LPAREN, literal: this.ch }; this._readChar(); return tok;
      case ')': tok = { type: TokenType.RPAREN, literal: this.ch }; this._readChar(); return tok;
      case '{': tok = { type: TokenType.LBRACE, literal: this.ch }; this._readChar(); return tok;
      case '}': tok = { type: TokenType.RBRACE, literal: this.ch }; this._readChar(); return tok;
      case '[': tok = { type: TokenType.LBRACKET, literal: this.ch }; this._readChar(); return tok;
      case ']': tok = { type: TokenType.RBRACKET, literal: this.ch }; this._readChar(); return tok;
      case '"':
        return { type: TokenType.STRING, literal: this._readString() };
      case '\0':
        return { type: TokenType.EOF, literal: '' };
      default:
        if (/[a-zA-Z_]/.test(this.ch)) {
          const ident = this._readIdentifier();
          return { type: lookupIdent(ident), literal: ident };
        }
        if (/[0-9]/.test(this.ch)) {
          const num = this._readNumber();
          return { type: TokenType.INT, literal: num };
        }
        tok = { type: TokenType.ILLEGAL, literal: this.ch };
        this._readChar();
        return tok;
    }
  }
}

module.exports = { Lexer };

