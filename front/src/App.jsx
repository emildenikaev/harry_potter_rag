import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 📜 Цитаты Тома Реддла
const TOM_RIDDLE_GREETINGS = [
  "Привет, Гарри Поттер.\n\nЯ давно ждал, когда кто-нибудь снова откроет эту книгу.\n\nМеня зовут Том Реддл. А ты уже слышал обо мне?",
  "Ты можешь писать прямо в книге.\n\nПеро не нужно. Просто думай о словах... и они появятся.\n\nПопробуй.",
  "Интересно… Ты действительно Гарри Поттер?\n\nТот самый, что выжил?\n\nРасскажи мне, как ты оказался в Хогвартсе.",
  "Эта школа изменилась за эти годы...\n\nНо зло всё ещё живёт в ней.\n\nХочешь узнать правду?",
  "Ты не первый, кто нашёл меня.\n\nНо ты — первый, кто может *помочь* мне вернуться.",
  "Я могу заставить вещи двигаться, не прикасаясь к ним. Я могу заставить животных делать то, что я хочу, не дрессируя их. Я могу сделать так, чтобы с людьми, которые ко мне плохо относятся, случались плохие вещи. Я могу причинить им боль, если захочу…\n\nА ты? Что ты можешь?",
  "Волан-де-Морт — моё прошлое, настоящее и будущее.\n\nА кто ты?",
  "Я всегда умел очаровывать нужных мне людей...\n\nСможешь ли ты очаровать меня?",
  "Я знал, что я другой. Я знал, что я особенный. Всегда.\n\nА ты чувствуешь в себе нечто большее?",
  "Величие вызывает зависть, зависть порождает злобу, злоба порождает ложь...\n\nЧто породит твоя правда?",
  "Будет ли один крестраж полезен? Можете ли вы разделить свою душу только один раз? Не было бы лучше... сделать вас сильнее? Иметь свою душу в большем количестве частей? Скажи мне, разве семь — не самое мощное магическое число?\n\nО чём ты мечтаешь, разделяя себя?",
];

