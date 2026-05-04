// Recursive Descent Parser for simple C-like language
// Grammar:
// program       -> statement*
// statement     -> varDecl | assignStmt | ifStmt | whileStmt | returnStmt | printStmt | block
// varDecl       -> type IDENTIFIER ('=' expr)? ';'
// assignStmt    -> IDENTIFIER ('=' | '+=' | '-=' | '*=' | '/=') expr ';'
// ifStmt        -> 'if' '(' expr ')' block ('else' block)?
// whileStmt     -> 'while' '(' expr ')' block
// returnStmt    -> 'return' expr? ';'
// printStmt     -> 'print' '(' expr ')' ';'
// block         -> '{' statement* '}'
// expr          -> equality (('&&'|'||') equality)*
// equality      -> comparison (('=='|'!=') comparison)*
// comparison    -> term (('<'|'>'|'<='|'>=') term)*
// term          -> factor (('+'|'-') factor)*
// factor        -> unary (('*'|'/'|'%') unary)*
// unary         -> '!' unary | primary
// primary       -> INTEGER | FLOAT | STRING | BOOLEAN | IDENTIFIER | '(' expr ')'
// type          -> 'int' | 'float' | 'bool' | 'string'

const TYPES = new Set(['int', 'float', 'bool', 'string', 'void']);

