import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { queryChatbot } from './chatbotService';
import type { HistorialItem } from './chatbotService';
import { NetworkError } from '@shared/http/errors';

type MessageRole = 'user' | 'assistant' | 'error';

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  sources?: string[];
};

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hi, I\'m the BOCAR assistant. You can ask me about your RFQs, for example:\n• "How many RFQs do I have in draft?"\n• "Which suppliers are assigned to RFQ 5?"\n• "List my RFQs in the quoting process."',
};

function buildHistorial(messages: ChatMessage[]): HistorialItem[] {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .filter(m => m.id !== 'welcome')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

// ── Icons ────────────────────────────────────────────────────────────────────

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 2v3" />
      <circle cx="12" cy="2" r="1" />
      <circle cx="8.5" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 18h6" />
      <path d="M3 13h1M20 13h1" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-sm bg-[#f0f2f5] px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[var(--bocar-blue-50)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-[var(--bocar-blue-50)] animate-bounce" style={{ animationDelay: '160ms' }} />
          <span className="h-2 w-2 rounded-full bg-[var(--bocar-blue-50)] animate-bounce" style={{ animationDelay: '320ms' }} />
        </div>
      </div>
    </div>
  );
}

// ── Widget ───────────────────────────────────────────────────────────────────

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (isOpen) inputRef.current?.focus();
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };

    setMessages(prev => {
      const next = [...prev, userMsg];
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const historial = buildHistorial(next);

      setIsLoading(true);
      setInput('');

      queryChatbot(text, historial, controller.signal)
        .then(resp => {
          setMessages(cur => [
            ...cur,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              content: resp.answer,
              sources: resp.sources,
            },
          ]);
        })
        .catch(err => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          const msg =
            err instanceof NetworkError
              ? 'Could not connect to the server. Check your connection.'
              : 'An error occurred while processing your query. Please try again.';
          setMessages(cur => [
            ...cur,
            { id: `e-${Date.now()}`, role: 'error', content: msg },
          ]);
        })
        .finally(() => setIsLoading(false));

      return next;
    });
  }, [input, isLoading]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Panel ── */}
      <div
        className={`fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0px_8px_24px_#00000040] transition-all duration-200 ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[var(--bocar-blue-100)] px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
              <BotIcon />
            </div>
            <p className="text-sm font-semibold text-white">BOCAR Assistant</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          >
            <XIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => {
            if (msg.role === 'error') {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="flex items-start gap-1.5 max-w-[82%] rounded-2xl rounded-bl-sm bg-red-50 border border-red-200 px-4 py-2.5 text-sm leading-relaxed text-red-700">
                    <span className="mt-0.5 shrink-0"><AlertIcon /></span>
                    <span>{msg.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-[var(--bocar-blue-100)] text-white whitespace-pre-line'
                      : 'rounded-bl-sm bg-[#f0f2f5] text-[var(--bocar-text)]'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        code: ({ children }) => <code className="bg-white/60 rounded px-1 font-mono text-xs">{children}</code>,
                        pre: ({ children }) => <pre className="bg-white/60 rounded p-2 my-1 overflow-x-auto font-mono text-xs">{children}</pre>,
                        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline opacity-80 hover:opacity-100">{children}</a>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <p className="mt-1.5 text-[11px] opacity-50">
                      source: {msg.sources.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-[var(--bocar-border)] bg-white p-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--bocar-border)] bg-[var(--bocar-bg)] px-3 py-2 focus-within:border-[var(--bocar-blue-70)] transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your query..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-[var(--bocar-text)] placeholder:text-[var(--bocar-blue-50)] outline-none disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bocar-blue-100)] text-white transition-all hover:bg-[var(--bocar-blue-90)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SendIcon />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[var(--bocar-blue-50)]">
            Press Enter to send
          </p>
        </div>
      </div>

      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Open BOCAR assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bocar-blue-100)] text-white shadow-[0px_8px_24px_#00000040] transition-all duration-200 hover:bg-[var(--bocar-blue-90)] hover:scale-110"
      >
        {isOpen ? <XIcon /> : <ChatIcon />}
      </button>
    </>
  );
}
