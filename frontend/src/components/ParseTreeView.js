import React, { useMemo } from 'react';
import Tree from 'react-d3-tree';

export default function ParseTreeView({ node }) {
  // Transformation helper to convert 'body' to 'children' and sanitize values
  const transformData = (n) => {
    if (!n) return null;

    // Safety: Extract only strings/numbers for the 'name' property
    // This prevents the "Objects are not valid as React child" error
    const label = typeof n.type === 'string' ? n.type : 'Node';
    
    // Determine the subtitle/value (e.g., variable name or literal value)
    let val = '';
    if (typeof n.name === 'string') val = n.name;
    else if (typeof n.value !== 'object' && n.value !== undefined) val = String(n.value);

    return {
      name: label,
      attributes: {
        info: val,
        type: typeof n.inferredType === 'string' ? n.inferredType : ''
      },
      // Recursively transform children from the 'body' array
      children: Array.isArray(n.body) 
        ? n.body.map(transformData).filter(Boolean) 
        : []
    };
  };

  const treeData = useMemo(() => transformData(node), [node]);

  if (!treeData) return <div className="empty-tree">No tree data</div>;

  return (
    <div className="tree-container" style={{ width: '100%', height: '600px', background: '#1a1a1a' }}>
      <Tree 
        data={treeData}
        orientation="vertical"
        pathFunc="step" // Gives those sharp 90-degree angles from your sample
        translate={{ x: 300, y: 50 }}
        nodeSize={{ x: 200, y: 120 }}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        renderCustomNodeElement={renderCustomNode}
      />
    </div>
  );
}

// Custom SVG renderer to match the look of image_1241f7.png
const renderCustomNode = ({ nodeDatum, toggleNode }) => (
  <g>
    {/* The main circular node */}
    <circle r="20" fill="#FA8112" stroke="#fff" strokeWidth="2" onClick={toggleNode} />
    
    {/* Node Type (e.g., Program, VarDecl) */}
    <text 
      fill="#ffffff" 
      x="25" 
      y="5" 
      fontSize="14" 
      fontWeight="bold" 
      style={{ paintOrder: 'stroke', stroke: '#1a1a1a', strokeWidth: '3px' }}
    >
      {nodeDatum.name}
    </text>

    {/* The specific value (e.g., 'x' or '10') */}
    {nodeDatum.attributes?.info && (
      <text fill="#a8ff78" x="25" y="22" fontSize="12">
        {nodeDatum.attributes.info}
      </text>
    )}
    
    {/* The inferred type from Semantic Analysis */}
    {nodeDatum.attributes?.type && (
      <text fill="#5bc8f5" x="25" y="36" fontSize="11" fontStyle="italic">
        ({nodeDatum.attributes.type})
      </text>
    )}
  </g>
);