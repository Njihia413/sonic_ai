'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, Mic, Volume2, X, Paperclip, Download, Play, Pause, Copy, ThumbsUp, ThumbsDown, Square, ChevronDown, ShieldX } from 'lucide-react';
import { BounceLoader } from 'react-spinners';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/navbar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { colors } from '@/lib/colors';
import { logout } from '@/lib/auth';
import { motion } from 'framer-motion';

type AccessState =
  | { status: 'checking' }
  | { status: 'granted' }
  | { status: 'denied'; message: string }
  | { status: 'error'; message: string }

const MAX_CHARS = 500;

interface VoiceOption {
  value: string;
  label: string;
}

interface ApiVoice {
  id: string;
  name: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  attachment?: { url: string; name: string } | null;
  audioResponse?: { url: string; text: string } | null;
  isTyping?: boolean;
}

// --- Audio Waveform Visualization Component ---
function AudioWaveform({ audioUrl, isPlaying, onPlayPause }: {
  audioUrl: string;
  isPlaying: boolean;
  onPlayPause: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceCreatedRef = useRef(false);
  const animationRef = useRef<number>(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [liveFrequency, setLiveFrequency] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Decode audio and extract static waveform data
  useEffect(() => {
    const decodeAudio = async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);

        const barCount = 60;
        const samplesPerBar = Math.floor(channelData.length / barCount);
        const bars: number[] = [];
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            sum += Math.abs(channelData[i * samplesPerBar + j]);
          }
          bars.push(sum / samplesPerBar);
        }

        const maxVal = Math.max(...bars);
        const normalized = bars.map(b => (maxVal > 0 ? b / maxVal : 0));
        setWaveformData(normalized);
        setDuration(audioBuffer.duration);
        audioContext.close();
      } catch (err) {
        console.error('Failed to decode audio for waveform:', err);
      }
    };
    decodeAudio();
  }, [audioUrl]);

  // Create audio element + AnalyserNode
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    sourceCreatedRef.current = false;

    audio.addEventListener('ended', () => {
      setProgress(0);
      setCurrentTime(0);
      setLiveFrequency([]);
      onPlayPause();
    });

    return () => {
      audio.pause();
      audio.src = '';
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
        analyserRef.current = null;
        sourceCreatedRef.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  // Play / pause with live frequency animation
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // Connect AnalyserNode on first play
      if (!sourceCreatedRef.current) {
        try {
          const ctx = new AudioContext();
          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          audioCtxRef.current = ctx;
          analyserRef.current = analyser;
          sourceCreatedRef.current = true;
        } catch (err) {
          console.error('Failed to create AnalyserNode:', err);
        }
      }

      audio.play().catch(() => {});

      const animate = () => {
        if (audio.duration) {
          setProgress(audio.currentTime / audio.duration);
          setCurrentTime(audio.currentTime);
        }

        const analyser = analyserRef.current;
        if (analyser) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          const barCount = 60;
          const step = Math.max(1, Math.floor(dataArray.length / barCount));
          const bars: number[] = [];
          for (let i = 0; i < barCount; i++) {
            const idx = Math.min(i * step, dataArray.length - 1);
            bars.push(dataArray[idx] / 255);
          }
          setLiveFrequency(bars);
        }

        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      audio.pause();
      cancelAnimationFrame(animationRef.current);
      setLiveFrequency([]);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);

  // Draw the waveform — live frequency when playing, static when paused
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const barCount = waveformData.length;
    const barWidth = rect.width / barCount;
    const gap = 1.5;
    const maxHeight = rect.height * 0.85;

    ctx.clearRect(0, 0, rect.width, rect.height);

    const hasLive = liveFrequency.length > 0;

    waveformData.forEach((staticVal, i) => {
      const liveVal = hasLive ? (liveFrequency[i] ?? 0) : 0;
      const barHeight = hasLive
        ? Math.max(3, (staticVal * 0.3 + liveVal * 0.7) * maxHeight)
        : Math.max(3, staticVal * maxHeight);

      const x = i * barWidth + gap / 2;
      const y = (rect.height - barHeight) / 2;
      const barProgress = i / barCount;

      ctx.fillStyle = barProgress <= progress
        ? colors.emeraldGreen
        : 'rgba(156, 163, 175, 0.4)';

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth - gap, barHeight, 2);
      ctx.fill();
    });
  }, [waveformData, progress, liveFrequency]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || !duration) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekRatio = clickX / rect.width;
    audio.currentTime = seekRatio * duration;
    setProgress(seekRatio);
    setCurrentTime(audio.currentTime);
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-[#121212]">
      <button
        type="button"
        onClick={onPlayPause}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        style={{ color: colors.emeraldGreen }}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <canvas
          ref={canvasRef}
          className="w-full h-8 cursor-pointer rounded"
          onClick={handleCanvasClick}
        />
        <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <a
        href={audioUrl}
        download="response.wav"
        onClick={() => toast.success('Audio file downloaded successfully!')}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        style={{ color: colors.emeraldGreen }}
      >
        <Download className="w-5 h-5" />
      </a>
    </div>
  );
}

