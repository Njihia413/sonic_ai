'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Mic, Volume2, X, Paperclip, Download, Play, Pause, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/navbar';
import { colors } from '@/lib/colors';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState<{ url: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; attachment?: { url: string; name: string } | null; audioResponse?: { url: string; text: string } | null; isTyping?: boolean }>>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullText = "Hello, I'm Sonic AI. How may I help you today?";

  useEffect(() => {
    const audioUrl = localStorage.getItem('recordedAudioUrl');
    const uploadedAudio = localStorage.getItem('uploadedAudioFile');

    if (audioUrl) {
      setAudioFile({ url: audioUrl, name: 'Recorded Audio' });
      localStorage.removeItem('recordedAudioUrl');
      localStorage.removeItem('recordedAudioBlob');
    } else if (uploadedAudio) {
      const audioData = JSON.parse(uploadedAudio);
      setAudioFile(audioData);
      localStorage.removeItem('uploadedAudioFile');
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0 && displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, messages.length, fullText]);

  const handleRemoveAudio = () => {
    setAudioFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setAudioFile({ url, name: file.name });
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSend = async () => {
    if (!message.trim() && !audioFile) return;

    const newMessage = {
      role: 'user' as const,
      content: message,
      attachment: audioFile ? { ...audioFile } : null
    };
    setMessages([...messages, newMessage]);
    setMessage('');
    setAudioFile(null);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const responseText = "Sure, I'll help you with that. Here's the audio response you requested. You can play it or download it for later use.";

    const dummyAudioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmm98d2QQAoUYLPp66hVFApGnuDyvmwhBSeBy+/biy8HGWi68d2RQAoUX7Pp66hVFApGnuDyvmwhBSeBy+/biy8HGGm88d2RQAoUXrPp66hVFApGnuDyvmwhBSaCzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBSaBzO/biy8HGWi78d2RQAoUXrPp66hVFApGnuDyv2wiBQ==';

    const assistantMessageIndex = messages.length + 1;
    const initialMessage = {
      role: 'assistant' as const,
      content: '',
      audioResponse: { url: dummyAudioUrl, text: responseText },
      isTyping: true,
      attachment: null
    };

    setMessages(prev => [...prev, initialMessage]);
    setIsLoading(false);
    setTypingMessageIndex(assistantMessageIndex);

    for (let i = 0; i <= responseText.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantMessageIndex] = {
          ...updated[assistantMessageIndex],
          content: responseText.slice(0, i)
        };
        return updated;
      });
    }

    setMessages(prev => {
      const updated = [...prev];
      updated[assistantMessageIndex] = {
        ...updated[assistantMessageIndex],
        isTyping: false
      };
      return updated;
    });
    setTypingMessageIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
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

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="relative">
              <div
                className={`${audioFile ? 'min-h-[80px]' : 'min-h-[64px]'} relative rounded-3xl border transition-all ${
                  isFocused ? 'border-2' : 'border'
                } ${
                  isFocused ? '' : 'border-gray-400 dark:border-gray-600'
                }`}
                style={{
                  borderColor: isFocused ? colors.emeraldGreen : undefined
                }}
              >
                <div className="flex items-start gap-3 p-4 pr-16">
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    {audioFile && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all self-start mb-1"
                        style={{
                          backgroundColor: `${colors.emeraldGreen}20`,
                          color: colors.emeraldGreen
                        }}
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="max-w-[150px] truncate">{audioFile.name}</span>
                        <button
                          onClick={handleRemoveAudio}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAttachmentClick}
                        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Attach audio file"
                      >
                        <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </button>
                      <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Ask me anything..."
                        className="min-h-[24px] max-h-[150px] resize-none border-0 p-0 bg-transparent text-black dark:text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none leading-6"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!message.trim() && !audioFile}
                  size="icon"
                  className="absolute right-2 bottom-2 rounded-full h-[40px] w-[40px] shrink-0 transition-all duration-300 disabled:opacity-50"
                  style={{
                    backgroundColor: colors.emeraldGreen,
                    color: colors.white,
                  }}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="w-full max-w-3xl mx-auto space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.attachment && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${colors.emeraldGreen}20`,
                        color: colors.emeraldGreen
                      }}
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
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-[#121212]">
                              <button
                                onClick={() => {
                                  const audio = new Audio(msg.audioResponse!.url);
                                  audio.play();
                                  setPlayingAudio(index);
                                  audio.onended = () => setPlayingAudio(null);
                                }}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                style={{ color: colors.emeraldGreen }}
                              >
                                {playingAudio === index ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                              </button>
                              <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                <div className="h-full rounded-full" style={{ width: '0%', backgroundColor: colors.emeraldGreen }}></div>
                              </div>
                              <a
                                href={msg.audioResponse.url}
                                download="response.wav"
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                style={{ color: colors.emeraldGreen }}
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>{msg.content}</div>
                      )}
                    </div>
                    {msg.role === 'assistant' && !msg.isTyping && (
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Good response"
                        >
                          <ThumbsUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Bad response"
                        >
                          <ThumbsDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen }}></div>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen, animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.emeraldGreen, animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-black">
            <div className="max-w-3xl mx-auto p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="relative">
                <div
                  className={`${audioFile ? 'min-h-[80px]' : 'min-h-[64px]'} relative rounded-3xl border transition-all ${
                    isFocused ? 'border-2' : 'border'
                  } ${
                    isFocused ? '' : 'border-gray-400 dark:border-gray-600'
                  }`}
                  style={{
                    borderColor: isFocused ? colors.emeraldGreen : undefined
                  }}
                >
                  <div className="flex items-start gap-3 p-4 pr-16">
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      {audioFile && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all self-start mb-1"
                          style={{
                            backgroundColor: `${colors.emeraldGreen}20`,
                            color: colors.emeraldGreen
                          }}
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span className="max-w-[150px] truncate">{audioFile.name}</span>
                          <button
                            onClick={handleRemoveAudio}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAttachmentClick}
                          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          aria-label="Attach audio file"
                        >
                          <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        <Textarea
                          ref={textareaRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          placeholder="Ask me anything..."
                          className="min-h-[24px] max-h-[150px] resize-none border-0 p-0 bg-transparent text-black dark:text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none leading-6"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() && !audioFile}
                    size="icon"
                    className="absolute right-2 bottom-2 rounded-full h-[40px] w-[40px] shrink-0 transition-all duration-300 disabled:opacity-50"
                    style={{
                      backgroundColor: colors.emeraldGreen,
                      color: colors.white,
                    }}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}