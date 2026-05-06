import React, { useState, useEffect } from 'react';

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

export default SessionHistory;