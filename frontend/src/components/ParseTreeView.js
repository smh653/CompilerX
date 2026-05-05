import React, { useState } from 'react'; // Add 'useState' here

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
  
  // Use Array.isArray to prevent the .map error
  const hasBody = Array.isArray(node.body) && node.body.length > 0;

  return (
    <div className="tree-node">
      <div className="node-info" onClick={() => setIsOpen(!isOpen)}>
        {hasBody && <span className="toggle-icon">{isOpen ? '▼' : '▶'}</span>}
        <span className="node-type">{node.type}</span>
        {node.name && <span className="node-name">{node.name}</span>}
        {node.value !== undefined && <span className="node-value">{node.value}</span>}
      </div>
      
      {isOpen && hasBody && (
        <div className="node-body">
          {node.body.map((child, index) => (
            <TreeNode key={index} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}