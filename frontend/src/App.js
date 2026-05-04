import React, { useState, useEffect } from 'react';
import './App.css';
import TokenTable from './components/TokenTable';
import ParseTreeView from './components/ParseTreeView';
import SymbolTableView from './components/SymbolTableView';
import ParseTableView from './components/ParseTableView';
import CodeView from './components/CodeView';
import SessionHistory from './components/SessionHistory';

const SAMPLE_CODE = `int x = 10;
int y = 20;
int sum = x + y;

if (sum > 25) {
  int result = sum * 2;
  print(result);
} else {
  print(sum);
}

int i = 0;
while (i < 5) {
  i = i + 1;
  print(i);
}

return sum;`;

const PHASES = [
  { id: 'lexical',      label: '01', name: 'Lexical Analysis',     icon: '◈', desc: 'Tokenization' },
  { id: 'syntax',       label: '02', name: 'Syntax Analysis',       icon: '◉', desc: 'Parse Tree' },
  { id: 'semantic',     label: '03', name: 'Semantic Analysis',     icon: '◍', desc: 'Symbol Table' },
  { id: 'ir',           label: '04', name: 'Intermediate Code',     icon: '◎', desc: 'Three Address Code' },
  { id: 'optimization', label: '05', name: 'Code Optimization',     icon: '◐', desc: 'Optimized IR' },
  { id: 'codeGen',      label: '06', name: 'Code Generation',       icon: '◑', desc: 'x86-64 Assembly' },
];

