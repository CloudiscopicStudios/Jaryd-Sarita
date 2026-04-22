import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  BookHeart, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Send, 
  User, 
  MessageSquare,
  Trash2,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

gsap.registerPlugin(ScrollTrigger);

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  audioBlob?: Blob;
  audioUrl?: string;
  timestamp: Date;
  hasVoice: boolean;
}

export default function Guestbook() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const form = formRef.current;
    const messagesEl = messagesRef.current;
    const leaves = leavesRef.current;

    if (!section || !header || !form || !messagesEl || !leaves) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(header,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'top 50%',
            scrub: true
          }
        }
      );

      // Form card animation
      gsap.fromTo(form,
        { opacity: 0, x: '10vw', rotateZ: 1.5, scale: 0.98 },
        {
          opacity: 1,
          x: 0,
          rotateZ: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'top 40%',
            scrub: true
          }
        }
      );

      // Messages animation
      const messageItems = messagesEl.querySelectorAll('.message-item');
      messageItems.forEach((item) => {
        gsap.fromTo(item,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 90%',
              end: 'top 60%',
              scrub: true
            }
          }
        );
      });

      // Leaves parallax
      gsap.to(leaves.querySelectorAll('.leaf'), {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });

    }, section);

    return () => ctx.revert();
  }, [messages.length]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const playAudio = useCallback((message: GuestMessage) => {
    if (message.audioUrl) {
      if (isPlaying && playingMessageId === message.id) {
        audioPlayerRef.current?.pause();
        setIsPlaying(false);
        setPlayingMessageId(null);
      } else {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        const audio = new Audio(message.audioUrl);
        audioPlayerRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
          setPlayingMessageId(null);
        };
        audio.play();
        setIsPlaying(true);
        setPlayingMessageId(message.id);
      }
    }
  }, [isPlaying, playingMessageId]);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl('');
    setRecordingTime(0);
  }, [audioUrl]);

  const submitMessage = useCallback(() => {
    if (!guestName.trim() || (!guestMessage.trim() && !audioBlob)) return;

    const newMessage: GuestMessage = {
      id: Date.now().toString(),
      name: guestName.trim(),
      message: guestMessage.trim(),
      audioBlob: audioBlob || undefined,
      audioUrl: audioUrl || undefined,
      timestamp: new Date(),
      hasVoice: !!audioBlob
    };

    setMessages(prev => [newMessage, ...prev]);
    setGuestName('');
    setGuestMessage('');
    setAudioBlob(null);
    setAudioUrl('');
    setRecordingTime(0);
  }, [guestName, guestMessage, audioBlob, audioUrl]);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => {
      const message = prev.find(m => m.id === id);
      if (message?.audioUrl) {
        URL.revokeObjectURL(message.audioUrl);
      }
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-16 sm:py-24 overflow-hidden z-40 bg-wedding-sage"
    >
      {/* Floating Leaves */}
      <div ref={leavesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="leaf absolute top-[10%] right-[5%] w-14 h-14 opacity-20" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#D8A7B4"/>
        </svg>
        <svg className="leaf absolute bottom-[20%] left-[3%] w-12 h-12 opacity-15" viewBox="0 0 100 100">
          <path d="M50 5 C30 20, 10 40, 10 60 C10 80, 30 95, 50 95 C70 95, 90 80, 90 60 C90 40, 70 20, 50 5 Z" fill="#A8C4A0"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 font-sans text-xs tracking-[0.18em] uppercase text-wedding-muted mb-4">
            <BookHeart className="w-3 h-3 text-wedding-accent" />
            Guestbook
            <BookHeart className="w-3 h-3 text-wedding-accent" />
          </span>
          <h2 className="font-serif text-[clamp(34px,5vw,52px)] text-wedding-text leading-[1.05] mb-4">
            Leave a Note
          </h2>
          <p className="font-sans text-wedding-muted text-base sm:text-lg max-w-xl mx-auto">
            A few kind words mean the world. Share your wishes, record a voice message, or both!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Messages List */}
          <div ref={messagesRef} className="order-2 lg:order-1">
            <h3 className="font-serif text-xl text-wedding-text mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-wedding-accent" />
              Messages from Loved Ones
              <span className="font-sans text-sm text-wedding-muted">
                ({messages.length})
              </span>
            </h3>

            {messages.length === 0 ? (
              <div className="text-center py-12 bg-white/50 rounded-xl border border-wedding-accent/10">
                <BookHeart className="w-12 h-12 text-wedding-accent/30 mx-auto mb-4" />
                <p className="font-sans text-wedding-muted">
                  No messages yet. Be the first to leave a note!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className="message-item bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-wedding-accent/10 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-wedding-accent/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-wedding-accent" />
                          </div>
                          <span className="font-sans font-medium text-wedding-text">
                            {message.name}
                          </span>
                          <span className="font-sans text-xs text-wedding-muted">
                            {message.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        
                        {message.message && (
                          <p className="font-sans text-wedding-muted text-sm leading-relaxed mb-3">
                            {message.message}
                          </p>
                        )}

                        {message.hasVoice && message.audioUrl && (
                          <button
                            onClick={() => playAudio(message)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-wedding-accent/10 rounded-full text-wedding-accent text-sm hover:bg-wedding-accent/20 transition-colors"
                          >
                            {isPlaying && playingMessageId === message.id ? (
                              <>
                                <Pause className="w-4 h-4" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                <span>Play Voice Message</span>
                              </>
                            )}
                            <Volume2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="text-wedding-muted/50 hover:text-wedding-accent transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div ref={formRef} className="order-1 lg:order-2">
            <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-wedding-accent/10 shadow-lg">
              <h3 className="font-serif text-xl text-wedding-text mb-6">
                Write Your Message
              </h3>

              <div className="space-y-5">
                {/* Name Input */}
                <div>
                  <label className="block font-sans text-sm text-wedding-muted mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Your Name
                  </label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-wedding"
                  />
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block font-sans text-sm text-wedding-muted mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Your Message
                  </label>
                  <Textarea
                    value={guestMessage}
                    onChange={(e) => setGuestMessage(e.target.value)}
                    placeholder="Write your wishes here..."
                    className="input-wedding min-h-[120px] resize-none"
                  />
                </div>

                {/* Voice Recording */}
                <div>
                  <label className="block font-sans text-sm text-wedding-muted mb-2">
                    <Mic className="w-4 h-4 inline mr-1" />
                    Voice Message (Optional, max 30 seconds)
                  </label>

                  {!audioUrl ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-sans text-sm transition-all ${
                          isRecording 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : 'bg-wedding-accent/10 text-wedding-accent hover:bg-wedding-accent/20'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-4 h-4" />
                            <span>Stop Recording ({formatTime(recordingTime)})</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            <span>Record Voice Message</span>
                          </>
                        )}
                      </button>

                      {isRecording && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="font-sans text-xs text-wedding-muted">
                            Recording...
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-wedding-accent/10 rounded-lg">
                      <button
                        onClick={() => {
                          if (audioUrl) {
                            const audio = new Audio(audioUrl);
                            audio.play();
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-wedding-accent text-white flex items-center justify-center hover:bg-wedding-accent/90 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <p className="font-sans text-sm text-wedding-text">
                          Voice message recorded
                        </p>
                        <p className="font-sans text-xs text-wedding-muted">
                          {formatTime(recordingTime)}
                        </p>
                      </div>
                      <button
                        onClick={deleteRecording}
                        className="text-wedding-muted hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  onClick={submitMessage}
                  disabled={!guestName.trim() || (!guestMessage.trim() && !audioBlob)}
                  className="w-full btn-wedding disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Message
                </Button>

                <p className="font-sans text-xs text-wedding-muted text-center">
                  Your message will appear in the guestbook above
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
