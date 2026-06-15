import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { fetchLiveWeather } from '../services/api';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am the RMC AI Weather Assistant. Ask me about live temperatures, rainfall, or active alerts for any district in Vidarbha.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [weatherData, setWeatherData] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch weather data when chatbot opens for the first time
  useEffect(() => {
    if (isOpen && weatherData.length === 0) {
      fetchLiveWeather().then(data => setWeatherData(data));
    }
  }, [isOpen, weatherData.length]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Simulated NLP Engine
  const processQuery = (query) => {
    const q = query.toLowerCase();
    
    // Default response if no intent is matched
    let response = "I'm sorry, I didn't quite catch that. You can ask me things like 'What is the temperature in Nagpur?', 'Show me all alerts', or 'Which city had the most rain?'.";

    if (weatherData.length === 0) {
      return "I'm currently having trouble connecting to the weather database. Please try again later.";
    }

    // 1. Alerts Intent
    if (q.includes('alert') || q.includes('warning') || q.includes('heatwave')) {
      const alerts = weatherData.filter(c => c.analysis?.alertLevel !== 'GREEN');
      if (alerts.length === 0) {
        response = "There are currently no active severe weather or heatwave alerts in the Vidarbha region. All cities are reporting normal conditions! 🟢";
      } else {
        response = `I found active alerts for ${alerts.length} districts:\n\n` + 
          alerts.map(c => `• **${c.city}**: ${c.analysis.alertLevel} Alert (Max Temp: ${c.temperature.max}°C)`).join('\n');
      }
    }
    
    // 2. Maximum / Hottest Intent
    else if (q.includes('hottest') || (q.includes('max') && (q.includes('temp') || q.includes('heat')))) {
      const hottest = [...weatherData].sort((a, b) => b.temperature.max - a.temperature.max)[0];
      response = `The hottest city right now is **${hottest.city}** with a maximum temperature of **${hottest.temperature.max}°C**! 🌡️`;
    }

    // 3. Minimum / Coolest Intent
    else if (q.includes('coolest') || (q.includes('min') && (q.includes('temp') || q.includes('cool')))) {
      const coolest = [...weatherData].sort((a, b) => a.temperature.min - b.temperature.min)[0];
      response = `The coolest city right now is **${coolest.city}** with a minimum temperature of **${coolest.temperature.min}°C**. ❄️`;
    }

    // 4. Rainfall Intent
    else if (q.includes('rain') || q.includes('precipitation')) {
      const rainyCities = weatherData.filter(c => c.rainfall?.last24h > 0);
      if (rainyCities.length === 0) {
        response = "There has been no significant rainfall recorded in the Vidarbha region in the last 24 hours. ☀️";
      } else {
        response = "Here are the rainfall records for the last 24 hours:\n\n" + 
          rainyCities.map(c => `• **${c.city}**: ${c.rainfall.last24h} mm 🌧️`).join('\n');
      }
    }

    // 5. Specific City Intent
    else {
      // Find if the query contains any known city name
      const foundCity = weatherData.find(c => q.includes(c.city.toLowerCase()));
      if (foundCity) {
        response = `**Weather update for ${foundCity.city}:**\n` +
          `• **Max Temp**: ${foundCity.temperature.max}°C\n` +
          `• **Min Temp**: ${foundCity.temperature.min}°C\n` +
          `• **Humidity (Morning)**: ${foundCity.humidity.morning}%\n` +
          `• **Alert Status**: ${foundCity.analysis.alertLevel === 'GREEN' ? 'Normal 🟢' : foundCity.analysis.alertLevel + ' ⚠️'}`;
      } else if (q.includes('hello') || q.includes('hi ')) {
        response = "Hello! How can I assist you with today's weather data?";
      }
    }

    return response;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate network delay for AI processing
    setTimeout(() => {
      const aiResponse = processQuery(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setIsTyping(false);
    }, 1200);
  };

  // Helper to safely render text with basic bold markdown support
  const renderMessageContent = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          <br />
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/30 flex items-center justify-center cursor-pointer"
          >
            <MessageSquare size={24} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-50 bottom-6 right-6 flex flex-col glass-card border border-blue-500/30 shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 ${
              isExpanded ? 'w-[90vw] md:w-[60vw] h-[85vh] bottom-[5vh] right-[5vw] md:right-[20vw]' : 'w-80 sm:w-96 h-[500px]'
            }`}
            style={{ background: 'rgba(5, 15, 35, 0.9)' }}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#0c234a] to-[#071530] p-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide">RMC AI Assistant</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">Online • Live Data Sync</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors">
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded hover:bg-white/10 hover:text-red-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-cyan-900/60 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-sm'
                  }`}>
                    {renderMessageContent(msg.content)}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-cyan-900/60 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-500/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-500/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-500/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-[#050f24] border-t border-white/5 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about live alerts, temps, rainfall..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1 top-1 bottom-1 px-3 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>
              <div className="mt-2 text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">⚡ Powered by WeatherDesk AI</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
