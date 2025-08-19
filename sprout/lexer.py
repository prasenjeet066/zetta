from __future__ import annotations

from .token import Token, TokenType, lookup_ident


class Lexer:
    def __init__(self, input_text: str) -> None:
        self.input_text = input_text
        self.position = 0
        self.read_position = 0
        self.ch = ""
        self._read_char()

    def _read_char(self) -> None:
        if self.read_position >= len(self.input_text):
            self.ch = "\0"
        else:
            self.ch = self.input_text[self.read_position]
        self.position = self.read_position
        self.read_position += 1

    def _peek_char(self) -> str:
        if self.read_position >= len(self.input_text):
            return "\0"
        return self.input_text[self.read_position]

    def _skip_whitespace(self) -> None:
        while self.ch in " \t\n\r":
            self._read_char()

    def _read_identifier(self) -> str:
        start = self.position
        while self.ch.isalpha() or self.ch == "_" or self.ch.isdigit():
            self._read_char()
        return self.input_text[start:self.position]

    def _read_number(self) -> str:
        start = self.position
        while self.ch.isdigit():
            self._read_char()
        return self.input_text[start:self.position]

    def _read_string(self) -> str:
        # current ch is opening quote
        self._read_char()
        start = self.position
        while self.ch != '"' and self.ch != "\0":
            if self.ch == "\\" and self._peek_char() in ['"', "\\", "n", "t", "r"]:
                # consume escape and next char as literal pair
                self._read_char()
            self._read_char()
        literal = self.input_text[start:self.position]
        # closing quote
        self._read_char()
        # unescape common sequences
        return bytes(literal, "utf-8").decode("unicode_escape")

    def next_token(self) -> Token:
        self._skip_whitespace()

        if self.ch == "=":
            if self._peek_char() == "=":
                ch = self.ch
                self._read_char()
                tok = Token(TokenType.EQ, ch + self.ch, self.position)
                self._read_char()
                return tok
            tok = Token(TokenType.ASSIGN, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == ";":
            tok = Token(TokenType.SEMICOLON, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == ",":
            tok = Token(TokenType.COMMA, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == ":":
            tok = Token(TokenType.COLON, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "+":
            tok = Token(TokenType.PLUS, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "-":
            tok = Token(TokenType.MINUS, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "!":
            if self._peek_char() == "=":
                ch = self.ch
                self._read_char()
                tok = Token(TokenType.NOT_EQ, ch + self.ch, self.position)
                self._read_char()
                return tok
            tok = Token(TokenType.BANG, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "/":
            tok = Token(TokenType.SLASH, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "*":
            tok = Token(TokenType.ASTERISK, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "<":
            tok = Token(TokenType.LT, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == ">":
            tok = Token(TokenType.GT, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "(":
            tok = Token(TokenType.LPAREN, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == ")":
            tok = Token(TokenType.RPAREN, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "{" :
            tok = Token(TokenType.LBRACE, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "}":
            tok = Token(TokenType.RBRACE, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "[":
            tok = Token(TokenType.LBRACKET, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == "]":
            tok = Token(TokenType.RBRACKET, self.ch, self.position)
            self._read_char()
            return tok
        elif self.ch == '"':
            literal = self._read_string()
            return Token(TokenType.STRING, literal, self.position)
        elif self.ch == "\0":
            return Token(TokenType.EOF, "", self.position)
        else:
            if self.ch.isalpha() or self.ch == "_":
                ident = self._read_identifier()
                return Token(lookup_ident(ident), ident, self.position)
            if self.ch.isdigit():
                num = self._read_number()
                return Token(TokenType.INT, num, self.position)
            tok = Token(TokenType.ILLEGAL, self.ch, self.position)
            self._read_char()
            return tok