export default function ChatPage() {
  const [access, setAccess] = useState<AccessState>({ status: 'checking' })
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState<{ url: string; name: string; id: string } | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [, setCopiedIndex] = useState<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const fullText = "Hello, I'm Sonic AI. How may I help you today?";

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  };

  const [voices, setVoices] = useState<Array<{ value: string; label: string }>>([]);

  // --- Argus Access Verification ---
  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch('/api/verify', { method: 'POST' })
        const data = await res.json()

        if (res.status === 401) {
          window.location.href = '/'
          return
        }

        if (data.allowed) {
          setAccess({ status: 'granted' })
        } else {
          setAccess({ status: 'denied', message: data.error || data.message || 'Access denied' })
        }
      } catch {
        setAccess({ status: 'error', message: 'Could not verify access. Please try again.' })
      }
    }
    verify()
  }, [])

  // --- Auto-Scroll Logic ---
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  useEffect(() => {
    const fetchAndSetVoices = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voices`);
        if (!response.ok) {
          throw new Error('Failed to fetch voices');
        }
        const data = await response.json();
        const fetchedVoices: VoiceOption[] = data.voices.map((v: ApiVoice) => ({ value: v.id, label: v.name }));

        let allVoices = fetchedVoices;

        const newVoiceJSON = sessionStorage.getItem('selectedVoice');
        if (newVoiceJSON) {
          const newVoice = JSON.parse(newVoiceJSON);
          setAudioFile({ url: newVoice.audio_url, name: newVoice.name, id: newVoice.id });

          if (!fetchedVoices.some((v: VoiceOption) => v.value === newVoice.id)) {
            allVoices = [{ value: newVoice.id, label: newVoice.name }, ...fetchedVoices];
          }
          setSelectedVoice(newVoice.id);
          sessionStorage.removeItem('selectedVoice');
        } else if (fetchedVoices.length > 0) {
          setSelectedVoice(fetchedVoices[0].value);
        }

        setVoices(allVoices);
      } catch (error) {
        console.error("Error setting voices:", error);
        toast.error("Could not load voices.");
      }
    };

    if (access.status === 'granted') {
      fetchAndSetVoices();
    }
  }, [access.status]);

  useEffect(() => {
    if (messages.length === 0 && displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, messages.length, fullText]);

  const handleRemoveAudio = () => {
    if (audioFile) {
      URL.revokeObjectURL(audioFile.url);
    }
    setAudioFile(null);
  };

  const handleFileUpload = () => {
    // Manual attachment — not used in this version
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard', { position: 'top-right' });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUpvote = () => {
    toast.success('Thanks for the positive feedback!', { position: 'top-right' });
  };

  const handleDownvote = () => {
    toast.info('Thanks for the feedback — we\'ll use it to improve.', { position: 'top-right' });
  };

  const handleStop = () => {
    setIsLoading(false);
    setTypingMessageIndex(null);
  };

  const handleMicrophone = () => {
    window.location.href = '/record';
  };

  const handleSend = async () => {
    // Prevent a second send while a generation request is active
    if (isLoading || typingMessageIndex !== null) return;

    if (!message.trim() || !selectedVoice) {
      toast.error("Please enter a message and select a voice.");
      return;
    }

    if (message.length > MAX_CHARS) {
      toast.error(`Message exceeds ${MAX_CHARS} character limit.`);
      return;
    }

    const userMessage: ChatMessage = {
      id: nextMessageId(),
      role: 'user',
      content: message,
      attachment: audioFile ? { url: audioFile.url, name: audioFile.name } : null,
    };
    setMessages(prev => [...prev, userMessage]);

    const textToSynthesize = message;
    setMessage('');
    setAudioFile(null);
    setIsLoading(true);

    // Capture the stable ID now — immune to concurrent sends capturing the same index
    const assistantMessageId = nextMessageId();
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isTyping: true,
      audioResponse: null,
      attachment: null,
    };
    setMessages(prev => [...prev, initialAssistantMessage]);
    setTypingMessageIndex(assistantMessageId);

    try {
      const formData = new FormData();
      formData.append('text', textToSynthesize);
      formData.append('voice_id', selectedVoice);
      formData.append('language', 'en');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const responseText = 'Here is the audio for the text you provided.';

      // Update by ID — safe regardless of how many messages were added concurrently
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: responseText, audioResponse: { url: audioUrl, text: responseText }, isTyping: false }
            : msg
        )
      );
    } catch (error) {
      console.error('Error generating audio:', error);
      const errorMessage = (error as Error).message || 'An unexpected error occurred during audio generation.';
      toast.error(errorMessage);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: `Error: ${errorMessage}`, isTyping: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setTypingMessageIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = message.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.8;

  // Extracted to if/else to avoid nested ternary lint warning
  let charCountColor = 'rgb(156, 163, 175)';
  if (isOverLimit) charCountColor = '#EF4444';
  else if (isNearLimit) charCountColor = '#F59E0B';

  const renderChatInput = () => (
    <div className="relative">
      <div
        className={`${audioFile ? 'min-h-[160px]' : 'min-h-[140px]'} relative rounded-3xl border transition-all ${
          isFocused ? 'border-2' : 'border'
        } ${
          isFocused ? '' : 'border-gray-400 dark:border-gray-600'
        }`}
        style={{ borderColor: isFocused ? colors.emeraldGreen : undefined }}
      >
        <div className="flex flex-col p-4 pr-24">
          {audioFile && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all self-start mb-2"
              style={{ backgroundColor: `${colors.emeraldGreen}20`, color: colors.emeraldGreen }}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="max-w-[150px] truncate">{audioFile.name}</span>
              <button
                type="button"
                onClick={handleRemoveAudio}
                className="hover:opacity-70 transition-opacity"
                aria-label="Remove attached file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask me anything..."
            className="min-h-[24px] max-h-[150px] resize-none border-0 border-none shadow-none rounded-none p-0 pb-10 bg-transparent dark:bg-transparent text-black dark:text-white placeholder:text-gray-500 placeholder:text-left focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none leading-6"
          />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleAttachmentClick}
              className="shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Attach audio file"
            >
              <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="h-9 rounded-full border-gray-400 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {charCount > 0 && (
              <span
                className="text-xs font-medium transition-colors ml-1"
                style={{ color: charCountColor }}
              >
                {charCount} / {MAX_CHARS}
              </span>
            )}
          </div>
        </div>
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleMicrophone}
                size="icon"
                className="rounded-full h-[42px] w-[42px] shrink-0 border-2 transition-all duration-300 border-gray-400 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Mic className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent style={{ backgroundColor: colors.emeraldGreen, color: colors.white, border: 'none' }}>
              <p>Voice input</p>
            </TooltipContent>
          </Tooltip>
          <Button
            onClick={isLoading || typingMessageIndex !== null ? handleStop : handleSend}
            disabled={!isLoading && typingMessageIndex === null && (!message.trim() || isOverLimit) && !audioFile}
            size="icon"
            className="rounded-full h-[38px] w-[38px] shrink-0 transition-all duration-300 disabled:opacity-50"
            style={{ backgroundColor: colors.emeraldGreen, color: colors.white }}
          >
            {(isLoading || typingMessageIndex !== null) ? <Square className="w-4 h-4" fill="currentColor" /> : <ArrowUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  if (access.status === 'checking') {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <BounceLoader color={colors.emeraldGreen} size={50} />
      </div>
    )
  }

  if (access.status === 'denied' || access.status === 'error') {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${colors.emeraldGreen}15` }}
            >
              <ShieldX className="w-10 h-10" style={{ color: colors.emeraldGreen }} />
            </div>
            <h1 className="text-2xl font-bold text-black dark:text-white mb-3">Access Denied</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
              {access.message}
            </p>
            <button
              type="button"
              onClick={logout}
              className="w-full h-12 font-semibold text-sm rounded-full text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.emeraldGreen }}
            >
              Log out
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-white dark:bg-black">
        <Navbar />

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-4xl font-bold text-black dark:text-white">
                  {displayedText}<span className="animate-pulse">|</span>
                </h1>
              </div>
              {renderChatInput()}
            </div>
          </div>
        ) : (
          <>
            <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto relative">
              <div className="w-full max-w-3xl mx-auto space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {msg.attachment && (
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full text-sm font-medium"
                        style={{ backgroundColor: `${colors.emeraldGreen}20`, color: colors.emeraldGreen }}
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="max-w-[150px] truncate">{msg.attachment.name}</span>
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === 'assistant' && msg.audioResponse ? '' : 'inline-block'
                        } ${
                          msg.role === 'user'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-[#202020] text-black dark:text-white'
                        }`}
                        style={msg.role === 'user' ? { backgroundColor: colors.emeraldGreen } : {}}
                      >
                        {msg.role === 'assistant' && msg.audioResponse ? (
                          <div className="space-y-3">
                            <div className="text-sm">
                              {msg.content}{msg.isTyping && <span className="animate-pulse ml-0.5">|</span>}
                            </div>
                            {!msg.isTyping && (
                              <AudioWaveform
                                audioUrl={msg.audioResponse.url}
                                isPlaying={playingAudio === index}
                                onPlayPause={() => {
                                  setPlayingAudio(prev => prev === index ? null : index);
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div>{msg.content}</div>
                        )}
                      </div>
                      {msg.role === 'assistant' && !msg.isTyping && (
                        <div className="flex items-center gap-1 mt-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleCopy(msg.content, index)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent style={{ backgroundColor: colors.emeraldGreen, color: colors.white, border: 'none' }}>
                              <p>Copy</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={handleUpvote}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent style={{ backgroundColor: colors.emeraldGreen, color: colors.white, border: 'none' }}>
                              <p>Good response</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={handleDownvote}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <ThumbsDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent style={{ backgroundColor: colors.emeraldGreen, color: colors.white, border: 'none' }}>
                              <p>Bad response</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start justify-start">
                    <BounceLoader
                      color={colors.emeraldGreen}
                      loading={isLoading}
                      size={40}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {showScrollButton && (
                <button
                  type="button"
                  onClick={() => scrollToBottom()}
                  className="fixed bottom-28 right-8 z-50 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                  style={{ backgroundColor: colors.emeraldGreen, color: colors.white }}
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="bg-white dark:bg-black">
              <div className="max-w-3xl mx-auto p-4">
                {renderChatInput()}
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
