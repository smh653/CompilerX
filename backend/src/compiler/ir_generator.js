// Intermediate Code Generator - Produces Three Address Code (TAC)

class TACGenerator {
  constructor() {
    this.code = [];
    this.tempCount = 0;
    this.labelCount = 0;
  }

  newTemp() { return `t${++this.tempCount}`; }
  newLabel() { return `L${++this.labelCount}`; }

  emit(instr) { this.code.push(instr); }

  generate(ast) {
    this.visitNode(ast);
    return this.code;
  }

  visitNode(node) {
    if (!node) return null;
    switch (node.type) {
      case 'Program':    return this.visitProgram(node);
      case 'VarDecl':    return this.visitVarDecl(node);
      case 'AssignStmt': return this.visitAssignStmt(node);
      case 'IfStmt':     return this.visitIfStmt(node);
      case 'WhileStmt':  return this.visitWhileStmt(node);
      case 'ReturnStmt': return this.visitReturnStmt(node);
      case 'PrintStmt':  return this.visitPrintStmt(node);
      case 'Block':      return this.visitBlock(node);
      case 'BinaryExpr': return this.visitBinaryExpr(node);
      case 'UnaryExpr':  return this.visitUnaryExpr(node);
      case 'Literal':    return String(node.value);
      case 'Identifier': return node.name;
      case 'GroupExpr':  return this.visitNode(node.expr);
      case 'ExprStmt':   return this.visitNode(node.expr);
      default:           return null;
    }
  }

  visitProgram(node) {
    this.emit('# --- BEGIN PROGRAM ---');
    node.children.forEach(c => this.visitNode(c));
    this.emit('# --- END PROGRAM ---');
  }

  visitBlock(node) {
    node.body.forEach(s => this.visitNode(s));
  }

  visitVarDecl(node) {
    if (node.init) {
      const rhs = this.visitNode(node.init);
      this.emit(`${node.name} = ${rhs}`);
    } else {
      this.emit(`${node.name} = 0  # declare ${node.varType}`);
    }
  }

  visitAssignStmt(node) {
    const rhs = this.visitNode(node.value);
    if (node.op === '=') {
      this.emit(`${node.name} = ${rhs}`);
    } else {
      const opBase = node.op.replace('=', '');
      const tmp = this.newTemp();
      this.emit(`${tmp} = ${node.name} ${opBase} ${rhs}`);
      this.emit(`${node.name} = ${tmp}`);
    }
  }

  visitIfStmt(node) {
    const cond = this.visitNode(node.condition);
    const elseLabel = this.newLabel();
    const endLabel = node.elseBranch ? this.newLabel() : elseLabel;

    this.emit(`if_false ${cond} goto ${elseLabel}`);
    this.visitNode(node.thenBranch);

    if (node.elseBranch) {
      this.emit(`goto ${endLabel}`);
      this.emit(`${elseLabel}:`);
      this.visitNode(node.elseBranch);
      this.emit(`${endLabel}:`);
    } else {
      this.emit(`${elseLabel}:`);
    }
  }

  visitWhileStmt(node) {
    const startLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.emit(`${startLabel}:`);
    const cond = this.visitNode(node.condition);
    this.emit(`if_false ${cond} goto ${endLabel}`);
    this.visitNode(node.body);
    this.emit(`goto ${startLabel}`);
    this.emit(`${endLabel}:`);
  }

  visitReturnStmt(node) {
    if (node.value) {
      const val = this.visitNode(node.value);
      this.emit(`return ${val}`);
    } else {
      this.emit('return');
    }
  }

  visitPrintStmt(node) {
    const val = this.visitNode(node.value);
    this.emit(`print ${val}`);
  }

  visitBinaryExpr(node) {
    const left = this.visitNode(node.left);
    const right = this.visitNode(node.right);
    const tmp = this.newTemp();
    this.emit(`${tmp} = ${left} ${node.op} ${right}`);
    return tmp;
  }

  visitUnaryExpr(node) {
    const operand = this.visitNode(node.operand);
    const tmp = this.newTemp();
    this.emit(`${tmp} = ${node.op}${operand}`);
    return tmp;
  }
}

function generateIR(annotatedTree) {
  const gen = new TACGenerator();
  const code = gen.generate(annotatedTree);
  return { intermediateCode: code, irType: 'Three Address Code (TAC)' };
}

module.exports = { generateIR };
