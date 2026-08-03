import React, { useState, useMemo, useRef, useCallback } from 'react';

/**
 * Force-directed SVG graph of Characters + Lore + Connections.
 */
export default function RelationshipMap({ characters, lore, connections }) {
  const svgRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  // Build nodes and edges
  const { nodes, edges } = useMemo(() => {
    const nodeList = [];
    characters.forEach(c => nodeList.push({ id: c.id, type: 'character', name: c.name, color: c.color || '#6366f1' }));
    lore.forEach(l => nodeList.push({ id: l.id, type: 'lore', name: l.name, color: '#f59e0b' }));

    const edgeList = connections
      .filter(c => c.source_type === 'character' || c.source_type === 'lore')
      .map(c => ({
        id: c.id,
        source: c.source_id,
        target: c.target_id,
        label: c.relationship_type,
        strength: c.strength || 50,
      }));

    // Simple force simulation (pre-computed)
    const width = 600;
    const height = 400;
    const positions = {};

    // Initial random positions
    nodeList.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodeList.length;
      const r = Math.min(width, height) * 0.3;
      positions[n.id] = {
        x: width / 2 + r * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: height / 2 + r * Math.sin(angle) + (Math.random() - 0.5) * 40,
      };
    });

    // Run simple force iterations
    for (let iter = 0; iter < 100; iter++) {
      // Repulsion between all nodes
      for (let i = 0; i < nodeList.length; i++) {
        for (let j = i + 1; j < nodeList.length; j++) {
          const a = positions[nodeList[i].id];
          const b = positions[nodeList[j].id];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(10, Math.sqrt(dx * dx + dy * dy));
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.x -= fx;
          a.y -= fy;
          b.x += fx;
          b.y += fy;
        }
      }

      // Attraction along edges
      edgeList.forEach(e => {
        const a = positions[e.source];
        const b = positions[e.target];
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const springLen = 120 - (e.strength / 100) * 50;
        const force = (dist - springLen) * 0.01;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.x += fx;
        a.y += fy;
        b.x -= fx;
        b.y -= fy;
      });

      // Center gravity
      nodeList.forEach(n => {
        const p = positions[n.id];
        p.x += (width / 2 - p.x) * 0.01;
        p.y += (height / 2 - p.y) * 0.01;
      });
    }

    const computedNodes = nodeList.map(n => ({ ...n, ...positions[n.id] }));
    return { nodes: computedNodes, edges: edgeList };
  }, [characters, lore, connections]);

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Add characters and connections in the Story Bible to see the relationship map.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <svg ref={svgRef} viewBox="0 0 600 400" className="w-full h-full">
        {/* Edges */}
        {edges.map(edge => {
          const src = nodes.find(n => n.id === edge.source);
          const tgt = nodes.find(n => n.id === edge.target);
          if (!src || !tgt) return null;
          const opacity = 0.3 + (edge.strength / 100) * 0.5;
          const width = 1 + (edge.strength / 100) * 2;
          return (
            <g key={edge.id}>
              <line
                x1={src.x} y1={src.y}
                x2={tgt.x} y2={tgt.y}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={width}
                opacity={opacity}
              />
              {hovered === edge.id && (
                <text
                  x={(src.x + tgt.x) / 2}
                  y={(src.y + tgt.y) / 2 - 5}
                  textAnchor="middle"
                  className="text-[9px] fill-foreground"
                >
                  {edge.label}
                </text>
              )}
              {/* Hover zone */}
              <line
                x1={src.x} y1={src.y}
                x2={tgt.x} y2={tgt.y}
                stroke="transparent"
                strokeWidth={10}
                onMouseEnter={() => setHovered(edge.id)}
                onMouseLeave={() => setHovered(null)}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x} cy={node.y}
              r={node.type === 'character' ? 14 : 10}
              fill={node.color}
              stroke="hsl(var(--background))"
              strokeWidth={2}
              className="cursor-pointer"
            />
            <text
              x={node.x} y={node.y + (node.type === 'character' ? 24 : 20)}
              textAnchor="middle"
              className="text-[8px] fill-foreground font-medium"
            >
              {node.name.length > 12 ? node.name.slice(0, 12) + '...' : node.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