// LL(1) Parse Table (simplified representative entries)
function buildParseTable() {
  return [
    { nonTerminal: 'program',    terminal: 'int/float/bool/string', production: 'statement* EOF' },
    { nonTerminal: 'program',    terminal: 'if',                    production: 'statement* EOF' },
    { nonTerminal: 'program',    terminal: 'while',                 production: 'statement* EOF' },
    { nonTerminal: 'program',    terminal: 'return',                production: 'statement* EOF' },
    { nonTerminal: 'program',    terminal: 'print',                 production: 'statement* EOF' },
    { nonTerminal: 'program',    terminal: 'IDENTIFIER',            production: 'statement* EOF' },
    { nonTerminal: 'program',    terminal: 'EOF',                   production: 'ε' },
    { nonTerminal: 'statement',  terminal: 'int/float/bool/string', production: 'varDecl' },
    { nonTerminal: 'statement',  terminal: 'IDENTIFIER',            production: 'assignStmt' },
    { nonTerminal: 'statement',  terminal: 'if',                    production: 'ifStmt' },
    { nonTerminal: 'statement',  terminal: 'while',                 production: 'whileStmt' },
    { nonTerminal: 'statement',  terminal: 'return',                production: 'returnStmt' },
    { nonTerminal: 'statement',  terminal: 'print',                 production: 'printStmt' },
    { nonTerminal: 'statement',  terminal: '{',                     production: 'block' },
    { nonTerminal: 'varDecl',    terminal: 'int/float/bool/string', production: 'type IDENTIFIER ( = expr )? ;' },
    { nonTerminal: 'assignStmt', terminal: 'IDENTIFIER',            production: 'IDENTIFIER assignOp expr ;' },
    { nonTerminal: 'ifStmt',     terminal: 'if',                    production: 'if ( expr ) block ( else block )?' },
    { nonTerminal: 'whileStmt',  terminal: 'while',                 production: 'while ( expr ) block' },
    { nonTerminal: 'returnStmt', terminal: 'return',                production: 'return expr? ;' },
    { nonTerminal: 'printStmt',  terminal: 'print',                 production: 'print ( expr ) ;' },
    { nonTerminal: 'block',      terminal: '{',                     production: '{ statement* }' },
    { nonTerminal: 'expr',       terminal: 'INTEGER/FLOAT/STRING/BOOLEAN/IDENTIFIER/(', production: 'equality ( (&&|||) equality )*' },
    { nonTerminal: 'equality',   terminal: 'INTEGER/FLOAT/STRING/BOOLEAN/IDENTIFIER/(', production: 'comparison ( (==|!=) comparison )*' },
    { nonTerminal: 'comparison', terminal: 'INTEGER/FLOAT/STRING/BOOLEAN/IDENTIFIER/(', production: 'term ( (<|>|<=|>=) term )*' },
    { nonTerminal: 'term',       terminal: 'INTEGER/FLOAT/STRING/BOOLEAN/IDENTIFIER/(', production: 'factor ( (+|-) factor )*' },
    { nonTerminal: 'factor',     terminal: 'INTEGER/FLOAT/STRING/BOOLEAN/IDENTIFIER/(', production: 'unary ( (*|/|%) unary )*' },
    { nonTerminal: 'unary',      terminal: '!',                     production: '! unary' },
    { nonTerminal: 'unary',      terminal: 'INTEGER/FLOAT/STRING/BOOLEAN/IDENTIFIER/(', production: 'primary' },
    { nonTerminal: 'primary',    terminal: 'INTEGER',               production: 'INTEGER' },
    { nonTerminal: 'primary',    terminal: 'FLOAT',                 production: 'FLOAT' },
    { nonTerminal: 'primary',    terminal: 'STRING',                production: 'STRING' },
    { nonTerminal: 'primary',    terminal: 'BOOLEAN',               production: 'BOOLEAN' },
    { nonTerminal: 'primary',    terminal: 'IDENTIFIER',            production: 'IDENTIFIER' },
    { nonTerminal: 'primary',    terminal: '(',                     production: '( expr )' },
    { nonTerminal: 'type',       terminal: 'int',                   production: 'int' },
    { nonTerminal: 'type',       terminal: 'float',                 production: 'float' },
    { nonTerminal: 'type',       terminal: 'bool',                  production: 'bool' },
    { nonTerminal: 'type',       terminal: 'string',                production: 'string' },
  ];
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== 'EOF' || tokens.indexOf(t) === tokens.length - 1);
    this.pos = 0;
    this.errors = [];
  }

  peek() { return this.tokens[this.pos] || { type: 'EOF', value: 'EOF' }; }
  advance() { return this.tokens[this.pos++] || { type: 'EOF', value: 'EOF' }; }

  check(type, value) {
    const t = this.peek();
    if (value !== undefined) return t.value === value;
    return t.type === type;
  }

  expect(type, value) {
    const t = this.peek();
    if (value !== undefined && t.value !== value) {
      this.errors.push(`Expected '${value}' but got '${t.value}' at line ${t.line}`);
      return t;
    }
    if (value === undefined && t.type !== type) {
      this.errors.push(`Expected ${type} but got '${t.value}' at line ${t.line}`);
      return t;
    }
    return this.advance();
  }

  parseProgram() {
    const node = { type: 'Program', children: [], line: 1 };
    while (this.peek().type !== 'EOF') {
      try {
        node.children.push(this.parseStatement());
      } catch (e) {
        this.errors.push(e.message);
        this.advance(); // error recovery
      }
    }
    return node;
  }

  parseStatement() {
    const t = this.peek();
    if (TYPES.has(t.value)) return this.parseVarDecl();
    if (t.value === 'if') return this.parseIfStmt();
    if (t.value === 'while') return this.parseWhileStmt();
    if (t.value === 'return') return this.parseReturnStmt();
    if (t.value === 'print') return this.parsePrintStmt();
    if (t.value === '{') return this.parseBlock();
    if (t.type === 'IDENTIFIER') return this.parseAssignOrExprStmt();
    throw new Error(`Unexpected token '${t.value}' at line ${t.line}`);
  }

  parseVarDecl() {
    const typeToken = this.advance();
    const nameToken = this.expect('IDENTIFIER');
    let init = null;
    if (this.peek().value === '=') {
      this.advance();
      init = this.parseExpr();
    }
    this.expect('DELIMITER', ';');
    return { type: 'VarDecl', varType: typeToken.value, name: nameToken.value, init, line: typeToken.line };
  }

  parseAssignOrExprStmt() {
    const nameToken = this.advance();
    const assignOps = ['=', '+=', '-=', '*=', '/='];
    if (assignOps.includes(this.peek().value)) {
      const op = this.advance().value;
      const value = this.parseExpr();
      this.expect('DELIMITER', ';');
      return { type: 'AssignStmt', name: nameToken.value, op, value, line: nameToken.line };
    }
    // Expression statement (function call, etc)
    this.expect('DELIMITER', ';');
    return { type: 'ExprStmt', expr: { type: 'Identifier', name: nameToken.value }, line: nameToken.line };
  }

  parseIfStmt() {
    const kw = this.advance();
    this.expect('DELIMITER', '(');
    const condition = this.parseExpr();
    this.expect('DELIMITER', ')');
    const thenBranch = this.parseBlock();
    let elseBranch = null;
    if (this.peek().value === 'else') {
      this.advance();
      elseBranch = this.parseBlock();
    }
    return { type: 'IfStmt', condition, thenBranch, elseBranch, line: kw.line };
  }

  parseWhileStmt() {
    const kw = this.advance();
    this.expect('DELIMITER', '(');
    const condition = this.parseExpr();
    this.expect('DELIMITER', ')');
    const body = this.parseBlock();
    return { type: 'WhileStmt', condition, body, line: kw.line };
  }

  parseReturnStmt() {
    const kw = this.advance();
    let value = null;
    if (this.peek().value !== ';') value = this.parseExpr();
    this.expect('DELIMITER', ';');
    return { type: 'ReturnStmt', value, line: kw.line };
  }

  parsePrintStmt() {
    const kw = this.advance();
    this.expect('DELIMITER', '(');
    const value = this.parseExpr();
    this.expect('DELIMITER', ')');
    this.expect('DELIMITER', ';');
    return { type: 'PrintStmt', value, line: kw.line };
  }

  parseBlock() {
    const brace = this.expect('DELIMITER', '{');
    const stmts = [];
    while (this.peek().value !== '}' && this.peek().type !== 'EOF') {
      try { stmts.push(this.parseStatement()); }
      catch (e) { this.errors.push(e.message); this.advance(); }
    }
    this.expect('DELIMITER', '}');
    return { type: 'Block', body: stmts, line: brace.line };
  }

  parseExpr() { return this.parseLogical(); }

  parseLogical() {
    let left = this.parseEquality();
    while (['&&', '||'].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseEquality();
      left = { type: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseComparison();
    while (['==', '!='].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { type: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  parseComparison() {
    let left = this.parseTerm();
    while (['<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseTerm();
      left = { type: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  parseTerm() {
    let left = this.parseFactor();
    while (['+', '-'].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseFactor();
      left = { type: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  parseFactor() {
    let left = this.parseUnary();
    while (['*', '/', '%'].includes(this.peek().value)) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { type: 'BinaryExpr', op, left, right };
    }
    return left;
  }

  parseUnary() {
    if (this.peek().value === '!') {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { type: 'UnaryExpr', op, operand };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.peek();
    if (t.type === 'INTEGER') { this.advance(); return { type: 'Literal', kind: 'int', value: parseInt(t.value) }; }
    if (t.type === 'FLOAT')   { this.advance(); return { type: 'Literal', kind: 'float', value: parseFloat(t.value) }; }
    if (t.type === 'STRING')  { this.advance(); return { type: 'Literal', kind: 'string', value: t.value }; }
    if (t.type === 'BOOLEAN') { this.advance(); return { type: 'Literal', kind: 'bool', value: t.value === 'true' }; }
    if (t.type === 'IDENTIFIER') { this.advance(); return { type: 'Identifier', name: t.value, line: t.line }; }
    if (t.value === '(') {
      this.advance();
      const expr = this.parseExpr();
      this.expect('DELIMITER', ')');
      return { type: 'GroupExpr', expr };
    }
    this.errors.push(`Unexpected token '${t.value}' at line ${t.line}`);
    this.advance();
    return { type: 'Error', value: t.value };
  }
}

function parse(tokens) {
  const parser = new Parser(tokens);
  const parseTree = parser.parseProgram();
  const parseTable = buildParseTable();
  return { parseTree, parseTable, syntaxErrors: parser.errors };
}

module.exports = { parse };
