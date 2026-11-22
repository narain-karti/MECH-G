// Hairline UI · workflow-canvas · MIT License
// Copyright (c) 2026 Hairline UI · https://hairlineui.com/license#components

'use client';

import * as React from 'react';
import { Circle, Maximize2, Minus, Plus } from 'lucide-react';
import { WorkflowConnections } from './workflow-connections';
import { useWorkflowViewport } from './use-workflow-viewport';
import { INTERACTION_FOCUS, useInteractionReducedMotion, useInteractionActivity } from './ui-interaction-motion';
import { WorkflowStatusMark, WORKFLOW_STATUS as STATUS } from './workflow-status';
import { WorkflowInspector } from './workflow-inspector';
import { NumberRoll } from './number-roll';
import { TextMorph } from './text-morph';
import { NODE_WIDTH, NODE_HEIGHT, type WorkflowNode, type WorkflowEdge, type WorkflowPoint } from './workflow-types';
export type { WorkflowNode, WorkflowEdge, WorkflowPoint, WorkflowStatus } from './workflow-types';

export interface WorkflowCanvasProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  width?: number;
  height?: number;
  label?: string;
  onNodeMove?: (id: string, position: WorkflowPoint) => void;
  onNodeSelect?: (id: string | null) => void;
}
const CONTROL = `cursor-pointer disabled:cursor-default flex size-8 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#1E1F24] hover:text-white disabled:opacity-30 ${INTERACTION_FOCUS}`;

interface WorkflowNodeButtonProps {
  node: WorkflowNode;
  index: number;
  nodes: WorkflowNode[];
  selected: boolean;
  detailsId: string;
  position: WorkflowPoint;
  reduced: boolean;
  active: boolean;
  onChoose: (id: string | null) => void;
  onReveal: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onFocusNode: (id: string) => void;
  onRegister: (id: string, el: HTMLButtonElement | null) => void;
}

function WorkflowNodeButton({
  node,
  index,
  nodes,
  selected,
  detailsId,
  position,
  reduced,
  active,
  onChoose,
  onReveal,
  onMove,
  onFocusNode,
  onRegister,
}: WorkflowNodeButtonProps) {
  const status = node.status ?? 'idle';
  return (
    <button
      key={node.id}
      type="button"
      ref={(el) => onRegister(node.id, el)}
      data-workflow-node={node.id}
      aria-label={`${node.title}, ${STATUS[status]}`}
      aria-expanded={selected}
      aria-controls={selected ? detailsId : undefined}
      onClick={() => onChoose(selected ? null : node.id)}
      onFocus={() => onReveal(node.id)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onChoose(null);
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (event.altKey) {
            onMove(node.id, event.key === 'ArrowRight' ? 12 : event.key === 'ArrowLeft' ? -12 : 0, event.key === 'ArrowDown' ? 12 : event.key === 'ArrowUp' ? -12 : 0);
            return;
          }
          const offset = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
          onFocusNode(nodes[(index + offset + nodes.length) % nodes.length].id);
        }
      }}
      className={`cursor-pointer absolute left-0 top-0 flex flex-col justify-between rounded-xl border bg-[#18181A] px-3 py-2.5 text-left text-white transition-[border-color] duration-300 shadow-md ${INTERACTION_FOCUS} ${
        status === 'error' ? 'border-rose-500/50' : selected || status === 'running' ? 'border-cyan-400 ring-1 ring-cyan-400/40' : 'border-[#27272A]'
      }`}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT, transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <span className="flex w-full items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-[#27272A] bg-[#141518] text-[#22D3EE]">
          {node.icon ?? <Circle className="size-3" aria-hidden="true" />}
        </span>
        <span className="truncate text-[12px] font-semibold text-white">
          <TextMorph>{node.title}</TextMorph>
        </span>
      </span>
      <span className="flex w-full items-center justify-between gap-2">
        <span className="truncate text-[11px] font-mono text-[#9CA3AF]">
          <TextMorph>{node.subtitle ?? STATUS[status]}</TextMorph>
        </span>
        <WorkflowStatusMark status={status} reduced={reduced} active={active} />
      </span>
    </button>
  );
}

