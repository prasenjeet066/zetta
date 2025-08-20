'use strict';

const { TokenType } = require('./token');
const AST = require('./ast');

const Precedence = {
  LOWEST: 1,
  EQUALS: 2, // ==
  LESSGREATER: 3, // > or <
  SUM: 4, // + -
  PRODUCT: 5, // * /
  PREFIX: 6, // -X !X
  CALL: 7, // myFunction(X)
  INDEX: 8 // arr[0]
};

const precedences = {};
precedences[TokenType.EQ] = Precedence.EQUALS;
precedences[TokenType.NOT_EQ] = Precedence.EQUALS;
precedences[TokenType.LT] = Precedence.LESSGREATER;
precedences[TokenType.GT] = Precedence.LESSGREATER;
precedences[TokenType.PLUS] = Precedence.SUM;
precedences[TokenType.MINUS] = Precedence.SUM;
precedences[TokenType.SLASH] = Precedence.PRODUCT;
precedences[TokenType.ASTERISK] = Precedence.PRODUCT;
precedences[TokenType.LPAREN] = Precedence.CALL;
precedences[TokenType.LBRACKET] = Precedence.INDEX;

class Parser {
  constructor(lexer) {
    this.lexer = lexer;
    this.errors = [];
    this.curToken = null;
    this.peekToken = null;

    this.prefixParseFns = new Map();
    this.infixParseFns = new Map();

    this._registerPrefix(TokenType.IDENT, this._parseIdentifier.bind(this));
    this._registerPrefix(TokenType.INT, this._parseIntegerLiteral.bind(this));
    this._registerPrefix(TokenType.FLOAT, this._parseFloatLiteral.bind(this));
    this._registerPrefix(TokenType.STRING, this._parseStringLiteral.bind(this));
    this._registerPrefix(TokenType.TRUE, this._parseBooleanLiteral.bind(this));
    this._registerPrefix(TokenType.FALSE, this._parseBooleanLiteral.bind(this));
    this._registerPrefix(TokenType.BANG, this._parsePrefixExpression.bind(this));
    this._registerPrefix(TokenType.MINUS, this._parsePrefixExpression.bind(this));
    this._registerPrefix(TokenType.LPAREN, this._parseGroupedExpression.bind(this));
    this._registerPrefix(TokenType.LBRACKET, this._parseArrayLiteral.bind(this));
    this._registerPrefix(TokenType.IF, this._parseIfExpression.bind(this));
    this._registerPrefix(TokenType.LBRACE, this._parseHashLiteral.bind(this));
    this._registerPrefix(TokenType.FUNCTION, this._parseFunctionLiteral.bind(this));

    this._registerInfix(TokenType.PLUS, this._parseInfixExpression.bind(this));
    this._registerInfix(TokenType.MINUS, this._parseInfixExpression.bind(this));
    this._registerInfix(TokenType.SLASH, this._parseInfixExpression.bind(this));
    this._registerInfix(TokenType.ASTERISK, this._parseInfixExpression.bind(this));
    this._registerInfix(TokenType.EQ, this._parseInfixExpression.bind(this));
    this._registerInfix(TokenType.NOT_EQ, this._parseInfixExpression.bind(this));
    this._registerInfix(TokenType.LT, this._parseInfixExpression.bind(this));
    this._registerInfix(TokenType.GT, this._parseInfixExpression.bind(this));
    this._registerInfix(TokenType.LPAREN, this._parseCallExpression.bind(this));
    this._registerInfix(TokenType.LBRACKET, this._parseIndexExpression.bind(this));

    this._nextToken();
    this._nextToken();
  }

  _registerPrefix(tokenType, fn) { this.prefixParseFns.set(tokenType, fn); }
  _registerInfix(tokenType, fn) { this.infixParseFns.set(tokenType, fn); }

