'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Bot, Send, Loader2, Trash2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export default function AgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history
  useEffect(() => {
    apiFetch('/api/v1/manager/agent/history')
      .then((data: unknown) => {
        const d = data as { history: ChatMessage[] };
        if (d.history && d.history.length > 0) {
          setMessages(d.history);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const data = await apiFetch('/api/v1/manager/agent/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      }) as { response: string };

      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de communication';
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${msg}`, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format message content (basic markdown-like)
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold
      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return (
        <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }).reduce<React.ReactNode[]>((acc, el, i) => {
      if (i > 0) acc.push(<br key={`br-${i}`} />);
      acc.push(el);
      return acc;
    }, []);
  };

  if (!historyLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Agent IA</h1>
          <p className="text-xs text-muted-foreground">
            Analysez vos avis, gérez vos exclusions, consultez vos stats
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto">
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Bienvenue !</p>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Je suis votre assistant IA. Posez-moi des questions sur vos avis clients,
                demandez-moi d&apos;exclure certains types d&apos;avis, ou consultez vos statistiques.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {[
                'Résume les avis de cette semaine',
                'Quels sont les points négatifs récurrents ?',
                'Exclure les avis qui parlent du parking',
                'Stats du mois',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.role === 'assistant' ? formatContent(msg.content) : msg.content}
              </div>
              {msg.timestamp && (
                <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Réflexion en cours...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            rows={1}
            className="flex-1 resize-none border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none max-h-32"
            style={{ minHeight: '42px' }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="h-[42px] w-[42px] flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Même agent que sur Telegram · Historique partagé par canal
        </p>
      </div>
    </div>
  );
}
