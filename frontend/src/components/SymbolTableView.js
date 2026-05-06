import React, { useState } from 'react';

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

export default SymbolTableView;