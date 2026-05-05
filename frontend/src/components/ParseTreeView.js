import React, { useState } from 'react';

export default function ParseTreeView({ node }) {
  if (!node) return <div className="empty-tree">No tree data</div>;
  return (
    <div className="tree-root">
      <TreeNode node={node} />
    </div>
  );
}

function TreeNode({ node }) {
  const [isOpen, setIsOpen] = useState(true);
  
  // Standardize children access
  const children = Array.isArray(node?.body) 
    ? node.body 
    : (node?.children && Array.isArray(node.children)) 
      ? node.children 
      : [];

  const hasBody = children.length > 0;

  // Helper: Ensures we only try to render strings, numbers, or booleans
  const getSafeValue = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'object') return val.name || val.value || null; 
    return String(val);
  };

  const safeName = getSafeValue(node?.name);
  const safeValue = getSafeValue(node?.value);
  const safeType = getSafeValue(node?.inferredType);

  return (
    <div className="tree-node">
      <div className="node-info" onClick={() => setIsOpen(!isOpen)}>
        {hasBody && <span className="toggle-icon">{isOpen ? '▼' : '▶'}</span>}
        <span className="node-type">{node?.type || 'Node'}</span>
        
        {safeName && <span className="node-name"> {safeName}</span>}
        
        {safeValue !== null && <span className="node-value"> : {safeValue}</span>}

        {safeType && (
          <span className="node-type-pill" style={{ marginLeft: '8px', opacity: 0.7 }}>
            [{safeType}]
          </span>
        )}
      </div>
      
      {isOpen && hasBody && (
        <div className="node-body" style={{ paddingLeft: '20px' }}>
          {children.map((child, index) => (
            child ? <TreeNode key={index} node={child} /> : null
          ))}
        </div>
      )}
    </div>
  );
}