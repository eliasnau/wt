import { Badge } from "@matdesk/ui/components/badge";
import { CardFrame } from "@matdesk/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@matdesk/ui/components/empty";
import { cn } from "@matdesk/ui/lib/utils";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { AwardIcon, LayersIcon, UsersIcon } from "lucide-react";
import { useEffect, useMemo } from "react";

import { useTheme } from "@/components/theme-provider";

export type FlowRank = {
  id: string;
  name: string;
  color: string | null;
  memberCount: number;
};

export type FlowSystem = {
  id: string;
  name: string;
  unitLabel: string;
  mode: string;
  ranks: FlowRank[];
};

/** Serpentine layout: 5 per row, alternating direction so long chains stay compact. */
const COLUMNS = 5;
const X_GAP = 240;
const Y_GAP = 150;

type RankNodeData = {
  name: string;
  color: string | null;
  memberCount: number;
  /** 1-based position, or null in collection mode where order carries no meaning. */
  step: number | null;
};
type RankNode = Node<RankNodeData, "rank">;

type SystemNodeData = {
  name: string;
  unitLabel: string;
  rankCount: number;
};
type SystemNode = Node<SystemNodeData, "system">;

type FlowNode = RankNode | SystemNode;

/** Handles exist only as edge anchors — the graph is read-only, so keep them invisible. */
const HANDLE_CLASS = "opacity-0";

