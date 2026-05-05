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
      case 'Literal':     return { ...node, inferredType: node.kind || 'int' }; // Fallback to int
      case 'GroupExpr':   
        const inner = this.visitNode(node.body?.[0]); 
        return { ...node, body: [inner], inferredType: inner?.inferredType };
      case 'ExprStmt':    return { ...node, body: node.body?.map(c => this.visitNode(c)) };
      default:            return node;
    }
  }

  visitProgram(node) {
    // FIX: Use .body instead of .children to match the Parser
    const body = node.body ? node.body.map(c => this.visitNode(c)) : [];
    return { ...node, body };
  }

  visitVarDecl(node) {
    if (this.currentScope.symbols[node.name]) {
      this.error(`Variable '${node.name}' already declared in this scope (line ${node.line})`);
    }
    // FIX: init is now inside the body array in your parser
    let init = node.body && node.body.length > 0 ? this.visitNode(node.body[0]) : null;
    
    if (init && init.inferredType) {
      const expected = node.varType;
      const actual = init.inferredType;
      if (!TYPE_COMPAT[expected]?.includes(actual)) {
        this.error(`Type mismatch: cannot assign '${actual}' to '${expected}' variable '${node.name}' (line ${node.line})`);
      }
    }
    this.currentScope.define(node.name, { type: node.varType, initialized: !!init, line: node.line });
    return { ...node, body: init ? [init] : [], inferredType: node.varType };
  }

  visitAssignStmt(node) {
    const sym = this.currentScope.lookup(node.name);
    if (!sym) {
      this.error(`Undeclared variable '${node.name}' (line ${node.line})`);
    }
    // FIX: assignment value is now inside the body array
    const value = node.body && node.body.length > 0 ? this.visitNode(node.body[0]) : null;
    
    if (sym && value?.inferredType) {
      if (!TYPE_COMPAT[sym.type]?.includes(value.inferredType)) {
        this.error(`Type mismatch: cannot assign '${value.inferredType}' to '${sym.type}' '${node.name}' (line ${node.line})`);
      }
    }
    if (sym) sym.initialized = true;
    return { ...node, body: value ? [value] : [], inferredType: sym?.type };
  }

  visitIfStmt(node) {
    const condition = this.visitNode(node.condition);
    if (condition?.inferredType && !['bool', 'int'].includes(condition.inferredType)) {
      this.error(`If condition must be boolean/int, got '${condition.inferredType}' (line ${node.line})`);
    }
    
    // Parser sends branches in the body array
    this.enterScope(`if_then_line${node.line}`);
    const thenBranch = node.body?.[0] ? this.visitNode(node.body[0]) : null;
    this.exitScope();

    let elseBranch = null;
    if (node.body?.[1]) {
      this.enterScope(`if_else_line${node.line}`);
      elseBranch = this.visitNode(node.body[1]);
      this.exitScope();
    }
    
    return { ...node, condition, body: elseBranch ? [thenBranch, elseBranch] : [thenBranch] };
  }

  visitWhileStmt(node) {
    const condition = this.visitNode(node.condition);
    if (condition?.inferredType && !['bool', 'int'].includes(condition.inferredType)) {
      this.error(`While condition must be boolean/int, got '${condition.inferredType}' (line ${node.line})`);
    }
    this.enterScope(`while_line${node.line}`);
    const bodyNode = node.body?.[0] ? this.visitNode(node.body[0]) : null;
    this.exitScope();
    return { ...node, condition, body: [bodyNode] };
  }

  visitReturnStmt(node) {
    const value = node.body?.[0] ? this.visitNode(node.body[0]) : null;
    return { ...node, body: value ? [value] : [] };
  }

  visitPrintStmt(node) {
    const value = node.body?.[0] ? this.visitNode(node.body[0]) : null;
    return { ...node, body: [value] };
  }

  visitBlock(node) {
    const body = node.body ? node.body.map(s => this.visitNode(s)) : [];
    return { ...node, body };
  }

  visitBinaryExpr(node) {
    // FIX: body contains left/right
    const left = node.body?.[0] ? this.visitNode(node.body[0]) : null;
    const right = node.body?.[1] ? this.visitNode(node.body[1]) : null;
    
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
    return { ...node, body: [left, right], inferredType };
  }

  visitUnaryExpr(node) {
    const operand = node.body?.[0] ? this.visitNode(node.body[0]) : null;
    let inferredType = operand?.inferredType;
    if (node.op === '!') {
      if (inferredType !== 'bool' && inferredType !== 'int') {
        this.error(`'!' operator requires bool/int, got '${inferredType}'`);
      }
      inferredType = 'bool';
    }
    return { ...node, body: [operand], inferredType };
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