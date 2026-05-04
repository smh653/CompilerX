class AssemblyGenerator {
  constructor() {
    this.code = [];
  }

  emit(line) { this.code.push(line); }

  generate(irCode) {
    // Removed headers and comments
    for (const line of irCode) {
      // Skip empty lines or IR comments entirely
      if (!line || line.startsWith('#')) continue;
      this.translateLine(line);
    }
    return this.code;
  }

  translateLine(line) {
    // 1. Labels (L1:)
    if (/^L\d+:$/.test(line.trim())) {
      this.emit(line.trim());
      return;
    }

    // 2. Control Flow (goto, if_false)
    if (line.startsWith('goto ')) {
      this.emit(`JMP     ${line.split(' ')[1]}`);
      return;
    }

    if (line.startsWith('if_false ')) {
      const parts = line.match(/^if_false (\S+) goto (\S+)$/);
      if (parts) this.emit(`JZ      ${parts[1]}, ${parts[2]}`); 
      return;
    }

    // 3. IO (print)
    if (line.startsWith('print ')) {
      this.emit(`OUT     ${line.split(' ')[1]}`);
      return;
    }

    // 4. Returns
    if (line.startsWith('return')) {
      const val = line.split(' ')[1] || '';
      this.emit(`RET     ${val}`);
      return;
    }

    // 5. Math Operations (dest = op1 operator op2)
    const binMatch = line.match(/^(\w+)\s*=\s*(-?[\w.]+)\s*([+\-*\/%<>=!&|]{1,2})\s*(-?[\w.]+)/);
    if (binMatch) {
      const [, dest, op1, op, op2] = binMatch;
      let m = { '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '<': 'LT', '>': 'GT' }[op] || 'OP';
      this.emit(`${m.padEnd(8)}${dest}, ${op1}, ${op2}`);
      return;
    }

    // 6. Assignments (dest = src)
    const assignMatch = line.match(/^(\w+)\s*=\s*(-?[\w."]+)/);
    if (assignMatch) {
      const [, dest, src] = assignMatch;
      this.emit(`MOV     ${dest}, ${src}`);
      return;
    }
  }
}

function generateCode(optimizedCode) {
  const gen = new AssemblyGenerator();
  const targetCode = gen.generate(optimizedCode);
  return { targetCode, targetArch: 'Simple Mnemonics' };
}


module.exports = { generateCode };
