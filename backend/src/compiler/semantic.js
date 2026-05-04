// Semantic Analyzer - Type checking, scope resolution, symbol table

class SymbolTable {
  constructor(parent = null, scopeName = 'global') {
    this.parent = parent;
    this.scopeName = scopeName;
    this.symbols = {};
  }

  define(name, info) {
    this.symbols[name] = info;
  }

  lookup(name) {
    if (this.symbols[name]) return { ...this.symbols[name], scope: this.scopeName };
    if (this.parent) return this.parent.lookup(name);
    return null;
  }

  toJSON() {
    return {
      scope: this.scopeName,
      symbols: this.symbols,
      parent: this.parent ? this.parent.scopeName : null
    };
  }
}

const TYPE_COMPAT = {
  int: ['int'],
  float: ['float', 'int'],
  bool: ['bool'],
  string: ['string']
};

class SemanticAnalyzer {
  constructor() {
    this.globalScope = new SymbolTable(null, 'global');
    this.currentScope = this.globalScope;
    this.errors = [];
    this.scopes = [this.globalScope];
    this.annotated = null;
  }

  error(msg) { this.errors.push(msg); }

  enterScope(name) {
    const s = new SymbolTable(this.currentScope, name);
    this.currentScope = s;
    this.scopes.push(s);
    return s;
  }

  exitScope() {
    this.currentScope = this.currentScope.parent || this.globalScope;
  }

  analyze(ast) {
    this.annotated = this.visitNode(ast);
    const symbolTableData = this.scopes.map(s => s.toJSON());
    return { symbolTable: symbolTableData, semanticErrors: this.errors, annotatedTree: this.annotated };
  }

  visitNode(node) {
    if (!node) return null;
    switch (node.type) {
      case 'Program':     return this.visitProgram(node);
      case 'VarDecl':     return this.visitVarDecl(node);
      case 'AssignStmt':  return this.visitAssignStmt(node);
      case 'IfStmt':      return this.visitIfStmt(node);
      case 'WhileStmt':   return this.visitWhileStmt(node);
      case 'ReturnStmt':  return this.visitReturnStmt(node);
      case 'PrintStmt':   return this.visitPrintStmt(node);
      case 'Block':       return this.visitBlock(node);
      case 'BinaryExpr':  return this.visitBinaryExpr(node);
      case 'UnaryExpr':   return this.visitUnaryExpr(node);
      case 'Identifier':  return this.visitIdentifier(node);
      case 'Literal':     return { ...node, inferredType: node.kind };
      case 'GroupExpr':   return { ...node, expr: this.visitNode(node.expr), inferredType: this.visitNode(node.expr)?.inferredType };
      case 'ExprStmt':    return { ...node, expr: this.visitNode(node.expr) };
      default:            return node;
    }
  }

  visitProgram(node) {
    return { ...node, children: node.children.map(c => this.visitNode(c)) };
  }

  visitVarDecl(node) {
    if (this.currentScope.symbols[node.name]) {
      this.error(`Variable '${node.name}' already declared in this scope (line ${node.line})`);
    }
    let init = node.init ? this.visitNode(node.init) : null;
    if (init && init.inferredType) {
      const expected = node.varType;
      const actual = init.inferredType;
      if (!TYPE_COMPAT[expected]?.includes(actual)) {
        this.error(`Type mismatch: cannot assign '${actual}' to '${expected}' variable '${node.name}' (line ${node.line})`);
      }
    }
    this.currentScope.define(node.name, { type: node.varType, initialized: !!init, line: node.line });
    return { ...node, init, inferredType: node.varType };
  }

  visitAssignStmt(node) {
    const sym = this.currentScope.lookup(node.name);
    if (!sym) {
      this.error(`Undeclared variable '${node.name}' (line ${node.line})`);
    }
    const value = this.visitNode(node.value);
    if (sym && value?.inferredType) {
      if (!TYPE_COMPAT[sym.type]?.includes(value.inferredType)) {
        this.error(`Type mismatch: cannot assign '${value.inferredType}' to '${sym.type}' '${node.name}' (line ${node.line})`);
      }
    }
    if (sym) this.currentScope.lookup(node.name).initialized = true;
    return { ...node, value, inferredType: sym?.type };
  }

  visitIfStmt(node) {
    const condition = this.visitNode(node.condition);
    if (condition?.inferredType && condition.inferredType !== 'bool' && condition.inferredType !== 'int') {
      this.error(`If condition must be boolean/int, got '${condition.inferredType}' (line ${node.line})`);
    }
    this.enterScope(`if_then_line${node.line}`);
    const thenBranch = this.visitNode(node.thenBranch);
    this.exitScope();
    let elseBranch = null;
    if (node.elseBranch) {
      this.enterScope(`if_else_line${node.line}`);
      elseBranch = this.visitNode(node.elseBranch);
      this.exitScope();
    }
    return { ...node, condition, thenBranch, elseBranch };
  }

  visitWhileStmt(node) {
    const condition = this.visitNode(node.condition);
    if (condition?.inferredType && condition.inferredType !== 'bool' && condition.inferredType !== 'int') {
      this.error(`While condition must be boolean/int, got '${condition.inferredType}' (line ${node.line})`);
    }
    this.enterScope(`while_line${node.line}`);
    const body = this.visitNode(node.body);
    this.exitScope();
    return { ...node, condition, body };
  }

  visitReturnStmt(node) {
    const value = node.value ? this.visitNode(node.value) : null;
    return { ...node, value };
  }

  visitPrintStmt(node) {
    const value = this.visitNode(node.value);
    return { ...node, value };
  }

  visitBlock(node) {
    const body = node.body.map(s => this.visitNode(s));
    return { ...node, body };
  }

  visitBinaryExpr(node) {
    const left = this.visitNode(node.left);
    const right = this.visitNode(node.right);
    let inferredType = 'int';
    const lType = left?.inferredType;
    const rType = right?.inferredType;

    if (['+', '-', '*', '/', '%'].includes(node.op)) {
      if (lType === 'float' || rType === 'float') inferredType = 'float';
      else if (lType === 'int' && rType === 'int') inferredType = 'int';
      else if (lType === 'string' && node.op === '+') inferredType = 'string';
      else {
        this.error(`Invalid operand types '${lType}' and '${rType}' for operator '${node.op}'`);
        inferredType = 'error';
      }
    } else if (['==', '!=', '<', '>', '<=', '>=', '&&', '||'].includes(node.op)) {
      inferredType = 'bool';
    }
    return { ...node, left, right, inferredType };
  }

  visitUnaryExpr(node) {
    const operand = this.visitNode(node.operand);
    let inferredType = operand?.inferredType;
    if (node.op === '!') {
      if (inferredType !== 'bool' && inferredType !== 'int') {
        this.error(`'!' operator requires bool/int, got '${inferredType}'`);
      }
      inferredType = 'bool';
    }
    return { ...node, operand, inferredType };
  }

  visitIdentifier(node) {
    const sym = this.currentScope.lookup(node.name);
    if (!sym) {
      this.error(`Undeclared identifier '${node.name}' (line ${node.line})`);
      return { ...node, inferredType: 'error' };
    }
    if (!sym.initialized) {
      this.error(`Variable '${node.name}' used before initialization (line ${node.line})`);
    }
    return { ...node, inferredType: sym.type };
  }
}

function analyze(parseTree) {
  const analyzer = new SemanticAnalyzer();
  return analyzer.analyze(parseTree);
}

module.exports = { analyze };
