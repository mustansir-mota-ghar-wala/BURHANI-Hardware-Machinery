import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m your Burhani Hardware assistant 🔧 Ask me about any tool or machinery!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('english');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiPost('/api/chat/', { message: text, language });
      if (data.status === 'success') {
        const botMsg = { role: 'bot', text: data.reply, productsHtml: data.products_html };
        setMessages(prev => [...prev, botMsg]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Network error. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* FAB Button */}
      <button className="chatbot-fab d-flex align-items-center gap-1" onClick={() => setOpen(o => !o)} title="AI Assistant"
        style={{ background: '#dc3545', color: 'white', padding: open ? '10px' : '6px 12px', borderRadius: '30px', fontWeight: 'bold', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(220,53,69,0.4)', right: '15px', bottom: '140px' }}>
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-chat-dots-fill'}`} style={{ fontSize: '1.1rem' }}></i>
        {!open && <span style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>AI HELP</span>}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: '36px', height: '36px', background: 'rgba(255,193,7,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-tools text-warning"></i>
              </div>
              <div>
                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>Burhani Assistant</div>
                <div className="text-white-50" style={{ fontSize: '0.7rem' }}>AI-powered</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {/* Language Toggle Switch */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
                <button type="button" onClick={() => setLanguage('english')} style={{ background: language === 'english' ? 'white' : 'transparent', color: language === 'english' ? 'black' : 'white', border: 'none', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 'bold', transition: '0.2s' }}>EN</button>
                <button type="button" onClick={() => setLanguage('hindi')} style={{ background: language === 'hindi' ? 'white' : 'transparent', color: language === 'hindi' ? 'black' : 'white', border: 'none', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 'bold', transition: '0.2s' }}>हिं</button>
              </div>
              <button onClick={() => setOpen(false)} className="btn-close btn-close-white" style={{ fontSize: '0.7rem' }}></button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`chatbot-msg ${msg.role}`}>{msg.text}</div>
                {msg.productsHtml && (
                  <div dangerouslySetInnerHTML={{ __html: msg.productsHtml }} />
                )}
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg bot">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="chatbot-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about any tool..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="btn btn-warning rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px', flexShrink: 0, padding: 0 }}>
              <i className="bi bi-send-fill" style={{ fontSize: '0.85rem' }}></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
