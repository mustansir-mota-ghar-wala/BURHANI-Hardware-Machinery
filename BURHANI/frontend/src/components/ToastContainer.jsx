import React, { useEffect } from 'react';

export default function ToastContainer({ messages, setMessages }) {
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      setMessages(prev => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [messages, setMessages]);

  if (!messages.length) return null;

  const getAlertClass = (tag) => {
    if (tag === 'error') return 'danger';
    if (tag === 'warning') return 'warning';
    if (tag === 'success') return 'success';
    if (tag === 'info') return 'info';
    return 'primary';
  };

  const getIcon = (tag) => {
    if (tag === 'error') return 'bi-exclamation-octagon';
    if (tag === 'warning') return 'bi-exclamation-triangle';
    if (tag === 'success') return 'bi-check-circle';
    return 'bi-info-circle';
  };

  return (
    <div className="message-container">
      {messages.map((msg, i) => (
        <div key={i}
          className={`alert alert-${getAlertClass(msg.tag)} alert-dismissible fade show`}
          role="alert">
          <i className={`bi ${getIcon(msg.tag)} me-2`}></i>
          {msg.text}
          <button type="button" className="btn-close"
            onClick={() => setMessages(prev => prev.filter((_, idx) => idx !== i))}></button>
        </div>
      ))}
    </div>
  );
}
