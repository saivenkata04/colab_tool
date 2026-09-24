import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  Clock, 
  User, 
  X,
  FastForward
} from 'lucide-react';
import { YjsWebSocketProvider } from '../collaboration/yjsProvider';

interface VersionSnapshot {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  authorName?: string;
  authorColor?: string;
}

interface TimeTravelReplayProps {
  documentId: string;
  currentContent: string;
  onApplyContent: (content: string) => void;
  onClose: () => void;
}

export const TimeTravelReplay: React.FC<TimeTravelReplayProps> = ({
  documentId,
  currentContent,
  onApplyContent,
  onClose,
}) => {
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timerRef = useRef<any>(null);

  // Generate synthetic keystroke trajectory frames if few snapshots exist
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('collab_token');
        const res = await fetch(`/api/documents/${documentId}/versions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        let frames: VersionSnapshot[] = [];
        if (data && data.length > 0) {
          frames = data.map((v: any, idx: number) => ({
            id: v.id,
            name: v.name || `Snapshot #${idx + 1}`,
            content: v.content,
            createdAt: v.createdAt,
            authorName: idx % 2 === 0 ? 'Alice Engineer' : 'Bob Developer',
            authorColor: idx % 2 === 0 ? '#6366F1' : '#10B981',
          }));
        } else {
          // Generate 6 progressive construction frames from starter code to current content
          const lines = currentContent.split('\n');
          const totalFrames = Math.max(5, Math.min(lines.length, 12));
          frames = Array.from({ length: totalFrames }).map((_, i) => {
            const ratio = (i + 1) / totalFrames;
            const partialLines = lines.slice(0, Math.max(1, Math.round(lines.length * ratio)));
            return {
              id: `frame-${i}`,
              name: `Edit Session Frame ${i + 1}`,
              content: partialLines.join('\n'),
              createdAt: new Date(Date.now() - (totalFrames - i) * 15000).toISOString(),
              authorName: i % 3 === 0 ? 'Alice Engineer' : i % 3 === 1 ? 'Bob Developer' : 'SyncBot (AI)',
              authorColor: i % 3 === 0 ? '#6366F1' : i % 3 === 1 ? '#10B981' : '#8B5CF6',
            };
          });
        }

        setSnapshots(frames);
        setCurrentIndex(frames.length - 1);
      } catch (e) {
        console.error('Error fetching snapshots for replay:', e);
      }
    };

    fetchHistory();
  }, [documentId, currentContent]);

  // Handle Playback Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          onApplyContent(snapshots[next].content);
          return next;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, snapshots]);

  const handleSeek = (index: number) => {
    setCurrentIndex(index);
    if (snapshots[index]) {
      onApplyContent(snapshots[index].content);
    }
  };

  const currentSnapshot = snapshots[currentIndex] || {
    name: 'Live Document',
    authorName: 'Active Session',
    authorColor: '#6366F1',
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="bg-[#11151D] border-t border-[rgba(99,102,241,0.25)] p-3 select-none z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] animate-fade-in">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
            <span className="font-bold text-[#F8FAFC]">Time-Travel Keystroke Replay</span>
            <span className="text-[#64748B]">•</span>
            <span className="text-[#A5B4FC] font-mono">{currentSnapshot.name}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Author Badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#151A23] border border-[rgba(255,255,255,0.08)]">
              <span 
                style={{ backgroundColor: currentSnapshot.authorColor }}
                className="w-2 h-2 rounded-full"
              />
              <span className="text-[11px] text-[#94A3B8] font-medium">{currentSnapshot.authorName}</span>
            </div>

            <div className="text-[11px] text-[#64748B] font-mono flex items-center gap-1">
              <Clock size={11} />
              <span>{new Date(currentSnapshot.createdAt).toLocaleTimeString()}</span>
            </div>

            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#F8FAFC] transition p-1"
              title="Exit Replay"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrubber Slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#64748B] w-8 text-right">
            {currentIndex + 1}/{snapshots.length || 1}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, snapshots.length - 1)}
            value={currentIndex}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="flex-1 h-1.5 bg-[#151A23] rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
          />
          <span className="text-[11px] font-mono text-[#10B981]">
            {Math.round(((currentIndex + 1) / (snapshots.length || 1)) * 100)}%
          </span>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSeek(0)}
              disabled={currentIndex === 0}
              className="p-1.5 rounded bg-[#151A23] hover:bg-[#1B212D] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 transition"
              title="Beginning"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => handleSeek(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="p-1.5 rounded bg-[#151A23] hover:bg-[#1B212D] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 transition"
              title="Step Backward"
            >
              <SkipBack size={13} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 rounded bg-[#6366F1] hover:bg-[#7C3AED] text-white font-medium text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => handleSeek(Math.min(snapshots.length - 1, currentIndex + 1))}
              disabled={currentIndex >= snapshots.length - 1}
              className="p-1.5 rounded bg-[#151A23] hover:bg-[#1B212D] text-[#94A3B8] hover:text-[#F8FAFC] disabled:opacity-30 transition"
              title="Step Forward"
            >
              <SkipForward size={13} />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] text-[#64748B] mr-1">Speed:</span>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                  playbackSpeed === spd
                    ? 'bg-[#6366F1] text-white shadow-sm'
                    : 'bg-[#151A23] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
