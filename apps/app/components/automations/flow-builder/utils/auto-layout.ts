import type { Edge, Node } from '@xyflow/react';
import type { AutomationStep, TriggerStep } from './flow-types';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 100;
const TRIGGER_SECTION_Y = 0;
const STEPS_START_Y = 160;

interface LayoutNode {
  id: string;
  width: number;
  height: number;
  children: LayoutNode[];
  branch?: 'yes' | 'no';
}

/**
 * Convert step-based data into React Flow nodes and edges for rendering.
 * Positions are computed — never stored.
 */
export function stepsToFlow(
  triggers: TriggerStep[],
  steps: AutomationStep[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  // --- Trigger nodes (horizontal row at top) ---
  const triggerGroupWidth =
    triggers.length * NODE_WIDTH + (triggers.length - 1) * HORIZONTAL_GAP;
  const triggerStartX = -triggerGroupWidth / 2 + NODE_WIDTH / 2;

  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    nodes.push({
      id: trigger.id,
      type: 'trigger',
      position: {
        x: triggerStartX + i * (NODE_WIDTH + HORIZONTAL_GAP),
        y: TRIGGER_SECTION_Y,
      },
      data: { step: trigger },
    });
  }

  // --- Build step tree from first trigger's nextStepId ---
  // All triggers share the same step chain (OR logic — any trigger fires it)
  const rootStepId = triggers[0]?.nextStepId;
  if (!rootStepId) {
    return { nodes, edges };
  }

  // Connect all triggers to the root step
  for (const trigger of triggers) {
    if (trigger.nextStepId) {
      edges.push({
        id: `edge-${trigger.id}-${trigger.nextStepId}`,
        source: trigger.id,
        target: trigger.nextStepId,
        type: 'smoothstep',
      });
    }
  }

  // Recursively layout the step tree
  const { layoutNodes, layoutEdges } = layoutStepTree(rootStepId, stepMap);

  // Center the step tree below triggers
  const treeWidth = getSubtreeWidth(buildLayoutTree(rootStepId, stepMap));
  const treeOffsetX = -treeWidth / 2 + NODE_WIDTH / 2;

  positionLayoutNodes(layoutNodes, treeOffsetX, STEPS_START_Y);

  nodes.push(...layoutNodes);
  edges.push(...layoutEdges);

  return { nodes, edges };
}

function buildLayoutTree(
  stepId: string,
  stepMap: Map<string, AutomationStep>,
  visited = new Set<string>()
): LayoutNode | null {
  if (visited.has(stepId)) {
    return null;
  }
  visited.add(stepId);

  const step = stepMap.get(stepId);
  if (!step) {
    return null;
  }

  const node: LayoutNode = {
    id: step.id,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    children: [],
  };

  if (step.type === 'condition') {
    if (step.yesStepId) {
      const yesChild = buildLayoutTree(step.yesStepId, stepMap, visited);
      if (yesChild) {
        yesChild.branch = 'yes';
        node.children.push(yesChild);
      }
    }
    if (step.noStepId) {
      const noChild = buildLayoutTree(step.noStepId, stepMap, visited);
      if (noChild) {
        noChild.branch = 'no';
        node.children.push(noChild);
      }
    }
  } else if (step.type === 'send_dm' && step.nextStepId) {
    const nextChild = buildLayoutTree(step.nextStepId, stepMap, visited);
    if (nextChild) {
      node.children.push(nextChild);
    }
  }

  return node;
}

function getSubtreeWidth(node: LayoutNode | null): number {
  if (!node) {
    return 0;
  }
  if (node.children.length === 0) {
    return NODE_WIDTH;
  }

  const childrenWidth = node.children.reduce(
    (sum, child) => sum + getSubtreeWidth(child),
    0
  );
  const gaps = Math.max(0, node.children.length - 1) * HORIZONTAL_GAP;

  return Math.max(NODE_WIDTH, childrenWidth + gaps);
}

function layoutStepTree(
  rootId: string,
  stepMap: Map<string, AutomationStep>
): { layoutNodes: Node[]; layoutEdges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function walk(stepId: string, visited: Set<string>) {
    if (visited.has(stepId)) {
      return;
    }
    visited.add(stepId);

    const step = stepMap.get(stepId);
    if (!step) {
      return;
    }

    const nodeType = step.type === 'condition' ? 'condition' : 'send_dm';
    nodes.push({
      id: step.id,
      type: nodeType,
      position: { x: 0, y: 0 }, // will be positioned later
      data: { step },
    });

    if (step.type === 'condition') {
      if (step.yesStepId) {
        edges.push({
          id: `edge-${step.id}-yes-${step.yesStepId}`,
          source: step.id,
          target: step.yesStepId,
          sourceHandle: 'yes',
          type: 'smoothstep',
          label: 'Yes',
        });
        walk(step.yesStepId, visited);
      }
      if (step.noStepId) {
        edges.push({
          id: `edge-${step.id}-no-${step.noStepId}`,
          source: step.id,
          target: step.noStepId,
          sourceHandle: 'no',
          type: 'smoothstep',
          label: 'No',
        });
        walk(step.noStepId, visited);
      }
    } else if (step.type === 'send_dm' && step.nextStepId) {
      edges.push({
        id: `edge-${step.id}-${step.nextStepId}`,
        source: step.id,
        target: step.nextStepId,
        type: 'smoothstep',
      });
      walk(step.nextStepId, visited);
    }
  }

  walk(rootId, new Set());
  return { layoutNodes: nodes, layoutEdges: edges };
}

/**
 * Position nodes using the layout tree structure.
 * Each node is centered over its subtree.
 */
function positionLayoutNodes(nodes: Node[], startX: number, startY: number) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build parent→children relationships from edges
  // We need to recompute the tree for positioning
  // For simplicity, do a topological sort based on the nodes array order
  // and position them in a simple vertical chain or branching layout

  const _y = startY;
  const positioned = new Set<string>();

  function positionNode(nodeId: string, x: number, currentY: number): number {
    if (positioned.has(nodeId)) {
      return currentY;
    }
    positioned.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) {
      return currentY;
    }

    node.position = { x, y: currentY };
    const step = node.data.step as AutomationStep;

    if (step.type === 'condition') {
      const nextY = currentY + NODE_HEIGHT + VERTICAL_GAP;
      const hasYes = step.yesStepId && nodeMap.has(step.yesStepId);
      const hasNo = step.noStepId && nodeMap.has(step.noStepId);

      if (hasYes && hasNo) {
        // Two branches: offset left and right
        const offset = (NODE_WIDTH + HORIZONTAL_GAP) / 2;
        const afterYes = positionNode(step.yesStepId!, x - offset, nextY);
        const afterNo = positionNode(step.noStepId!, x + offset, nextY);
        return Math.max(afterYes, afterNo);
      }
      if (hasYes) {
        return positionNode(step.yesStepId!, x, nextY);
      }
      if (hasNo) {
        return positionNode(step.noStepId!, x, nextY);
      }
      return nextY;
    }

    if (
      step.type === 'send_dm' &&
      step.nextStepId &&
      nodeMap.has(step.nextStepId)
    ) {
      return positionNode(
        step.nextStepId,
        x,
        currentY + NODE_HEIGHT + VERTICAL_GAP
      );
    }

    return currentY + NODE_HEIGHT + VERTICAL_GAP;
  }

  // Find root step (first node that isn't a child of another node)
  if (nodes.length > 0) {
    positionNode(nodes[0].id, startX, startY);
  }
}