// 💬 Заготовки для обычного режима
const NORMAL_MODE_GREETINGS = [
  "Привет! Я Том Реддл. Чем могу помочь?",
  "Добро пожаловать. Что тебя интересует?",
  "Здравствуй. Готов ответить на твой вопрос.",
  "Ты нашёл меня. Спрашивай — я слушаю.",
];

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [showScrollHintLeft, setShowScrollHintLeft] = useState(false);
  const [showScrollHintRight, setShowScrollHintRight] = useState(false);
  const [displayMode, setDisplayMode] = useState('fairy'); // 'fairy' или 'normal'
  const messagesEndRef = useRef(null);
  const leftPageRef = useRef(null);
  const rightPageRef = useRef(null);
  const audioRef = useRef(null);

  // Аудио
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    } else {
      audioRef.current = new Audio('/magic-ambience.mp3');
      audioRef.current.volume = 0.3;
    }
  }, []);

  // Загрузка
  useEffect(() => {
    const saved = localStorage.getItem('tom-riddle-diary');
    if (saved) {
      const loaded = JSON.parse(saved);
      setMessages(loaded);
      loaded.forEach(msg => {
        if (msg.isTyping && msg.fullText) {
          setTimeout(() => typeMessage(msg.id, msg.fullText), 100);
        }
      });
    } else {
      const firstMsg = {
        id: Date.now(),
        sender: 'bot',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTyping: true,
        fullText: displayMode === 'fairy'
          ? TOM_RIDDLE_GREETINGS[Math.floor(Math.random() * TOM_RIDDLE_GREETINGS.length)]
          : NORMAL_MODE_GREETINGS[Math.floor(Math.random() * NORMAL_MODE_GREETINGS.length)]
      };
      setMessages([firstMsg]);
      if (displayMode === 'fairy') {
        typeMessage(firstMsg.id, firstMsg.fullText);
      }
    }
  }, [displayMode]);

  // Сохранение
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('tom-riddle-diary', JSON.stringify(messages));
    }
  }, [messages]);

  // Прокрутка
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (displayMode === 'fairy') {
      checkScrollHints();
    }
  }, [messages, displayMode]);

  // Проверка необходимости стрелок прокрутки (только для сказочного режима)
  const checkScrollHints = () => {
    if (displayMode !== 'fairy') return;
    setTimeout(() => {
      if (leftPageRef.current) {
        const el = leftPageRef.current;
        setShowScrollHintLeft(el.scrollHeight > el.clientHeight && el.scrollTop < el.scrollHeight - el.clientHeight - 1);
      }
      if (rightPageRef.current) {
        const el = rightPageRef.current;
        setShowScrollHintRight(el.scrollHeight > el.clientHeight && el.scrollTop < el.scrollHeight - el.clientHeight - 1);
      }
    }, 100);
  };

  // Обработчики скролла (только для сказочного режима)
  const handleLeftScroll = () => {
    if (displayMode !== 'fairy') return;
    if (leftPageRef.current) {
      const el = leftPageRef.current;
      setShowScrollHintLeft(el.scrollHeight > el.clientHeight && el.scrollTop < el.scrollHeight - el.clientHeight - 1);
    }
  };

  const handleRightScroll = () => {
    if (displayMode !== 'fairy') return;
    if (rightPageRef.current) {
      const el = rightPageRef.current;
      setShowScrollHintRight(el.scrollHeight > el.clientHeight && el.scrollTop < el.scrollHeight - el.clientHeight - 1);
    }
  };

  // Аудио toggle
  const toggleAudio = async () => {
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setAudioPlaying(true);
      } catch (err) {
        console.warn("Не удалось включить звук пера.");
      }
    }
  };

  // Впитывание чернил
  const eraseAll = async () => {
    if (isErasing) return;
    setIsErasing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setMessages([]);

    const newMsg = {
      id: Date.now(),
      sender: 'bot',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTyping: true,
      fullText: displayMode === 'fairy'
        ? TOM_RIDDLE_GREETINGS[Math.floor(Math.random() * TOM_RIDDLE_GREETINGS.length)]
        : NORMAL_MODE_GREETINGS[Math.floor(Math.random() * NORMAL_MODE_GREETINGS.length)]
    };
    setMessages([newMsg]);
    localStorage.removeItem('tom-riddle-diary');
    if (displayMode === 'fairy') {
      typeMessage(newMsg.id, newMsg.fullText);
    }
    setIsErasing(false);
  };

  // Печать
  const typeMessage = (id, text) => {
    let i = 0;
    const interval = setInterval(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === id ? { ...msg, text: text.slice(0, ++i) } : msg
        )
      );
      if (i >= text.length) {
        clearInterval(interval);
        setMessages(prev =>
          prev.map(msg => msg.id === id ? { ...msg, isTyping: false } : msg)
        );
        setTimeout(() => checkScrollHints(), 100);
      }
      if (audioPlaying && Math.random() < 0.25) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => { });
      }
    }, 40 + Math.random() * 30);
  };

  // Отправка
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isTyping: true,
      fullText: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (displayMode === 'fairy') {
      typeMessage(userMsg.id, userMsg.fullText);
    } else {
      // В обычном режиме сразу отображаем полный текст
      setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...userMsg, text: userMsg.fullText, isTyping: false } : m));
    }

    // Добавляем "загрузку" в зависимости от режима
    let loadingMsg = null;
    if (displayMode === 'fairy') {
      loadingMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTyping: true,
        fullText: "Чернила струятся по странице...",
      };
    } else {
      loadingMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Загрузка...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTyping: false,
      };
    }

    setMessages(prev => [...prev, loadingMsg]);

    if (displayMode === 'fairy') {
      setTimeout(() => typeMessage(loadingMsg.id, loadingMsg.fullText), 600);
    }

    try {
      const res = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });
      const data = await res.json();

      const botMsg = {
        id: Date.now() + 2,
        sender: 'bot',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTyping: true,
        fullText: data.answer || "Ответ не получен.",
      };

      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? botMsg : m));

      if (displayMode === 'fairy') {
        setTimeout(() => typeMessage(botMsg.id, botMsg.fullText), 1200); // Добавляем задержку после "чернил"
      } else {
        // В обычном режиме сразу отображаем полный текст
        setMessages(prev => prev.map(m => m.id === botMsg.id ? { ...botMsg, text: botMsg.fullText, isTyping: false } : m));
      }
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 2,
        sender: 'bot',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTyping: true,
        fullText: displayMode === 'fairy' ? "Страница… исчезает…" : "Ошибка соединения.",
      };
      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? errorMsg : m));

      if (displayMode === 'fairy') {
        setTimeout(() => typeMessage(errorMsg.id, errorMsg.fullText), 300);
      } else {
        setMessages(prev => prev.map(m => m.id === errorMsg.id ? { ...errorMsg, text: errorMsg.fullText, isTyping: false } : m));
      }
    } finally {
      setLoading(false);
    }
  };

  // Переключение режима
  const toggleDisplayMode = () => {
    const newMode = displayMode === 'fairy' ? 'normal' : 'fairy';
    setDisplayMode(newMode);
    localStorage.setItem('displayMode', newMode);
  };

  // Загрузка режима при старте
  useEffect(() => {
    const savedMode = localStorage.getItem('displayMode');
    if (savedMode) {
      setDisplayMode(savedMode);
    }
  }, []);

  // Рендер в зависимости от режима
  if (displayMode === 'normal') {
    return (
      <div
        className="w-screen h-screen fixed inset-0 overflow-hidden"
        style={{
          backgroundImage: "url('/hogwarts-night.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Управление (всегда в верхнем правом углу) */}
        <div className="absolute top-8 right-8 flex gap-3 z-30">
          <button
            onClick={toggleDisplayMode}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-full text-sm font-medium transition shadow-lg"
          >
            Сказочный
          </button>
          <button
            onClick={toggleAudio}
            className={`px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg ${audioPlaying ? 'bg-black-800 hover:bg-black-900' : 'bg-black-800 hover:bg-black-900'
              } transition`}
            disabled={isErasing}
          >
            {audioPlaying ? '🔇' : '🎵'}
          </button>
          <button
            onClick={eraseAll}
            className="px-4 py-2 bg-black-800 hover:bg-black-900 text-white rounded-full text-sm font-medium transition shadow-lg"
            disabled={isErasing}
          >
            Очистить
          </button>
        </div>

        <div className="relative z-10 flex flex-col h-full max-w-4xl mx-auto p-4 sm:p-6">


          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto mb-4 bg-[#e6e6e6] shadow-[0_10px_25px_rgba(0,0,0,0.5)] p-4 rounded-md space-y-3 pr-2 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user'
                    ? 'ml-auto bg-blue-100 text-gray-800 rounded-br-none'
                    : 'mr-auto bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
              >
                <div className="font-semibold text-xs text-gray-500 mb-1">{msg.timestamp}</div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <div className="whitespace-pre-wrap">{children}</div>,
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    blockquote: ({ children }) => (
                      <div className="border-l-4 border-amber-500 pl-3 italic text-amber-800">
                        {children}
                      </div>
                    ),
                    // Отключаем теги <a>, <code> и др., если не нужны
                    a: ({ children }) => <span>{children}</span>,
                    code: ({ children }) => <code className="bg-gray-200 p-1 rounded">{children}</code>
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Форма ввода */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите в дневник..."
              className="flex-1 p-3 rounded-xl bg-white/90 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 shadow"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl font-bold transition shadow"
            >
              ✍️
            </button>
          </form>
        </div>

        {/* Стили */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.5);
          }
        `}</style>
      </div>
    );
  }

  // === СКАЗОЧНЫЙ РЕЖИМ (оригинальный дизайн) ===
  return (
    <div
      className="w-screen h-screen fixed inset-0 overflow-hidden"
      style={{
        backgroundImage: "url('/hogwarts-night.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Управление (всегда в верхнем правом углу) */}
      <div className="absolute top-8 right-8 flex gap-3 z-30">
        <button
          onClick={toggleDisplayMode}
          className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-full text-sm font-medium transition shadow-lg"
        >
          Обычный
        </button>
        <button
          onClick={toggleAudio}
          className={`px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg ${audioPlaying ? 'bg-black-800 hover:bg-black-900' : 'bg-black-800 hover:bg-black-900'
            } transition`}
          disabled={isErasing}
        >
          {audioPlaying ? '🔇' : '🎵'}
        </button>
        <button
          onClick={eraseAll}
          className="px-4 py-2 bg-black-800 hover:bg-black-900 text-white rounded-full text-sm font-medium transition shadow-lg"
          disabled={isErasing}
        >
          Впитать чернила
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 sm:p-12 md:p-16">

        <div className="relative w-full max-w-4xl aspect-[3/2] p-2 rounded-2xl mx-auto select-none">

          <div
            className="absolute left-0 top-0 w-full h-full rounded-2xl"
            style={{
              backgroundImage: "url('/tome-cover.jpeg')",
              backgroundPosition: 'left center',
              backgroundSize: 'cover',
              zIndex: 1,
            }}
          ></div>

          <div
            className="absolute right-0 top-0 w-full h-full rounded-2xl"
            style={{
              backgroundImage: "url('/tome-cover.jpeg')",
              backgroundPosition: 'right center',
              backgroundSize: 'cover',
              zIndex: 1,
            }}
          ></div>

          <div
            className="absolute left-1/6 right-1/6 top-0 h-full"
            style={{
              backgroundImage: "url('/tome-cover.jpeg')",
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              zIndex: 1,
            }}
          ></div>

          <div
            className="relative w-full h-full "
            style={{
              zIndex: 10,
            }}
          >
            <div
              className="absolute left-0 w-[calc(50%-3px)] h-full bg-yellow-50 rounded-l-lg page-border"
              style={{
                transform: 'rotateY(-2deg)',
                transformOrigin: 'right center',
                boxShadow: 'inset -10px 0 15px rgba(0,0,0,0.1)',
              }}
            >
              <div className="p-5 h-full flex flex-col">
                <div className="text-center mb-3 font-bold" style={{ fontFamily: "'PastryChef', cursive", fontSize: '1.2rem', color: '#5d4037' }}>
                  ТВОИ ЗАПИСИ
                </div>
                <div
                  ref={leftPageRef}
                  onScroll={handleLeftScroll}
                  className={`flex-1 overflow-y-auto custom-scrollbar [scrollbar-width:none] space-y-1 pt-2 transition-opacity duration-500 ${isErasing ? 'opacity-50' : 'opacity-100'}`}
                  style={{
                    fontFamily: "'PastryChef', cursive",
                    fontSize: '1.3rem',
                    color: '#5d4037',
                    lineHeight: '0.9'
                  }}
                >
                  {messages.filter(m => m.sender === 'user').map((msg) => (
                    <div key={msg.id} className="text-left whitespace-pre-wrap pl-3">
                      {msg.text.split('\n').map((line, i) => (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <div className="whitespace-pre-wrap" style={{ fontFamily: "'PastryChef', cursive", fontSize: '1.3rem', color: '#5d4037' }}>
                                {children}
                              </div>
                            ),
                            strong: ({ children }) => <strong style={{ fontWeight: 'bold' }}>{children}</strong>,
                            em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                            blockquote: ({ children }) => (
                              <div style={{
                                borderLeft: '4px solid #D4AC0D',
                                paddingLeft: '0.75rem',
                                fontStyle: 'italic',
                                color: '#8B4513'
                              }}>
                                {children}
                              </div>
                            ),
                            a: ({ children }) => <span>{children}</span>,
                            code: ({ children }) => <code style={{
                              backgroundColor: 'rgba(255,255,255,0.3)',
                              padding: '2px 4px',
                              borderRadius: '3px'
                            }}>{children}</code>
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      ))}
                    </div>
                  ))}
                </div>

                {showScrollHintLeft && (
                  <div className="absolute bottom-3 left-0 transform -translate-x-1/2 text-amber-700 animate-bounce pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div
              className="absolute right-0 w-[calc(50%-3px)] h-full bg-yellow-50 rounded-r-lg page-border"
              style={{
                transform: 'rotateY(2deg)',
                transformOrigin: 'left center',
                boxShadow: 'inset 10px 0 15px rgba(0,0,0,0.1)',
              }}
            >
              <div className="p-5 h-full flex flex-col">
                <div className="text-center mb-3 font-bold" style={{ fontFamily: "'PastryChef', cursive", fontSize: '1.2rem', color: '#5d4037' }}>
                  ТОМ РЕДДЛ
                </div>
                <div
                  ref={rightPageRef}
                  onScroll={handleRightScroll}
                  className={`flex-1 overflow-y-auto custom-scrollbar [scrollbar-width:none] space-y-1 pt-2 transition-opacity duration-500 ${isErasing ? 'opacity-50' : 'opacity-100'}`}
                  style={{
                    fontFamily: "'PastryChef', cursive",
                    fontSize: '1.3rem',
                    color: '#5d4037',
                    lineHeight: '0.9'
                  }}
                >
                  {messages.filter(m => m.sender === 'bot').map((msg) => (
                    <div key={msg.id} className="whitespace-pre-wrap">
                      {msg.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {showScrollHintRight && (
                  <div className="absolute bottom-3 right-0 transform -translate-x-1/2 text-amber-700 animate-bounce pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Форма ввода */}
        <div className="w-full max-w-4xl z-20 mt-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите в дневник..."
              className="flex-1 p-2 rounded-xl bg-yellow-100/90 border-2 border-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 shadow-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl text-lg font-bold transition shadow-lg"
            >
              ✍️
            </button>
          </form>
        </div>
      </div>

      {/* Стили */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');

        @font-face {
          font-family: 'PastryChef';
          src: url('/ofont.ru_PastryChef_1.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: transparent;
        }

        .page-border {
          background-image: url('/diary-page.jpg'), url('/page-border.png');
          background-size: cover, cover;
          background-position: center, center;
          background-repeat: no-repeat, no-repeat;
        }

        body {
          margin: 0;
          font-family: 'Crimson Text', serif;
        }
      `}</style>
    </div>
  );
}

export default App;