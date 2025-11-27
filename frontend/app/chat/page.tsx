'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowUp, Mic, Volume2, X, Paperclip, Download, Play, Pause, Copy, ThumbsUp, ThumbsDown, Square } from 'lucide-react';
import { BounceLoader } from 'react-spinners';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/navbar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { colors } from '@/lib/colors';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [audioFile, setAudioFile] = useState<{ url: string; name: string; id: string } | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
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

  const [voices, setVoices] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const fetchAndSetVoices = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voices`);
        if (!response.ok) {
          throw new Error('Failed to fetch voices');
        }
        const data = await response.json();
        const fetchedVoices = data.voices.map((v: any) => ({ value: v.id, label: v.name }));
        
        let allVoices = fetchedVoices;

        // Check session storage for a newly created voice
        const newVoiceJSON = sessionStorage.getItem('selectedVoice');
        if (newVoiceJSON) {
          const newVoice = JSON.parse(newVoiceJSON);
          setAudioFile({ url: newVoice.audio_url, name: newVoice.name, id: newVoice.id });
          
          // Add the new voice to the list if it's not already there
          if (!fetchedVoices.some((v: any) => v.value === newVoice.id)) {
            allVoices = [{ value: newVoice.id, label: newVoice.name }, ...fetchedVoices];
          }
          setSelectedVoice(newVoice.id);
          sessionStorage.removeItem('selectedVoice'); // Clean up
        } else if (fetchedVoices.length > 0) {
          setSelectedVoice(fetchedVoices[0].value);
        }

        setVoices(allVoices);

      } catch (error) {
        console.error("Error setting voices:", error);
        toast.error("Could not load voices.");
      }
    };

    fetchAndSetVoices();
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
    if (audioFile) {
      URL.revokeObjectURL(audioFile.url); // Clean up the object URL
    }
    setAudioFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     // This function is for manual attachment, which we are not focusing on now.
     // We can leave it as is or expand it later if needed.
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard', {
      position: 'top-right',
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUpvote = () => {
    toast.success('Thank you for your feedback!', {
      position: 'top-right',
    });
  };

  const handleDownvote = () => {
    toast.success('Thank you for your feedback!', {
      position: 'top-right',
    });
  };

  const handleStop = () => {
    setIsLoading(false);
    setTypingMessageIndex(null);
  };

  const handleMicrophone = () => {
    window.location.href = '/record';
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedVoice) {
      toast.error("Please enter a message and select a voice.");
      return;
    }

    const userMessage = {
      role: 'user' as const,
      content: message,
      attachment: audioFile ? { url: audioFile.url, name: audioFile.name } : null
    };
    setMessages(prev => [...prev, userMessage]);
    
    const textToSynthesize = message;
    setMessage('');
    setAudioFile(null);
    setIsLoading(true);

    const assistantMessageIndex = messages.length + 1;
    const initialAssistantMessage = {
      role: 'assistant' as const,
      content: '',
      isTyping: true,
      audioResponse: null,
      attachment: null
    };
    setMessages(prev => [...prev, initialAssistantMessage]);
    setTypingMessageIndex(assistantMessageIndex);

    try {
      const formData = new FormData();
      formData.append('text', textToSynthesize);
      formData.append('voice_id', selectedVoice);
      // Language is hardcoded to 'en' for now, as in the backend default.
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
      
      const responseText = `Here is the audio for the text you provided.`;

       setMessages(prev => {
        const updated = [...prev];
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            content: responseText,
            audioResponse: { url: audioUrl, text: responseText },
            isTyping: false,
          };
        }
        return updated;
      });

    } catch (error) {
      console.error('Error generating audio:', error);
      const errorMessage = (error as Error).message || 'An unexpected error occurred during audio generation.';
      toast.error(errorMessage);
       setMessages(prev => {
        const updated = [...prev];
        if (updated[assistantMessageIndex]) {
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            content: `Error: ${errorMessage}`,
            isTyping: false,
          };
        }
        return updated;
      });
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

  const renderChatInput = () => (
    <div className="relative">
      <div
        className={`${audioFile ? 'min-h-[160px]' : 'min-h-[140px]'} relative rounded-3xl border transition-all ${
          isFocused ? 'border-2' : 'border'
        } ${
          isFocused ? '' : 'border-gray-400 dark:border-gray-600'
        }`}
        style={{
          borderColor: isFocused ? colors.emeraldGreen : undefined
        }}
      >
        <div className="flex flex-col p-4 pr-24">
          {audioFile && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all self-start mb-2"
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
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask me anything..."
            className="min-h-[24px] max-h-[150px] resize-none border-0 p-0 pb-10 bg-transparent text-black dark:text-white placeholder:text-gray-500 placeholder:text-left focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none leading-6"
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
              onClick={handleAttachmentClick}
              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
            disabled={!isLoading && typingMessageIndex === null && !message.trim() && !audioFile}
            size="icon"
            className="rounded-full h-[38px] w-[38px] shrink-0 transition-all duration-300 disabled:opacity-50"
            style={{
              backgroundColor: colors.emeraldGreen,
              color: colors.white,
            }}
          >
            {(isLoading || typingMessageIndex !== null) ? <Square className="w-4 h-4" fill="currentColor" /> : <ArrowUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

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
                                  if (playingAudio === index) {
                                    // Logic to pause audio
                                    setPlayingAudio(null);
                                  } else {
                                    const audio = new Audio(msg.audioResponse!.url);
                                    audio.play();
                                    setPlayingAudio(index);
                                    audio.onended = () => setPlayingAudio(null);
                                  }
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
                                 onClick={() => toast.success('Audio file downloaded successfully!')}
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
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
            </div>
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