export default function App() {
  const [source, setSource] = useState(SAMPLE_CODE);
  const [result, setResult] = useState(null);
  const [activePhase, setActivePhase] = useState('lexical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [animating, setAnimating] = useState(false);

  const compile = async () => {
    setLoading(true);
    setError(null);
    setAnimating(true);
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode: source })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Compilation failed');
      setResult(data);
      setActivePhase('lexical');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(false), 600);
    }
  };

  const loadSession = (session) => {
    setResult({
      sessionId: session._id,
      phases: {
        lexical:      { tokens: session.tokens, errors: session.lexicalErrors },
        syntax:       { parseTree: session.parseTree, parseTable: session.parseTable, errors: session.syntaxErrors },
        semantic:     { symbolTable: session.symbolTable, errors: session.semanticErrors, annotatedTree: session.annotatedTree },
        ir:           { code: session.intermediateCode, type: session.irType },
        optimization: { code: session.optimizedCode, optimizations: session.optimizations },
        codeGen:      { code: session.targetCode, arch: session.targetArch }
      }
    });
    setSource(session.sourceCode);
    setShowHistory(false);
    setActivePhase('lexical');
  };

  const totalErrors = result ? (
    (result.phases.lexical.errors?.length || 0) +
    (result.phases.syntax.errors?.length || 0) +
    (result.phases.semantic.errors?.length || 0)
  ) : 0;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">COMPILERX</span>
          </div>
          <span className="header-sub">Six-Phase Compiler Visualizer</span>
        </div>
        <div className="header-right">
          <button className="btn-ghost" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '× Close History' : '⊞ History'}
          </button>
        </div>
      </header>

      <div className="main-layout">
        {/* Left: Editor */}
        <div className="editor-panel">
          <div className="panel-header">
            <span>SOURCE CODE</span>
            <span className="badge">Simple C-like</span>
          </div>
          <textarea
            className="code-editor"
            value={source}
            onChange={e => setSource(e.target.value)}
            spellCheck={false}
            placeholder="Write your code here..."
          />
          <div className="editor-footer">
            <span className="line-count">{source.split('\n').length} lines</span>
            <button
              className={`compile-btn ${loading ? 'loading' : ''}`}
              onClick={compile}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" /> Compiling...</>
              ) : (
                <><span>▶</span> Compile</>
              )}
            </button>
          </div>
        </div>

        {/* Center: Phase pipeline */}
        <div className="pipeline-panel">
          {showHistory ? (
            <SessionHistory onLoad={loadSession} onClose={() => setShowHistory(false)} />
          ) : (
            <>
              {/* Phase tabs */}
              <div className="phase-tabs">
                {PHASES.map((phase, idx) => {
                  const phaseData = result?.phases[phase.id];
                  const hasError = phaseData?.errors?.length > 0;
                  const isActive = activePhase === phase.id;
                  const isDone = result != null;
                  return (
                    <button
                      key={phase.id}
                      className={`phase-tab ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${hasError ? 'has-error' : ''}`}
                      onClick={() => result && setActivePhase(phase.id)}
                      disabled={!result}
                    >
                      <span className="phase-num">{phase.label}</span>
                      <span className="phase-icon">{phase.icon}</span>
                      <span className="phase-name">{phase.name}</span>
                      <span className="phase-desc">{phase.desc}</span>
                      {hasError && <span className="error-dot" />}
                    </button>
                  );
                })}
              </div>

              {/* Output area */}
              <div className={`output-area ${animating ? 'fade-in' : ''}`}>
                {!result && !error && (
                  <div className="empty-state">
                    <div className="empty-icon">⬡</div>
                    <div className="empty-title">Ready to Compile</div>
                    <div className="empty-desc">Write or edit the source code on the left, then click <strong>Compile</strong> to see all six phases of compilation visualized here.</div>
                    <div className="phase-pills">
                      {PHASES.map(p => (
                        <span key={p.id} className="phase-pill">{p.icon} {p.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="error-banner">
                    <span>⚠</span> {error}
                  </div>
                )}

                {result && (
                  <PhaseOutput phase={activePhase} data={result.phases} />
                )}
              </div>

              {/* Stats bar */}
              {result && (
                <div className="stats-bar">
                  <span>Session: <code>{result.sessionId?.slice(-8) || 'local'}</code></span>
                  <span>Tokens: <strong>{result.phases.lexical.tokens?.length}</strong></span>
                  <span>IR Lines: <strong>{result.phases.ir.code?.length}</strong></span>
                  <span>Opt Lines: <strong>{result.phases.optimization.code?.length}</strong></span>
                  <span className={totalErrors > 0 ? 'stat-error' : 'stat-ok'}>
                    {totalErrors > 0 ? `⚠ ${totalErrors} error(s)` : '✓ No errors'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseOutput({ phase, data }) {
  switch (phase) {
    case 'lexical':
      return (
        <div className="phase-content">
          <div className="phase-header-bar">
            <h2>Phase 1 — Lexical Analysis</h2>
            <p>The source code is scanned and broken into <strong>tokens</strong>. Each token has a type, value, and source location.</p>
          </div>
          {data.lexical.errors?.length > 0 && (
            <ErrorList errors={data.lexical.errors} label="Lexical Errors" />
          )}
          <TokenTable tokens={data.lexical.tokens} />
        </div>
      );

    case 'syntax':
      return (
        <div className="phase-content">
          <div className="phase-header-bar">
            <h2>Phase 2 — Syntax Analysis</h2>
            <p>Tokens are parsed against the grammar. A <strong>parse tree</strong> is constructed and the <strong>LL(1) parse table</strong> is recorded.</p>
          </div>
          {data.syntax.errors?.length > 0 && (
            <ErrorList errors={data.syntax.errors} label="Syntax Errors" />
          )}
          <div className="two-col">
            <div>
              <div className="section-label">Parse Tree</div>
              <ParseTreeView node={data.syntax.parseTree} />
            </div>
            <div>
              <div className="section-label">LL(1) Parse Table</div>
              <ParseTableView entries={data.syntax.parseTable} />
            </div>
          </div>
        </div>
      );

    case 'semantic':
      return (
        <div className="phase-content">
          <div className="phase-header-bar">
            <h2>Phase 3 — Semantic Analysis</h2>
            <p>Type checking, scope resolution, and symbol table construction. Variables are validated for declaration and type compatibility.</p>
          </div>
          {data.semantic.errors?.length > 0 && (
            <ErrorList errors={data.semantic.errors} label="Semantic Errors" />
          )}
          {data.semantic.errors?.length === 0 && (
            <div className="success-banner">✓ No semantic errors detected</div>
          )}
          <SymbolTableView scopes={data.semantic.symbolTable} />
        </div>
      );

    case 'ir':
      return (
        <div className="phase-content">
          <div className="phase-header-bar">
            <h2>Phase 4 — Intermediate Code Generation</h2>
            <p>The annotated AST is translated to <strong>Three Address Code (TAC)</strong> — a linear, platform-independent representation.</p>
          </div>
          <div className="ir-type-badge">{data.ir.type}</div>
          <CodeView lines={data.ir.code} language="tac" />
        </div>
      );

    case 'optimization':
      return (
        <div className="phase-content">
          <div className="phase-header-bar">
            <h2>Phase 5 — Code Optimization</h2>
            <p>The IR is improved using <strong>constant folding</strong>, <strong>copy propagation</strong>, <strong>dead code elimination</strong>, and <strong>CSE</strong>.</p>
          </div>
          <div className="opt-list">
            {data.optimization.optimizations?.length > 0
              ? data.optimization.optimizations.map((o, i) => (
                  <div key={i} className="opt-item">
                    <span className="opt-icon">⚡</span>
                    <span>{o}</span>
                  </div>
                ))
              : <div className="opt-item"><span className="opt-icon">—</span> No optimizations applied (code already optimal)</div>
            }
          </div>
          <CodeView lines={data.optimization.code} language="tac" />
        </div>
      );

    case 'codeGen':
      return (
        <div className="phase-content">
          <div className="phase-header-bar">
            <h2>Phase 6 — Code Generation</h2>
            <p>Optimized IR is translated to <strong>{data.codeGen.arch}</strong>. Variables are mapped to stack locations and instructions are emitted.</p>
          </div>
          <div className="ir-type-badge">{data.codeGen.arch}</div>
          <CodeView lines={data.codeGen.code} language="asm" />
        </div>
      );

    default:
      return null;
  }
}

function ErrorList({ errors, label }) {
  return (
    <div className="error-list">
      <div className="error-list-label">⚠ {label} ({errors.length})</div>
      {errors.map((e, i) => <div key={i} className="error-item">{e}</div>)}
    </div>
  );
}
