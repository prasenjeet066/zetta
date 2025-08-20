'use strict';

const TokenType = {
  ILLEGAL: 'ILLEGAL',
  EOF: 'EOF',

  IDENT: 'IDENT',
  INT: 'INT',
  FLOAT: 'FLOAT',
  STRING: 'STRING',

  ASSIGN: '=',
  PLUS: '+',
  MINUS: '-',
  BANG: '!',
  ASTERISK: '*',
  SLASH: '/',

  LT: '<',
  GT: '>',
  EQ: '==',
  NOT_EQ: '!=',

  COMMA: ',',
  SEMICOLON: ';',
  COLON: ':',

  LPAREN: '(',
  RPAREN: ')',
  LBRACE: '{',
  RBRACE: '}',
  LBRACKET: '[',
  RBRACKET: ']',

  FUNCTION: 'FUNCTION',
  LET: 'LET',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  IF: 'IF',
  ELSE: 'ELSE',
  RETURN: 'RETURN'
};

const KEYWORDS = {
  fn: TokenType.FUNCTION,
  let: TokenType.LET,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  if: TokenType.IF,
  else: TokenType.ELSE,
  return: TokenType.RETURN
};

function lookupIdent(ident) {
  return KEYWORDS[ident] || TokenType.IDENT;
}

module.exports = {
  TokenType,
  KEYWORDS,
  lookupIdent
};

