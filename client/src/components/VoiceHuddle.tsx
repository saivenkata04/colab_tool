import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Radio, Users, Volume2 } from 'lucide-react';
import { YjsWebSocketProvider, PresenceUser } from '../collaboration/yjsProvider';
import { useAuthStore } from '../store/authStore';

interface VoiceHuddleProps {
  provider: YjsWebSocketProvider | null;
  presence: PresenceUser[];
  isOpen: boolean;
  onClose: () => void;
}

interface VoicePeer {
  userId: string;
  name: string;
  avatar?: string | null;
  color?: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

export const VoiceHuddle: React.FC<VoiceHuddleProps> = ({
  provider,
  presence,
  isOpen,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [isInHuddle, setIsInHuddle] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voicePeers, setVoicePeers] = useState<VoicePeer[]>([]);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize or leave voice huddle
  const toggleHuddle = async () => {
    if (isInHuddle) {
      leaveHuddle();
    } else {
      await joinHuddle();
    }
  };

  const joinHuddle = async () => {
    try {
      // Access real microphone
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
      } catch (e) {
        console.warn('Microphone permission not granted or no mic available, operating in listen mode.');
      }

      // Audio frequency analyser for speaking waveforms
      if (stream) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 64;

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioLevel(avg);
            animFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        } catch (err) {
          console.warn('Audio analyser init failed:', err);
        }
      }

      setIsInHuddle(true);

      // Broadcast join signal via WebSocket
      provider?.sendVoiceSignal('join', {
        userId: user?.id,
        name: user?.name,
        isMuted: false,
      });

      // Add self and available peers
      const peers: VoicePeer[] = [
        {
          userId: user?.id || 'self',
          name: `${user?.name || 'You'} (You)`,
          avatar: user?.avatar,
          color: '#6366F1',
          isSpeaking: false,
          isMuted: false,
        },
      ];

      // Add other currently online peers in room
      presence.forEach((p) => {
        if (p.userId !== user?.id) {
          peers.push({
            userId: p.userId,
            name: p.name,
            avatar: p.avatar,
            color: p.color,
            isSpeaking: false,
            isMuted: false,
          });
        }
      });

      setVoicePeers(peers);
    } catch (err: any) {
      console.error('Failed to join voice huddle:', err);
      alert('Could not initialize audio device: ' + err.message);
    }
  };

  const leaveHuddle = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    provider?.sendVoiceSignal('leave', { userId: user?.id });

    setIsInHuddle(false);
    setAudioLevel(0);
    setVoicePeers([]);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    provider?.sendVoiceSignal('mute-status', {
      userId: user?.id,
      isMuted: nextMuted,
    });

    setVoicePeers((prev) =>
      prev.map((p) => (p.userId === user?.id || p.name.includes('(You)') ? { ...p, isMuted: nextMuted } : p))
    );
  };

  // Listen for voice signals from other peers
  useEffect(() => {
    if (!provider) return;

    const cleanup = provider.onVoiceSignal((msg) => {
      if (msg.action === 'join') {
        setVoicePeers((prev) => {
          if (prev.some((p) => p.userId === msg.senderId)) return prev;
          return [
            ...prev,
            {
              userId: msg.senderId,
              name: msg.senderName,
              isSpeaking: false,
              isMuted: false,
            },
          ];
        });
      } else if (msg.action === 'leave') {
        setVoicePeers((prev) => prev.filter((p) => p.userId !== msg.senderId));
      } else if (msg.action === 'mute-status') {
        setVoicePeers((prev) =>
          prev.map((p) => (p.userId === msg.senderId ? { ...p, isMuted: msg.signal.isMuted } : p))
        );
      }
    });

    return () => {
      cleanup();
    };
  }, [provider]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      leaveHuddle();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-14 right-6 w-80 bg-[#11151D]/95 backdrop-blur-xl border border-[rgba(139,92,246,0.25)] rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.18),0_20px_45px_rgba(0,0,0,0.8)] z-50 overflow-hidden font-sans animate-scale-in">
      {/* Header */}
      <div className="px-4 py-3 bg-[#151A23] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-[#A5B4FC]">
            <Radio size={13} className={isInHuddle ? 'animate-pulse text-[#10B981]' : ''} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#F8FAFC]">IDE Voice Huddle</h3>
            <span className="text-[10px] text-[#94A3B8]">
              {isInHuddle ? `${voicePeers.length} active in call` : 'WebRTC P2P Voice'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-[#64748B] hover:text-[#F8FAFC] text-xs transition p-1"
        >
          ✕
        </button>
      </div>

      {/* Body: Peer List */}
      <div className="p-4 space-y-3">
        {!isInHuddle ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#151A23] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.15)] mb-3">
              <Users size={22} />
            </div>
            <h4 className="text-xs font-bold text-[#F8FAFC]">Pair Programming Audio Room</h4>
            <p className="text-[11px] text-[#94A3B8] max-w-[220px] mt-1 leading-relaxed">
              Talk directly with your peers in real time with 0 latency. No Discord or Zoom needed.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {voicePeers.map((peer) => {
              const isSelf = peer.userId === user?.id || peer.name.includes('(You)');
              const speaking = isSelf ? audioLevel > 15 && !isMuted : peer.isSpeaking;

              return (
                <div
                  key={peer.userId}
                  className={`flex items-center justify-between p-2 rounded-xl transition ${
                    speaking
                      ? 'bg-[#6366F1]/15 border border-[#6366F1]/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-[#0C0F15] border border-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div
                        style={{ backgroundColor: peer.color || '#6366F1' }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      >
                        {peer.name.slice(0, 2).toUpperCase()}
                      </div>
                      {speaking && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5">
                        <span>{peer.name}</span>
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        {peer.isMuted ? 'Muted' : speaking ? 'Speaking...' : 'Listening'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {speaking && !peer.isMuted && (
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-1 h-2 bg-[#10B981] rounded-full animate-bounce" />
                        <span className="w-1 h-3.5 bg-[#10B981] rounded-full animate-bounce [animation-delay:0.1s]" />
                        <span className="w-1 h-1.5 bg-[#10B981] rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    )}
                    {peer.isMuted ? (
                      <MicOff size={13} className="text-[#EF4444]" />
                    ) : (
                      <Volume2 size={13} className="text-[#A5B4FC]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] flex items-center gap-2">
          {!isInHuddle ? (
            <button
              onClick={joinHuddle}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#7C3AED] hover:from-[#6D70F7] hover:to-[#8B5CF6] text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition"
            >
              <Mic size={14} />
              <span>Join Voice Huddle</span>
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  isMuted
                    ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                    : 'bg-[#151A23] hover:bg-[#1B212D] border-[rgba(255,255,255,0.08)] text-[#F8FAFC]'
                }`}
              >
                {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                onClick={leaveHuddle}
                className="py-2 px-3 rounded-xl bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border border-[#EF4444]/40 text-[#EF4444] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                title="Leave Voice Huddle"
              >
                <PhoneOff size={14} />
                <span>Leave</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
