// Code Optimizer
// Applies: Constant Folding, Dead Code Elimination, Copy Propagation, Common Subexpression Elimination

function optimize(irCode) {
  const optimizations = [];
  let code = [...irCode];

  // Pass 1: Constant Folding
  const beforeCF = code.length;
  code = constantFolding(code, optimizations);

  // Pass 2: Copy Propagation
  code = copyPropagation(code, optimizations);

  // Pass 3: Dead Code Elimination
  const beforeDCE = code.length;
  code = deadCodeElimination(code, optimizations);
  if (code.length < beforeDCE) {
    optimizations.push(`Dead Code Elimination: removed ${beforeDCE - code.length} unused assignments`);
  }

  // Pass 4: Common Subexpression Elimination
  code = cseElimination(code, optimizations);

  return { optimizedCode: code, optimizations };
}

function constantFolding(code, opts) {
  const result = [];
  let count = 0;
  for (const line of code) {
    // Match: t = NUM op NUM
    const match = line.match(/^(\w+)\s*=\s*(-?[\d.]+)\s*([+\-*\/%])\s*(-?[\d.]+)$/);
    if (match) {
      const [, dest, a, op, b] = match;
      const av = parseFloat(a), bv = parseFloat(b);
      let result_val;
      switch(op) {
        case '+': result_val = av + bv; break;
        case '-': result_val = av - bv; break;
        case '*': result_val = av * bv; break;
        case '/': result_val = bv !== 0 ? av / bv : 'ERR'; break;
        case '%': result_val = av % bv; break;
      }
      if (result_val !== undefined && result_val !== 'ERR') {
        const folded = Number.isInteger(result_val) ? result_val : parseFloat(result_val.toFixed(6));
        result.push(`${dest} = ${folded}  # folded: ${a} ${op} ${b}`);
        count++;
        continue;
      }
    }
    result.push(line);
  }
  if (count > 0) opts.push(`Constant Folding: ${count} expression(s) evaluated at compile time`);
  return result;
}

function copyPropagation(code, opts) {
  const copies = {}; // var -> value
  const result = [];
  let count = 0;

  for (let line of code) {
    // Track simple copies: x = y (where y is var or number)
    const copyMatch = line.match(/^(\w+)\s*=\s*([\w.]+)(?:\s*#.*)?$/);
    if (copyMatch) {
      const [, dest, src] = copyMatch;
      if (!/^\d/.test(dest)) copies[dest] = src;
    }

    // Replace uses of copied vars in RHS
    // Replace pattern: t1 = x op y -> replace x,y if they are copies
    const rhsMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (rhsMatch) {
      const [, dest, rhs] = rhsMatch;
      let newRhs = rhs;
      for (const [k, v] of Object.entries(copies)) {
        // Replace standalone var references (not the dest itself)
        const re = new RegExp(`\\b${k}\\b`, 'g');
        const replaced = newRhs.replace(re, v);
        if (replaced !== newRhs) { newRhs = replaced; count++; }
      }
      if (newRhs !== rhs) {
        line = `${dest} = ${newRhs}`;
      }
      // Invalidate copies of dest
      delete copies[dest];
    }
    result.push(line);
  }
  if (count > 0) opts.push(`Copy Propagation: ${count} variable reference(s) replaced with their values`);
  return result;
}

function deadCodeElimination(code, opts) {
  // Find all used variables (on right-hand side or in conditions)
  const used = new Set();
  for (const line of code) {
    if (line.startsWith('#')) continue;
    // Get everything after '=' as RHS
    const eqIdx = line.indexOf('=');
    if (eqIdx > -1) {
      const rhs = line.slice(eqIdx + 1);
      const vars = rhs.match(/\b[a-zA-Z_]\w*\b/g) || [];
      vars.forEach(v => used.add(v));
    } else {
      // Labels, goto, if_false, return, print
      const vars = line.match(/\b[a-zA-Z_]\w*\b/g) || [];
      vars.forEach(v => used.add(v));
    }
  }

  // Keep a line if:
  // - It's a label, goto, if_false, return, print, or comment
  // - It assigns to something that's used
  return code.filter(line => {
    if (line.startsWith('#') || line.includes(':') || line.startsWith('goto') ||
        line.startsWith('if_false') || line.startsWith('return') || line.startsWith('print')) {
      return true;
    }
    const destMatch = line.match(/^(\w+)\s*=/);
    if (destMatch) {
      return used.has(destMatch[1]);
    }
    return true;
  });
}

function cseElimination(code, opts) {
  const exprs = {}; // expr_str -> temp_var
  const result = [];
  let count = 0;

  for (const line of code) {
    const match = line.match(/^(t\d+)\s*=\s*(.+?)\s*(?:#.*)?$/);
    if (match) {
      const [, dest, expr] = match;
      // Only CSE for arithmetic expressions (not simple copies)
      if (/[+\-*\/%]/.test(expr)) {
        const key = expr.trim();
        if (exprs[key]) {
          result.push(`${dest} = ${exprs[key]}  # CSE: reuse ${exprs[key]}`);
          count++;
          continue;
        } else {
          exprs[key] = dest;
        }
      }
    }
    result.push(line);
  }
  if (count > 0) opts.push(`Common Subexpression Elimination: ${count} redundant computation(s) removed`);
  return result;
}

module.exports = { optimize };