function RankFlowNode({ data, selected }: NodeProps<RankNode>) {
  return (
    <div
      className={cn(
        "w-52 rounded-xl border bg-card px-3 py-2.5 text-card-foreground shadow-xs transition-shadow",
        selected && "ring-2 ring-ring",
      )}
    >
      <Handle className={HANDLE_CLASS} id="t-left" position={Position.Left} type="target" />
      <Handle className={HANDLE_CLASS} id="t-right" position={Position.Right} type="target" />
      <Handle className={HANDLE_CLASS} id="t-top" position={Position.Top} type="target" />
      <Handle className={HANDLE_CLASS} id="s-left" position={Position.Left} type="source" />
      <Handle className={HANDLE_CLASS} id="s-right" position={Position.Right} type="source" />
      <Handle className={HANDLE_CLASS} id="s-bottom" position={Position.Bottom} type="source" />

      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="size-5 shrink-0 rounded-full border bg-black shadow-xs"
          style={data.color ? { backgroundColor: data.color } : undefined}
        />
        <span className="min-w-0 flex-1 truncate font-medium text-sm">{data.name}</span>
        {data.step == null ? null : (
          <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{data.step}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
        <UsersIcon className="size-3.5" />
        <span className="tabular-nums">{data.memberCount}</span>
        <span>{data.memberCount === 1 ? "Mitglied" : "Mitglieder"}</span>
      </div>
    </div>
  );
}

function SystemFlowNode({ data }: NodeProps<SystemNode>) {
  return (
    <div className="w-52 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2.5 shadow-xs">
      <Handle className={HANDLE_CLASS} id="s-right" position={Position.Right} type="source" />
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LayersIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-sm">{data.name}</span>
      </div>
      <p className="mt-2 text-muted-foreground text-xs">
        {data.rankCount} {data.unitLabel}
        {data.rankCount === 1 ? "" : "en"}
      </p>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  rank: RankFlowNode,
  system: SystemFlowNode,
};

function serpentinePosition(index: number) {
  const row = Math.floor(index / COLUMNS);
  const col = index % COLUMNS;
  // Odd rows run right-to-left so the chain snakes instead of jumping back.
  const x = (row % 2 === 0 ? col : COLUMNS - 1 - col) * X_GAP;
  return { x, y: row * Y_GAP, row };
}

function buildSequentialLayout(system: FlowSystem) {
  const nodes: FlowNode[] = system.ranks.map((rank, index) => {
    const { x, y } = serpentinePosition(index);
    return {
      id: rank.id,
      type: "rank" as const,
      position: { x, y },
      data: {
        name: rank.name,
        color: rank.color,
        memberCount: rank.memberCount,
        step: index + 1,
      },
    };
  });

  const edges: Edge[] = system.ranks.slice(0, -1).map((rank, index) => {
    const from = serpentinePosition(index);
    const to = serpentinePosition(index + 1);
    const wraps = from.row !== to.row;
    const rightToLeft = from.row % 2 === 1;
    return {
      id: `${rank.id}->${system.ranks[index + 1]!.id}`,
      source: rank.id,
      target: system.ranks[index + 1]!.id,
      sourceHandle: wraps ? "s-bottom" : rightToLeft ? "s-left" : "s-right",
      targetHandle: wraps ? "t-top" : rightToLeft ? "t-right" : "t-left",
      type: "smoothstep",
      animated: true,
    };
  });

  return { nodes, edges };
}

function buildCollectionLayout(system: FlowSystem) {
  const perColumn = 6;
  const rootY = (Math.min(system.ranks.length, perColumn) - 1) * 0.5 * (Y_GAP * 0.66);

  const nodes: FlowNode[] = [
    {
      id: system.id,
      type: "system" as const,
      position: { x: 0, y: rootY },
      data: { name: system.name, unitLabel: system.unitLabel, rankCount: system.ranks.length },
    },
    ...system.ranks.map((rank, index) => ({
      id: rank.id,
      type: "rank" as const,
      position: {
        x: X_GAP + Math.floor(index / perColumn) * X_GAP,
        y: (index % perColumn) * (Y_GAP * 0.66),
      },
      data: {
        name: rank.name,
        color: rank.color,
        memberCount: rank.memberCount,
        step: null,
      },
    })),
  ];

  const edges: Edge[] = system.ranks.map((rank) => ({
    id: `${system.id}->${rank.id}`,
    source: system.id,
    target: rank.id,
    sourceHandle: "s-right",
    targetHandle: "t-left",
    type: "smoothstep",
  }));

  return { nodes, edges };
}

export function ProgressionFlow({
  system,
  onRankClick,
}: {
  system: FlowSystem;
  onRankClick?: (rankId: string) => void;
}) {
  const { theme } = useTheme();
  const layout = useMemo(
    () =>
      system.mode === "sequential"
        ? buildSequentialLayout(system)
        : buildCollectionLayout(system),
    [system],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(layout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(layout.edges);

  useEffect(() => {
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [layout, setNodes, setEdges]);

  const totalMembers = system.ranks.reduce((sum, rank) => sum + rank.memberCount, 0);
  const translateExtent = useMemo(() => {
    if (layout.nodes.length === 0) {
      return [
        [0, 0],
        [0, 0],
      ] as [[number, number], [number, number]];
    }

    const xPositions = layout.nodes.map((node) => node.position.x);
    const yPositions = layout.nodes.map((node) => node.position.y);
    const padding = 240;

    return [
      [Math.min(...xPositions) - padding, Math.min(...yPositions) - padding],
      [Math.max(...xPositions) + 208 + padding, Math.max(...yPositions) + 96 + padding],
    ] as [[number, number], [number, number]];
  }, [layout.nodes]);

  if (system.ranks.length === 0) {
    return (
      <CardFrame className="p-0">
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AwardIcon />
            </EmptyMedia>
            <EmptyTitle>Nichts zu zeigen</EmptyTitle>
            <EmptyDescription>
              Lege zuerst eine {system.unitLabel.toLowerCase()} an, um die Übersicht zu sehen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardFrame>
    );
  }

  return (
    <CardFrame className="h-[600px] w-full min-w-0 overflow-hidden p-0">
      <ReactFlow
        colorMode={theme}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        maxZoom={1.5}
        minZoom={0.15}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          if (node.type === "rank") onRankClick?.(node.id);
        }}
        onNodesChange={onNodesChange}
        panOnDrag
        proOptions={{ hideAttribution: true }}
        translateExtent={translateExtent}
      >
        <Background gap={18} size={1} variant={BackgroundVariant.Dots} />
        <Controls showInteractive={false} />
        <Panel className="flex gap-2" position="top-right">
          <Badge variant="secondary">
            <AwardIcon />
            {system.ranks.length}
          </Badge>
          <Badge variant="secondary">
            <UsersIcon />
            {totalMembers}
          </Badge>
        </Panel>
      </ReactFlow>
    </CardFrame>
  );
}
