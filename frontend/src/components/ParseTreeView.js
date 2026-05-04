import React, { useState } from 'react';

const NODE_COLORS = {
  Program: '#FA8112',
  VarDecl: '#5bc8f5',
  AssignStmt: '#c9b1ff',
  IfStmt: '#ff9de2',
  WhileStmt: '#78ffd6',
  ReturnStmt: '#a8ff78',
  PrintStmt: '#f5c26b',
  Block: '#8fa8c8',
  BinaryExpr: '#FA8112',
  UnaryExpr: '#ff9de2',
  Identifier: '#5bc8f5',
  Literal: '#a8ff78',
  GroupExpr: '#78ffd6',
  ExprStmt: '#f5c26b',
  Error: '#ff6b6b',
};

function TreeNode({ node, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(depth > 3);
  if (!node || typeof node !== 'object') return null;

  const color = NODE_COLORS[node.type] || '#aaa';
  const hasChildren = (node.children?.length > 0) ||
    (node.body?.length > 0) ||
    node.condition || node.thenBranch || node.elseBranch ||
    node.init || node.value || node.left || node.right ||
    node.operand || node.expr;

  const label = getNodeLabel(node);

  return (
    <div className="tree-node" style={{ '--depth': depth }}>
      <div
        className={`tree-label ${hasChildren ? 'collapsible' : ''}`}
        style={{ '--color': color }}
        onClick={() => hasChildren && setCollapsed(!collapsed)}
      >
        {hasChildren && (
          <span className="tree-toggle">{collapsed ? '▶' : '▼'}</span>
        )}
        <span className="tree-type" style={{ color }}>{node.type}</span>
        {label && <span className="tree-value">{label}</span>}
        {node.inferredType && (
          <span className="tree-inferred">:{node.inferredType}</span>
        )}
        {node.line && <span className="tree-line">L{node.line}</span>}
      </div>

      {!collapsed && hasChildren && (
        <div className="tree-children">
          {node.children?.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1} />)}
          {node.body?.map((c, i) => <TreeNode key={i} node={c} depth={depth + 1} />)}
          {node.condition && (
            <div className="tree-named-child">
              <span className="child-label">condition</span>
              <TreeNode node={node.condition} depth={depth + 1} />
            </div>
          )}
          {node.thenBranch && (
            <div className="tree-named-child">
              <span className="child-label">then</span>
              <TreeNode node={node.thenBranch} depth={depth + 1} />
            </div>
          )}
          {node.elseBranch && (
            <div className="tree-named-child">
              <span className="child-label">else</span>
              <TreeNode node={node.elseBranch} depth={depth + 1} />
            </div>
          )}
          {node.init && (
            <div className="tree-named-child">
              <span className="child-label">init</span>
              <TreeNode node={node.init} depth={depth + 1} />
            </div>
          )}
          {node.value && typeof node.value === 'object' && (
            <div className="tree-named-child">
              <span className="child-label">value</span>
              <TreeNode node={node.value} depth={depth + 1} />
            </div>
          )}
          {node.left && (
            <div className="tree-named-child">
              <span className="child-label">left</span>
              <TreeNode node={node.left} depth={depth + 1} />
            </div>
          )}
          {node.right && (
            <div className="tree-named-child">
              <span className="child-label">right</span>
              <TreeNode node={node.right} depth={depth + 1} />
            </div>
          )}
          {node.operand && (
            <div className="tree-named-child">
              <span className="child-label">operand</span>
              <TreeNode node={node.operand} depth={depth + 1} />
            </div>
          )}
          {node.expr && (
            <div className="tree-named-child">
              <span className="child-label">expr</span>
              <TreeNode node={node.expr} depth={depth + 1} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getNodeLabel(node) {
  if (node.type === 'VarDecl') return `${node.varType} ${node.name}`;
  if (node.type === 'AssignStmt') return `${node.name} ${node.op}`;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal') return `${node.value}`;
  if (node.type === 'BinaryExpr') return node.op;
  if (node.type === 'UnaryExpr') return node.op;
  return '';
}

export default function ParseTreeView({ node }) {
  return (
    <div className="parse-tree-wrap">
      <div className="tree-legend">
        {Object.entries(NODE_COLORS).slice(0, 8).map(([k, v]) => (
          <span key={k} className="legend-item" style={{ color: v }}>● {k}</span>
        ))}
      </div>
      <div className="parse-tree">
        <TreeNode node={node} depth={0} />
      </div>
    </div>
  );
}
