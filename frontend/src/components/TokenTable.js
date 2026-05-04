import React, { useState } from 'react';

const TYPE_COLORS = {
  KEYWORD:    '#FA8112',
  IDENTIFIER: '#5bc8f5',
  INTEGER:    '#a8ff78',
  FLOAT:      '#78ffd6',
  STRING:     '#f5c26b',
  BOOLEAN:    '#ff9de2',
  OPERATOR:   '#c9b1ff',
  DELIMITER:  '#8fa8c8',
  EOF:        '#666',
  ERROR:      '#ff6b6b',
};

export default function TokenTable({ tokens = [] }) {
  const [filter, setFilter] = useState('ALL');
  const types = ['ALL', ...new Set(tokens.map(t => t.type))];
  const filtered = filter === 'ALL' ? tokens : tokens.filter(t => t.type === filter);

  return (
    <div className="token-section">
      <div className="token-stats">
        {types.filter(t => t !== 'ALL').map(type => {
          const count = tokens.filter(t => t.type === type).length;
          return (
            <button
              key={type}
              className={`type-filter ${filter === type ? 'active' : ''}`}
              style={{ '--accent': TYPE_COLORS[type] || '#888' }}
              onClick={() => setFilter(filter === type ? 'ALL' : type)}
            >
              <span className="type-dot" />
              {type} <span className="type-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="token-count">
        Showing {filtered.length} of {tokens.length} tokens
      </div>

      <div className="token-grid-wrap">
        <table className="token-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Value</th>
              <th>Line</th>
              <th>Col</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tok, i) => (
              <tr key={i} className={tok.type === 'ERROR' ? 'row-error' : ''}>
                <td className="num-cell">{i + 1}</td>
                <td>
                  <span className="token-badge" style={{ background: (TYPE_COLORS[tok.type] || '#888') + '22', color: TYPE_COLORS[tok.type] || '#888', border: `1px solid ${TYPE_COLORS[tok.type] || '#888'}44` }}>
                    {tok.type}
                  </span>
                </td>
                <td><code className="token-val">{tok.value}</code></td>
                <td className="num-cell">{tok.line}</td>
                <td className="num-cell">{tok.col}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
