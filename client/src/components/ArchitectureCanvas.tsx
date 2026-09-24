import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Move, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Server,
  Database,
  Cpu,
  Globe,
  Radio,
  Share2
} from 'lucide-react';
import { YjsWebSocketProvider, PresenceUser } from '../collaboration/yjsProvider';

interface Node {
  id: string;
  type: 'client' | 'gateway' | 'server' | 'database' | 'cache' | 'ai' | 'queue';
  title: string;
  subtitle: string;
  x: number;
  y: number;
  color: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface ArchitectureCanvasProps {
  provider: YjsWebSocketProvider | null;
  presence?: PresenceUser[];
}

const DEFAULT_NODES: Node[] = [
  { id: 'node-1', type: 'client', title: 'React 18 Client', subtitle: 'Monaco & Yjs Client', x: 80, y: 140, color: '#38BDF8' },
  { id: 'node-2', type: 'gateway', title: 'Express Gateway', subtitle: 'REST API & Auth (Port 5000)', x: 340, y: 140, color: '#818CF8' },
  { id: 'node-3', type: 'server', title: 'Yjs CRDT Engine', subtitle: 'WebSockets (Port 8080)', x: 340, y: 300, color: '#10B981' },
  { id: 'node-4', type: 'database', title: 'PostgreSQL DB', subtitle: 'Prisma Persistence Layer', x: 620, y: 140, color: '#6366F1' },
  { id: 'node-5', type: 'ai', title: 'AI Copilot Engine', subtitle: 'LLM Code Generator', x: 620, y: 300, color: '#8B5CF6' },
];

const DEFAULT_CONNECTIONS: Connection[] = [
  { id: 'c-1', from: 'node-1', to: 'node-2', label: 'HTTP REST' },
  { id: 'c-2', from: 'node-1', to: 'node-3', label: 'Binary ws' },
  { id: 'c-3', from: 'node-2', to: 'node-4', label: 'Prisma ORM' },
  { id: 'c-4', from: 'node-3', to: 'node-4', label: 'Auto-Save' },
  { id: 'c-5', from: 'node-2', to: 'node-5', label: 'AI Assist' },
];

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
  provider,
  presence = [],
}) => {
  const [nodes, setNodes] = useState<Node[]>(DEFAULT_NODES);
  const [connections, setConnections] = useState<Connection[]>(DEFAULT_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConnectingFrom, setIsConnectingFrom] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync canvas state with peer collaborators
  useEffect(() => {
    if (!provider) return;

    const cleanup = provider.onWhiteboardUpdate((msg) => {
      if (msg.nodes) setNodes(msg.nodes);
      if (msg.edges) setConnections(msg.edges);
    });

    return () => {
      cleanup();
    };
  }, [provider]);

  const broadcastCanvas = (newNodes: Node[], newConns: Connection[]) => {
    provider?.sendWhiteboardUpdate(newNodes, newConns);
  };

  // Node Dragging
  const handleMouseDown = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    if (isConnectingFrom) {
      if (isConnectingFrom !== node.id) {
        // Complete connection
        const newConn: Connection = {
          id: `c-${Date.now()}`,
          from: isConnectingFrom,
          to: node.id,
          label: 'Data Stream',
        };
        const updated = [...connections, newConn];
        setConnections(updated);
        broadcastCanvas(nodes, updated);
      }
      setIsConnectingFrom(null);
      return;
    }

    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      setDragOffset({
        x: (e.clientX - canvasRect.left) / zoom - node.x,
        y: (e.clientY - canvasRect.top) / zoom - node.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.round((e.clientX - canvasRect.left) / zoom - dragOffset.x));
    const newY = Math.max(20, Math.round((e.clientY - canvasRect.top) / zoom - dragOffset.y));

    const updated = nodes.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    setNodes(updated);
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      broadcastCanvas(nodes, connections);
    }
  };

  // Add Node
  const addNode = (type: Node['type']) => {
    const titles: Record<Node['type'], { title: string; subtitle: string; color: string }> = {
      client: { title: 'Web App Client', subtitle: 'Frontend Interface', color: '#38BDF8' },
      gateway: { title: 'API Gateway', subtitle: 'Reverse Proxy & Router', color: '#818CF8' },
      server: { title: 'Microservice Worker', subtitle: 'Background Processing', color: '#10B981' },
      database: { title: 'PostgreSQL DB', subtitle: 'Relational Store', color: '#6366F1' },
      cache: { title: 'Redis Cache', subtitle: 'In-Memory State', color: '#EF4444' },
      ai: { title: 'LLM Agent Host', subtitle: 'Inference Pipeline', color: '#8B5CF6' },
      queue: { title: 'Kafka Message Bus', subtitle: 'Pub/Sub Events', color: '#F59E0B' },
    };

    const config = titles[type];
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      title: config.title,
      subtitle: config.subtitle,
      x: 100 + (nodes.length * 40) % 400,
      y: 100 + (nodes.length * 30) % 250,
      color: config.color,
    };

    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNodeId(newNode.id);
    broadcastCanvas(updated, connections);
  };

  // Delete Node
  const deleteSelected = () => {
    if (!selectedNodeId) return;
    const updatedNodes = nodes.filter((n) => n.id !== selectedNodeId);
    const updatedConns = connections.filter((c) => c.from !== selectedNodeId && c.to !== selectedNodeId);
    setNodes(updatedNodes);
    setConnections(updatedConns);
    setSelectedNodeId(null);
    broadcastCanvas(updatedNodes, updatedConns);
  };

  // Render SVG Connection lines
  const renderConnections = () => {
    return connections.map((c) => {
      const fromNode = nodes.find((n) => n.id === c.from);
      const toNode = nodes.find((n) => n.id === c.to);
      if (!fromNode || !toNode) return null;

      const fromX = fromNode.x + 95;
      const fromY = fromNode.y + 45;
      const toX = toNode.x + 95;
      const toY = toNode.y + 45;

      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;

      return (
        <g key={c.id} className="cursor-pointer group">
          <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="#6366F1"
            strokeWidth="2"
            strokeDasharray="4 2"
            className="transition-all group-hover:stroke-[#A5B4FC] group-hover:stroke-width-3"
          />
          <circle cx={toX} cy={toY} r="4" fill="#6366F1" />
          {c.label && (
            <text
              x={midX}
              y={midY - 6}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="10"
              fontFamily="monospace"
              className="bg-[#0C0F15] px-1 select-none pointer-events-none"
            >
              {c.label}
            </text>
          )}
        </g>
      );
    });
  };

  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'client': return <Globe size={15} />;
      case 'gateway': return <Share2 size={15} />;
      case 'server': return <Radio size={15} />;
      case 'database': return <Database size={15} />;
      case 'cache': return <Layers size={15} />;
      case 'ai': return <Cpu size={15} />;
      default: return <Server size={15} />;
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-[#080A0F] text-[#F8FAFC] select-none overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Toolbar */}
      <div className="h-11 bg-[#11151D] border-b border-[rgba(255,255,255,0.08)] px-3.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-[#A5B4FC] uppercase tracking-wider mr-2 flex items-center gap-1.5">
            <Layers size={13} className="text-[#6366F1]" /> Architecture Whiteboard
          </span>

          <div className="h-4 w-px bg-[rgba(255,255,255,0.08)] mx-1" />

          {/* Quick Node Spawners */}
          <button
            onClick={() => addNode('client')}
            className="px-2 py-1 rounded bg-[#151A23] hover:bg-[#1B212D] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#38BDF8] flex items-center gap-1 transition"
          >
            <Globe size={12} /> +Client
          </button>
          <button
            onClick={() => addNode('server')}
            className="px-2 py-1 rounded bg-[#151A23] hover:bg-[#1B212D] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#10B981] flex items-center gap-1 transition"
          >
            <Radio size={12} /> +Service
          </button>
          <button
            onClick={() => addNode('database')}
            className="px-2 py-1 rounded bg-[#151A23] hover:bg-[#1B212D] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#6366F1] flex items-center gap-1 transition"
          >
            <Database size={12} /> +Database
          </button>
          <button
            onClick={() => addNode('ai')}
            className="px-2 py-1 rounded bg-[#151A23] hover:bg-[#1B212D] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#8B5CF6] flex items-center gap-1 transition"
          >
            <Cpu size={12} /> +AI Engine
          </button>
          <button
            onClick={() => addNode('cache')}
            className="px-2 py-1 rounded bg-[#151A23] hover:bg-[#1B212D] border border-[rgba(255,255,255,0.06)] text-[11px] text-[#EF4444] flex items-center gap-1 transition"
          >
            <Layers size={12} /> +Redis
          </button>
        </div>

        {/* Actions & Zoom */}
        <div className="flex items-center gap-2">
          {selectedNodeId && (
            <>
              <button
                onClick={() => setIsConnectingFrom(selectedNodeId)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition flex items-center gap-1 ${
                  isConnectingFrom
                    ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981] animate-pulse'
                    : 'bg-[#151A23] border-[rgba(255,255,255,0.08)] text-[#A5B4FC]'
                }`}
                title="Click another node to draw a connection"
              >
                {isConnectingFrom ? 'Select Target Node...' : 'Connect Line'}
              </button>
              <button
                onClick={deleteSelected}
                className="p-1 rounded bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[#EF4444] text-[11px] transition"
                title="Delete Selected Node"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}

          <div className="flex items-center gap-1 bg-[#151A23] border border-[rgba(255,255,255,0.08)] rounded p-0.5 text-xs text-[#94A3B8]">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut size={12} />
            </button>
            <span className="text-[10px] font-mono px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
              className="p-1 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn size={12} />
            </button>
          </div>

          <button
            onClick={() => {
              setNodes(DEFAULT_NODES);
              setConnections(DEFAULT_CONNECTIONS);
              broadcastCanvas(DEFAULT_NODES, DEFAULT_CONNECTIONS);
            }}
            className="p-1 rounded bg-[#151A23] hover:bg-[#1B212D] border border-[rgba(255,255,255,0.08)] text-[#94A3B8] hover:text-[#F8FAFC] transition"
            title="Reset to Default Architecture"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Interactive Grid Canvas */}
      <div
        ref={canvasRef}
        onClick={() => {
          setSelectedNodeId(null);
          setIsConnectingFrom(null);
        }}
        className="flex-1 relative overflow-hidden cursor-crosshair"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* SVG Connections Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {renderConnections()}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isConnecting = isConnectingFrom === node.id;

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleMouseDown(e, node)}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                borderColor: isSelected ? node.color : 'rgba(255, 255, 255, 0.1)',
                boxShadow: isSelected
                  ? `0 0 25px ${node.color}40, 0 10px 25px rgba(0,0,0,0.6)`
                  : '0 8px 20px rgba(0, 0, 0, 0.5)',
              }}
              className={`absolute w-48 bg-[#11151D]/95 backdrop-blur-md border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-shadow z-10 ${
                isConnecting ? 'ring-2 ring-[#10B981] animate-pulse' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  style={{ color: node.color, backgroundColor: `${node.color}20` }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                >
                  {getNodeIcon(node.type)}
                </div>
                <div className="font-bold text-xs text-[#F8FAFC] truncate">{node.title}</div>
              </div>
              <div className="text-[10px] text-[#94A3B8] font-mono truncate">{node.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* Canvas Status Footer */}
      <div className="h-6 bg-[#0C0F15] border-t border-[rgba(255,255,255,0.06)] px-3 flex items-center justify-between text-[10px] text-[#64748B] shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span>{nodes.length} Nodes</span>
          <span>•</span>
          <span>{connections.length} Connectors</span>
          <span>•</span>
          <span className="text-[#10B981]">Real-Time CRDT Synced</span>
        </div>
        <div>Drag to move • Click node then 'Connect Line' to link</div>
      </div>
    </div>
  );
};
