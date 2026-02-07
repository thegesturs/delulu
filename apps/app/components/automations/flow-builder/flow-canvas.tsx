"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ConditionNode } from "./nodes/condition-node";
import { SendDmNode } from "./nodes/send-dm-node";
import { TriggerNode } from "./nodes/trigger-node";

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  send_dm: SendDmNode,
};

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (nodeId: string) => void;
}

export function FlowCanvas({ nodes, edges, onNodeClick }: FlowCanvasProps) {
  return (
    <ReactFlow
      edges={edges}
      elementsSelectable={true}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      maxZoom={1.5}
      minZoom={0.3}
      nodes={nodes}
      nodesConnectable={false}
      nodesDraggable={false}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onNodeClick(node.id)}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} size={1} variant={BackgroundVariant.Dots} />
      <Controls showInteractive={false} />
      <MiniMap className="!bg-background !border-border" nodeStrokeWidth={3} />
    </ReactFlow>
  );
}