  _nextToken() {
    this.curToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parseProgram() {
    const program = new AST.Program();
    while (this.curToken == null || this.curToken.type !== TokenType.EOF) {
      const stmt = this._parseStatement();
      if (stmt) program.statements.push(stmt);
      this._nextToken();
    }
    return program;
  }

  _parseStatement() {
    switch (this.curToken?.type) {
      case TokenType.LET:
        return this._parseLetStatement();
      case TokenType.RETURN:
        return this._parseReturnStatement();
      default:
        return this._parseExpressionStatement();
    }
  }

  _parseLetStatement() {
    const token = this.curToken;
    if (!this._expectPeek(TokenType.IDENT)) return null;
    const name = new AST.Identifier(this.curToken, this.curToken.literal);
    if (!this._expectPeek(TokenType.ASSIGN)) return null;
    this._nextToken();
    const value = this._parseExpression(Precedence.LOWEST);
    if (this.peekToken.type === TokenType.SEMICOLON) this._nextToken();
    return new AST.LetStatement(token, name, value);
  }

  _parseReturnStatement() {
    const token = this.curToken;
    this._nextToken();
    const returnValue = this._parseExpression(Precedence.LOWEST);
    if (this.peekToken.type === TokenType.SEMICOLON) this._nextToken();
    return new AST.ReturnStatement(token, returnValue);
  }

  _parseExpressionStatement() {
    const token = this.curToken;
    const expression = this._parseExpression(Precedence.LOWEST);
    if (this.peekToken?.type === TokenType.SEMICOLON) this._nextToken();
    return new AST.ExpressionStatement(token, expression);
  }

  _parseExpression(precedence) {
    const prefix = this.prefixParseFns.get(this.curToken?.type);
    if (!prefix) {
      this._noPrefixParseFnError(this.curToken?.type);
      return null;
    }
    let leftExp = prefix();

    while (
      this.peekToken && this.peekToken.type !== TokenType.SEMICOLON && precedence < this._peekPrecedence()
    ) {
      const infix = this.infixParseFns.get(this.peekToken.type);
      if (!infix) return leftExp;
      this._nextToken();
      leftExp = infix(leftExp);
    }
    return leftExp;
  }

  _parseIdentifier() { return new AST.Identifier(this.curToken, this.curToken.literal); }

  _parseIntegerLiteral() {
    const value = parseInt(this.curToken.literal, 10);
    if (Number.isNaN(value)) {
      this.errors.push(`could not parse integer: ${this.curToken.literal}`);
      return null;
    }
    return new AST.IntegerLiteral(this.curToken, value);
  }

  _parseFloatLiteral() {
    const value = parseFloat(this.curToken.literal);
    if (Number.isNaN(value)) {
      this.errors.push(`could not parse float: ${this.curToken.literal}`);
      return null;
    }
    return new AST.FloatLiteral(this.curToken, value);
  }

  _parseStringLiteral() { return new AST.StringLiteral(this.curToken, this.curToken.literal); }

  _parseBooleanLiteral() { return new AST.BooleanLiteral(this.curToken, this.curToken.type === TokenType.TRUE); }

  _parsePrefixExpression() {
    const token = this.curToken;
    const operator = this.curToken.literal;
    this._nextToken();
    const right = this._parseExpression(Precedence.PREFIX);
    return new AST.PrefixExpression(token, operator, right);
  }

  _parseInfixExpression(left) {
    const token = this.curToken;
    const operator = this.curToken.literal;
    const precedence = this._curPrecedence();
    this._nextToken();
    const right = this._parseExpression(precedence);
    return new AST.InfixExpression(token, left, operator, right);
  }

  _parseGroupedExpression() {
    this._nextToken();
    const exp = this._parseExpression(Precedence.LOWEST);
    if (!this._expectPeek(TokenType.RPAREN)) return null;
    return exp;
  }

  _parseArrayLiteral() {
    const token = this.curToken;
    const elements = this._parseExpressionList(TokenType.RBRACKET);
    return new AST.ArrayLiteral(token, elements);
  }

  _parseIfExpression() {
    const token = this.curToken;
    if (!this._expectPeek(TokenType.LPAREN)) return null;
    this._nextToken();
    const condition = this._parseExpression(Precedence.LOWEST);
    if (!this._expectPeek(TokenType.RPAREN)) return null;
    if (!this._expectPeek(TokenType.LBRACE)) return null;
    const consequence = this._parseBlockStatement();
    let alternative = null;
    if (this.peekToken.type === TokenType.ELSE) {
      this._nextToken();
      if (!this._expectPeek(TokenType.LBRACE)) return null;
      alternative = this._parseBlockStatement();
    }
    return new AST.IfExpression(token, condition, consequence, alternative);
  }

  _parseHashLiteral() {
    const token = this.curToken;
    const pairs = new Map();
    while (this.peekToken.type !== TokenType.RBRACE) {
      this._nextToken();
      const key = this._parseExpression(Precedence.LOWEST);
      if (!this._expectPeek(TokenType.COLON)) return null;
      this._nextToken();
      const value = this._parseExpression(Precedence.LOWEST);
      pairs.set(key, value);
      if (this.peekToken.type !== TokenType.RBRACE && !this._expectPeek(TokenType.COMMA)) return null;
    }
    if (!this._expectPeek(TokenType.RBRACE)) return null;
    return new AST.HashLiteral(token, pairs);
  }

  _parseBlockStatement() {
    const token = this.curToken;
    this._nextToken();
    const statements = [];
    while (this.curToken.type !== TokenType.RBRACE && this.curToken.type !== TokenType.EOF) {
      const stmt = this._parseStatement();
      if (stmt) statements.push(stmt);
      this._nextToken();
    }
    return new AST.BlockStatement(token, statements);
  }

  _parseFunctionLiteral() {
    const token = this.curToken;
    if (!this._expectPeek(TokenType.LPAREN)) return null;
    const parameters = this._parseFunctionParameters();
    if (!this._expectPeek(TokenType.LBRACE)) return null;
    const body = this._parseBlockStatement();
    return new AST.FunctionLiteral(token, parameters, body);
  }

  _parseFunctionParameters() {
    const identifiers = [];
    if (this.peekToken.type === TokenType.RPAREN) { this._nextToken(); return identifiers; }
    this._nextToken();
    const ident = new AST.Identifier(this.curToken, this.curToken.literal);
    identifiers.push(ident);
    while (this.peekToken.type === TokenType.COMMA) {
      this._nextToken();
      this._nextToken();
      identifiers.push(new AST.Identifier(this.curToken, this.curToken.literal));
    }
    if (!this._expectPeek(TokenType.RPAREN)) return null;
    return identifiers;
  }

  _parseCallExpression(func) {
    const token = this.curToken;
    const args = this._parseExpressionList(TokenType.RPAREN);
    return new AST.CallExpression(token, func, args);
  }

  _parseIndexExpression(left) {
    const token = this.curToken;
    this._nextToken();
    const index = this._parseExpression(Precedence.LOWEST);
    if (!this._expectPeek(TokenType.RBRACKET)) return null;
    return new AST.IndexExpression(token, left, index);
  }

  _parseExpressionList(endToken) {
    const list = [];
    if (this.peekToken.type === endToken) { this._nextToken(); return list; }
    this._nextToken();
    list.push(this._parseExpression(Precedence.LOWEST));
    while (this.peekToken.type === TokenType.COMMA) {
      this._nextToken();
      this._nextToken();
      list.push(this._parseExpression(Precedence.LOWEST));
    }
    if (!this._expectPeek(endToken)) return null;
    return list;
  }

  _expectPeek(t) {
    if (this.peekToken?.type === t) { this._nextToken(); return true; }
    this._peekError(t); return false;
  }

  _peekError(t) { this.errors.push(`expected next token to be ${t}, got ${this.peekToken?.type}`); }
  _noPrefixParseFnError(t) { this.errors.push(`no prefix parse function for ${t} found`); }
  _peekPrecedence() { return precedences[this.peekToken?.type] || Precedence.LOWEST; }
  _curPrecedence() { return precedences[this.curToken?.type] || Precedence.LOWEST; }
}

module.exports = { Parser };

