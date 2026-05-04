const express = require('express');
const router = express.Router();
const CompilerSession = require('../models/CompilerSession');
const { lexer } = require('../compiler/lexer');
const { parse } = require('../compiler/parser');
const { analyze } = require('../compiler/semantic');
const { generateIR } = require('../compiler/ir_generator');
const { optimize } = require('../compiler/optimizer');
const { generateCode } = require('../compiler/code_generator');

// Run all 6 phases at once
router.post('/compile', async (req, res) => {
  try {
    const { sourceCode } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode is required' });

    // Phase 1: Lexical
    const { tokens, errors: lexicalErrors } = lexer(sourceCode);

    // Phase 2: Syntax
    const { parseTree, parseTable, syntaxErrors } = parse(tokens);

    // Phase 3: Semantic
    const { symbolTable, semanticErrors, annotatedTree } = analyze(parseTree);

    // Phase 4: IR
    const { intermediateCode, irType } = generateIR(annotatedTree);

    // Phase 5: Optimize
    const { optimizedCode, optimizations } = optimize(intermediateCode);

    // Phase 6: Code Gen
    const { targetCode, targetArch } = generateCode(optimizedCode);

    // Save to DB
    const session = new CompilerSession({
      sourceCode,
      tokens,
      lexicalErrors,
      parseTree,
      parseTable,
      syntaxErrors,
      symbolTable,
      semanticErrors,
      annotatedTree,
      intermediateCode,
      irType,
      optimizedCode,
      optimizations,
      targetCode,
      targetArch
    });
    const saved = await session.save();

    res.json({
      sessionId: saved._id,
      phases: {
        lexical: { tokens, errors: lexicalErrors },
        syntax: { parseTree, parseTable, errors: syntaxErrors },
        semantic: { symbolTable, errors: semanticErrors, annotatedTree },
        ir: { code: intermediateCode, type: irType },
        optimization: { code: optimizedCode, optimizations },
        codeGen: { code: targetCode, arch: targetArch }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await CompilerSession.find({}, 'sourceCode createdAt _id lexicalErrors syntaxErrors semanticErrors')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single session
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await CompilerSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete session
router.delete('/sessions/:id', async (req, res) => {
  try {
    await CompilerSession.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
