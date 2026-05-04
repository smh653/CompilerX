const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  type: String,
  value: String,
  line: Number,
  col: Number
});

const ParseTableEntrySchema = new mongoose.Schema({
  nonTerminal: String,
  terminal: String,
  production: String
});

const CompilerSessionSchema = new mongoose.Schema({
  sourceCode: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // Phase 1 - Lexical
  tokens: [TokenSchema],
  lexicalErrors: [String],

  // Phase 2 - Syntax
  parseTree: { type: mongoose.Schema.Types.Mixed },
  parseTable: [ParseTableEntrySchema],
  syntaxErrors: [String],

  // Phase 3 - Semantic
  symbolTable: { type: mongoose.Schema.Types.Mixed },
  semanticErrors: [String],
  annotatedTree: { type: mongoose.Schema.Types.Mixed },

  // Phase 4 - IR
  intermediateCode: [String],
  irType: String,

  // Phase 5 - Optimization
  optimizedCode: [String],
  optimizations: [String],

  // Phase 6 - Code Gen
  targetCode: [String],
  targetArch: String
});

module.exports = mongoose.model('CompilerSession', CompilerSessionSchema);