export function WorkflowCanvas({ nodes, edges, width = 660, height = 340, label = 'Workflow', onNodeMove, onNodeSelect, className = '', ...props }: WorkflowCanvasProps) {
  const reduced = useInteractionReducedMotion();
  const { ref: activityRef, active } = useInteractionActivity<HTMLDivElement>();
  const [selected, setSelected] = React.useState<string | null>(null);
  const nodeRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const canvasWidth = Math.max(NODE_WIDTH, width), canvasHeight = Math.max(NODE_HEIGHT, height);
  const { viewport, world, positions, view, dragging, fit, zoom, revealNode, moveNode, handlers } = useWorkflowViewport(nodes, edges, canvasWidth, canvasHeight, reduced, onNodeMove);
  const selectedNode = nodes.find((node) => node.id === selected);
  const detailsId = React.useId();
  const choose = (id: string | null) => { setSelected(id); onNodeSelect?.(id); };

  const registerNode = React.useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  }, []);

  const focusNode = React.useCallback((id: string) => {
    nodeRefs.current.get(id)?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={activityRef} role="region" aria-label={label} className={`w-full overflow-clip rounded-[20px] border border-[#27272A] bg-[#0B0B0C] text-white ${className}`} {...props}>
      <div className="flex items-center justify-between gap-3 border-b border-[#27272A] px-4 py-3 bg-[#141518]">
        <span className="text-[12px] font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
          {label}
        </span>
        <span className="font-mono text-[10px] text-[#9CA3AF]"><NumberRoll value={nodes.length} /> nodes · <NumberRoll value={edges.length} /> connections</span>
      </div>
      <div ref={viewport} {...handlers} data-lenis-prevent className={`relative h-[300px] overflow-clip bg-[#0F0F11] ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'none', backgroundImage: 'radial-gradient(#27272A 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
        <div ref={world} className="absolute left-0 top-0 origin-top-left" style={{ width: canvasWidth, height: canvasHeight, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          <WorkflowConnections nodes={nodes} edges={edges} positions={positions} reduced={reduced} width={canvasWidth} height={canvasHeight} />
          {nodes.map((node, index) => (
            <WorkflowNodeButton
              key={node.id}
              node={node}
              index={index}
              nodes={nodes}
              selected={selected === node.id}
              detailsId={detailsId}
              position={positions[node.id]}
              reduced={reduced}
              active={active}
              onChoose={choose}
              onReveal={revealNode}
              onMove={moveNode}
              onFocusNode={focusNode}
              onRegister={registerNode}
            />
          ))}
        </div>
        <div data-workflow-control className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-xl border border-[#27272A] bg-[#18181A] p-1 shadow-lg">
          <button type="button" aria-label="Zoom out" disabled={view.scale <= 0.25} onClick={() => zoom(1 / 1.2)} className={CONTROL}><Minus className="size-3.5" aria-hidden="true" /></button>
          <output aria-label="Zoom level" className="w-11 text-center font-mono text-[10px] tabular-nums text-white"><NumberRoll value={Math.round(view.scale * 100)} />%</output>
          <button type="button" aria-label="Zoom in" disabled={view.scale >= 1.75} onClick={() => zoom(1.2)} className={CONTROL}><Plus className="size-3.5" aria-hidden="true" /></button>
          <span className="mx-1 h-3 w-px bg-[#27272A]" />
          <button type="button" aria-label="Fit workflow" onClick={fit} className={CONTROL}><Maximize2 className="size-3.5" aria-hidden="true" /></button>
        </div>
      </div>
      <WorkflowInspector id={detailsId} node={selectedNode} reduced={reduced} onClose={() => { choose(null); if (selectedNode) focusNode(selectedNode.id); }} />
      <p role="status" aria-live="polite" className="sr-only">{nodes.filter((node) => node.status === 'running').map((node) => `${node.title} running`).join('. ') || (nodes.some((node) => node.status === 'error') ? 'Workflow has a failed step.' : nodes.length > 0 && nodes.every((node) => node.status === 'complete') ? 'Workflow complete.' : 'Workflow ready.')}</p>
    </div>
  );
}
