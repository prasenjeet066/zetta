"""
Sprout Language - a tiny interpreted language for learning and experimentation.

This package provides the core building blocks:
- Lexer: converts source code to tokens
- Parser: builds an AST from tokens
- Evaluator: interprets the AST
- REPL: interactive shell
"""

__all__ = [
    "token",
    "lexer",
    "ast",
    "parser",
    "object",
    "environment",
    "evaluator",
    "repl",
]

