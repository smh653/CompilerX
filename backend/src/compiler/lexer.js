// Lexical Analyzer - Tokenizer for a simple C-like language

const TOKEN_TYPES = {
  // Keywords
  KEYWORD: 'KEYWORD',
  // Identifiers
  IDENTIFIER: 'IDENTIFIER',
  // Literals
  INTEGER: 'INTEGER',
  FLOAT: 'FLOAT',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  // Operators
  OPERATOR: 'OPERATOR',
  // Delimiters
  DELIMITER: 'DELIMITER',
  // Special
  EOF: 'EOF',
  ERROR: 'ERROR'
};

const KEYWORDS = new Set([
  'int', 'float', 'bool', 'string', 'void',
  'if', 'else', 'while', 'for', 'return',
  'true', 'false', 'print'
]);

const OPERATORS = new Set([
  '+', '-', '*', '/', '%', '=', '==', '!=',
  '<', '>', '<=', '>=', '&&', '||', '!',
  '+=', '-=', '*=', '/='
]);

const DELIMITERS = new Set([
  '(', ')', '{', '}', '[', ']', ';', ',', ':'
]);

function lexer(source) {
  const tokens = [];
  const errors = [];
  let i = 0;
  let line = 1;
  let col = 1;

  function peek(offset = 0) {
    return source[i + offset] || '';
  }

  function advance() {
    const ch = source[i++];
    if (ch === '\n') { line++; col = 1; } else { col++; }
    return ch;
  }

  function addToken(type, value, l = line, c = col) {
    tokens.push({ type, value, line: l, col: c });
  }

  while (i < source.length) {
    const startLine = line;
    const startCol = col;
    const ch = peek();

    // Skip whitespace
    if (/\s/.test(ch)) {
      advance();
      continue;
    }

    // Single-line comment
    if (ch === '/' && peek(1) === '/') {
      while (i < source.length && peek() !== '\n') advance();
      continue;
    }

    // Block comment
    if (ch === '/' && peek(1) === '*') {
      advance(); advance();
      while (i < source.length) {
        if (peek() === '*' && peek(1) === '/') {
          advance(); advance();
          break;
        }
        advance();
      }
      continue;
    }

    // String literal
    if (ch === '"') {
      advance();
      let str = '';
      while (i < source.length && peek() !== '"') {
        if (peek() === '\n') {
          errors.push(`Unterminated string at line ${startLine}`);
          break;
        }
        str += advance();
      }
      if (peek() === '"') advance();
      addToken(TOKEN_TYPES.STRING, `"${str}"`, startLine, startCol);
      continue;
    }

    // Number
    if (/[0-9]/.test(ch)) {
      let num = '';
      let isFloat = false;
      while (i < source.length && /[0-9]/.test(peek())) {
        num += advance();
      }
      if (peek() === '.' && /[0-9]/.test(peek(1))) {
        isFloat = true;
        num += advance();
        while (i < source.length && /[0-9]/.test(peek())) {
          num += advance();
        }
      }
      addToken(isFloat ? TOKEN_TYPES.FLOAT : TOKEN_TYPES.INTEGER, num, startLine, startCol);
      continue;
    }

    // Identifier or keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < source.length && /[a-zA-Z0-9_]/.test(peek())) {
        ident += advance();
      }
      if (KEYWORDS.has(ident)) {
        const type = (ident === 'true' || ident === 'false') ? TOKEN_TYPES.BOOLEAN : TOKEN_TYPES.KEYWORD;
        addToken(type, ident, startLine, startCol);
      } else {
        addToken(TOKEN_TYPES.IDENTIFIER, ident, startLine, startCol);
      }
      continue;
    }

    // Multi-char operators
    const twoChar = ch + peek(1);
    if (['==', '!=', '<=', '>=', '&&', '||', '+=', '-=', '*=', '/='].includes(twoChar)) {
      advance(); advance();
      addToken(TOKEN_TYPES.OPERATOR, twoChar, startLine, startCol);
      continue;
    }

    // Single char operators/delimiters
    if (OPERATORS.has(ch)) {
      advance();
      addToken(TOKEN_TYPES.OPERATOR, ch, startLine, startCol);
      continue;
    }

    if (DELIMITERS.has(ch)) {
      advance();
      addToken(TOKEN_TYPES.DELIMITER, ch, startLine, startCol);
      continue;
    }

    // Unknown character
    errors.push(`Unknown character '${ch}' at line ${startLine}, col ${startCol}`);
    advance();
  }

  addToken(TOKEN_TYPES.EOF, 'EOF', line, col);
  return { tokens, errors };
}

module.exports = { lexer, TOKEN_TYPES };
