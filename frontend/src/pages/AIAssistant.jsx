import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/aiService';
import { useToast } from '../context/ToastContext';
import {
  BotMessageSquare,
  Send,
  Trash2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Cpu,
  User,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [aiStatus, setAiStatus] = useState(null);

  const { success, error, warning } = useToast();
  const chatBottomRef = useRef(null);

  const suggestedQuestions = [
    "What skills am I missing for my target jobs?",
    "How can I improve my active resume?",
    "Which of my saved jobs is the best match?",
    "Prepare me for a Python & Django technical interview.",
    "Give me a 4-week learning roadmap based on my skill gaps."
  ];

  const fetchStatus = async () => {
    try {
      const res = await aiService.checkStatus();
      setAiStatus(res);
    } catch {
      setAiStatus({ available: false, message: 'Backend unreachable.' });
    }
  };

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const history = await aiService.getHistory();
      // Flatten into message list: each conv has question & answer
      const formatted = [];
      history.forEach((h) => {
        formatted.push({ id: `q-${h.id}`, sender: 'user', text: h.question });
        formatted.push({ id: `a-${h.id}`, sender: 'ai', text: h.answer });
      });
      setMessages(formatted);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText = input) => {
    const textToSend = (questionText || '').trim();
    if (!textToSend || loading) return;

    // Optimistically append user message
    const tempUserMsg = { id: `user-${Date.now()}`, sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.askQuestion(textToSend);
      const aiMsg = { id: `ai-${Date.now()}`, sender: 'ai', text: res.answer };
      setMessages((prev) => [...prev, aiMsg]);
      // Update status if needed
      setAiStatus((prev) => ({ ...prev, available: true }));
    } catch (err) {
      const errDetail = err.response?.data?.error || 'AI service is currently offline or taking too long to respond. Please make sure Ollama is running (`ollama serve`).';
      error('Could not complete AI query.');
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **Service Notice**: ${errDetail}\n\n*Your career data and deterministic match features remain fully functional!*`,
          isError: true,
        },
      ]);
      setAiStatus((prev) => ({ ...prev, available: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear all conversation history with the career coach?')) return;
    try {
      await aiService.clearHistory();
      setMessages([]);
      success('Conversation cleared.');
    } catch (err) {
      error('Failed to clear conversation.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '550px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>AI Career Coach</h1>
          <p style={{ fontSize: '0.85rem' }}>
            Context-aware advisor powered by local Ollama LLM, tuned with your live resume, jobs, and skill gaps
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Ollama Status Pill */}
          <div
            title={aiStatus?.message || ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: aiStatus?.available ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              color: aiStatus?.available ? '#34d399' : '#fb7185',
              border: `1px solid ${aiStatus?.available ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: aiStatus?.available ? '#10b981' : '#f43f5e' }} />
            <span>Ollama: {aiStatus?.available ? `${aiStatus.configured_model || 'Online'}` : 'Offline'}</span>
            <button
              onClick={fetchStatus}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: '1px' }}
              title="Refresh connection"
            >
              <RefreshCw size={11} />
            </button>
          </div>

          <button
            onClick={handleClearChat}
            className="btn btn-secondary btn-sm"
            disabled={messages.length === 0}
            title="Clear Chat"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '8px' }}>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '999px',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Sparkles size={12} color="var(--accent-primary)" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Body */}
      <div
        className="glass-card"
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '16px'
        }}
      >
        {fetchingHistory ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="spinner" style={{ borderTopColor: 'var(--accent-primary)' }} />
          </div>
        ) : messages.length === 0 ? (
          /* Empty Chat Welcome */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: 'var(--accent-glow)'
            }}>
              <BotMessageSquare size={28} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              How can I assist your career search today?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.6 }}>
              I have direct context on your uploaded resumes, saved opportunities, and missing skill gaps. Ask me for resume suggestions, mock interview questions, or strategic positioning.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
              }}
            >
              {msg.sender === 'ai' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: msg.isError ? 'rgba(244, 63, 94, 0.2)' : 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  {msg.isError ? <AlertCircle size={16} /> : <BotMessageSquare size={16} />}
                </div>
              )}

              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  fontSize: '0.875rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  background: msg.sender === 'user'
                    ? 'var(--accent-primary)'
                    : msg.isError
                    ? 'rgba(244, 63, 94, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: msg.sender === 'user'
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : msg.isError
                    ? '1px solid rgba(244, 63, 94, 0.3)'
                    : '1px solid var(--border-subtle)',
                  color: msg.isError ? '#fb7185' : 'var(--text-primary)',
                  boxShadow: msg.sender === 'user' ? '0 2px 10px rgba(99, 102, 241, 0.3)' : 'none',
                }}
              >
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <User size={16} />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Bubble */}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '80%' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}>
              <BotMessageSquare size={16} />
            </div>
            <div style={{
              padding: '12px 18px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Analyzing profile context and generating response...
              </span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          padding: '12px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <textarea
          className="textarea-field"
          placeholder="Ask anything about your resume, applications, interview preparation, or target skills..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            minHeight: '44px',
            maxHeight: '120px',
            padding: '10px 14px',
            resize: 'none',
            flex: 1,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 18px' }}
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
