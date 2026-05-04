import React, { useState, useEffect } from 'react';

// ===== Symbol Table =====
export function SymbolTableView({ scopes = [] }) {
  const [activeScope, setActiveScope] = useState(0);
  const scope = scopes[activeScope];

  return (
    <div className="symbol-section">
      <div className="scope-tabs">
        {scopes.map((s, i) => (
          <button
            key={i}
            className={`scope-tab ${activeScope === i ? 'active' : ''}`}
            onClick={() => setActiveScope(i)}
          >
            {s.scope}
            <span className="scope-count">{Object.keys(s.symbols || {}).length}</span>
          </button>
        ))}
      </div>

      {scope && (
        <div className="symbol-table-wrap">
          {scope.parent && (
            <div className="scope-parent">Parent scope: <code>{scope.parent}</code></div>
          )}
          {Object.keys(scope.symbols || {}).length === 0 ? (
            <div className="empty-scope">No symbols in this scope</div>
          ) : (
            <table className="symbol-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Initialized</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(scope.symbols).map(([name, info]) => (
                  <tr key={name}>
                    <td><code className="sym-name">{name}</code></td>
                    <td><span className="type-pill">{info.type}</span></td>
                    <td>
                      <span className={info.initialized ? 'init-yes' : 'init-no'}>
                        {info.initialized ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td className="num-cell">{info.line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Parse Table =====
export function ParseTableView({ entries = [] }) {
  const [filterNT, setFilterNT] = useState('');
  const nonTerminals = [...new Set(entries.map(e => e.nonTerminal))];
  const filtered = filterNT
    ? entries.filter(e => e.nonTerminal === filterNT)
    : entries;

  return (
    <div className="parse-table-wrap">
      <div className="nt-filter">
        <select
          value={filterNT}
          onChange={e => setFilterNT(e.target.value)}
          className="nt-select"
        >
          <option value="">All Non-Terminals ({entries.length})</option>
          {nonTerminals.map(nt => (
            <option key={nt} value={nt}>{nt}</option>
          ))}
        </select>
      </div>
      <div className="parse-table-scroll">
        <table className="parse-table">
          <thead>
            <tr>
              <th>Non-Terminal</th>
              <th>Terminal</th>
              <th>Production Rule</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={i}>
                <td><span className="nt-badge">{e.nonTerminal}</span></td>
                <td><code className="terminal-val">{e.terminal}</code></td>
                <td><code className="production-val">{e.production}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== Code View =====
export function CodeView({ lines = [], language = 'tac' }) {
  const isComment = (l) => l.trim().startsWith(';') || l.trim().startsWith('#');
  const isLabel = (l) => /^L\d+:$/.test(l.trim());
  const isDirective = (l) => l.trim().startsWith('.');

  return (
    <div className="code-view">
      <div className="code-toolbar">
        <span className="code-lang">{language.toUpperCase()}</span>
        <span className="code-lines">{lines.length} lines</span>
      </div>
      <div className="code-scroll">
        <table className="code-table">
          <tbody>
            {lines.map((line, i) => {
              let cls = 'code-line';
              if (isComment(line)) cls += ' line-comment';
              else if (isLabel(line)) cls += ' line-label';
              else if (isDirective(line)) cls += ' line-directive';
              else if (line.includes('=')) cls += ' line-assign';
              else if (line.startsWith('    j') || line.startsWith('goto')) cls += ' line-jump';

              return (
                <tr key={i} className={cls}>
                  <td className="line-num">{i + 1}</td>
                  <td className="line-content">
                    <HighlightedLine line={line} language={language} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HighlightedLine({ line, language }) {
  // 1. Safety check: If the line itself is missing, return empty
  if (!line) return <code></code>;

  if (language === 'asm') {
    const parts = line.split(/(;.*$|%\w+|\$[\d\w-]+|\b(movl|movq|addl|subl|imull|idivl|cmpl|jmp|je|jne|jl|jg|call|ret|leave|pushq|popq|cdq|xorl|orl|andl|sete|setne|setl|setg|setle|setge|movzbl|subq|leaq)\b)/g);
    return (
      <code>
        {parts.map((p, i) => {
          // Added checks to ensure 'p' exists before calling .startsWith
          if (p?.startsWith(';')) return <span key={i} style={{color:'#666'}}>{p}</span>;
          if (p?.startsWith('%')) return <span key={i} style={{color:'#5bc8f5'}}>{p}</span>;
          if (p?.startsWith('$')) return <span key={i} style={{color:'#a8ff78'}}>{p}</span>;
          if (p && /^(movl|movq|addl|subl|imull|idivl|cmpl|jmp|je|jne|jl|jg|call|ret|leave|pushq|popq|cdq|xorl|orl|andl|sete|setne|setl|setg|setle|setge|movzbl|subq|leaq)$/.test(p))
            return <span key={i} style={{color:'#FA8112'}}>{p}</span>;
          return <span key={i}>{p}</span>;
        })}
      </code>
    );
  }

  // TAC highlight
  const parts = line.split(/(#.*$|if_false|goto|return|print|\bt\d+\b|L\d+:?|[+\-*\/%=!<>&|]{1,2})/g);
  return (
    <code>
      {parts.map((p, i) => {
        // Added 'p &&' to ensure the part exists before checking content
        if (p?.startsWith('#')) return <span key={i} style={{color:'#555'}}>{p}</span>;
        if (p && ['if_false','goto','return','print'].includes(p)) return <span key={i} style={{color:'#FA8112'}}>{p}</span>;
        if (p && /^t\d+$/.test(p)) return <span key={i} style={{color:'#c9b1ff'}}>{p}</span>;
        if (p && /^L\d+:?$/.test(p)) return <span key={i} style={{color:'#5bc8f5',fontWeight:'bold'}}>{p}</span>;
        if (p && /^[+\-*\/%=!<>&|]{1,2}$/.test(p)) return <span key={i} style={{color:'#FA8112'}}>{p}</span>;
        return <span key={i}>{p}</span>;
      })}
    </code>
  );
}

// ===== Session History =====
export function SessionHistory({ onLoad, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    setSessions(s => s.filter(x => x._id !== id));
  };

  const loadFull = async (id) => {
    const res = await fetch(`/api/sessions/${id}`);
    const data = await res.json();
    onLoad(data);
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Compilation History</h3>
        <span className="history-count">{sessions.length} sessions</span>
      </div>
      {loading && <div className="loading-msg">Loading...</div>}
      {!loading && sessions.length === 0 && (
        <div className="empty-history">No saved sessions yet. Compile some code!</div>
      )}
      <div className="history-list">
        {sessions.map(s => {
          const errorCount = (s.lexicalErrors?.length || 0) + (s.syntaxErrors?.length || 0) + (s.semanticErrors?.length || 0);
          return (
            <div key={s._id} className="history-item" onClick={() => loadFull(s._id)}>
              <div className="history-code">
                <code>{s.sourceCode?.split('\n')[0]?.slice(0, 50)}...</code>
              </div>
              <div className="history-meta">
                <span className="history-date">
                  {new Date(s.createdAt).toLocaleString()}
                </span>
                <span className={errorCount > 0 ? 'stat-error' : 'stat-ok'}>
                  {errorCount > 0 ? `⚠ ${errorCount} error(s)` : '✓ Clean'}
                </span>
                <button
                  className="delete-btn"
                  onClick={(e) => deleteSession(s._id, e)}
                  title="Delete"
                >×</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
