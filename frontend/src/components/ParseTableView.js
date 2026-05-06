import React, { useState } from 'react';

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

export default ParseTableView;