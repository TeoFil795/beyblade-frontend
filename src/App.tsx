import React, { useState, useRef } from 'react';
import { Terminal } from './components/Terminal';
import { ChatMessage, AppState, BeyCombo } from './types';
// import { searchCombos, parseBeyCSV, INITIAL_DB } from './data/beyData'; // NON SERVONO PIÙ
// import { askGemini } from './services/geminiService'; // NON SERVE PIÙ

// Definisci l'URL del tuo backend Render qui!
const BACKEND_URL = "https://beyblade-brain.onrender.com"; 

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Il DB locale non serve più perché i dati sono nel backend Python
  // Tuttavia, se vuoi mantenere la funzionalità di upload CSV per "ingannare" l'utente visualmente, 
  // possiamo lasciarlo, ma sappi che il backend userà sempre il SUO csv caricato su Render.
  // Per ora semplifichiamo rimuovendo la logica complessa di upload che non avrebbe effetto sul server.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || appState === AppState.SEARCHING) return;

    const userText = input.trim();
    setInput('');
    
    // 1. Aggiungi Messaggio Utente
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: Date.now()
    };
    
    // Aggiorna lo stato dei messaggi
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setAppState(AppState.SEARCHING); // Mostra "Processing..."

    try {
      // 2. CHIAMATA AL TUO BACKEND RENDER (Python)
      // Convertiamo la history nel formato che piace al backend Python (role/content)
      const apiHistory = newHistory.map(m => ({
        role: m.role === 'ai' ? 'assistant' : m.role, // Mappa 'ai' -> 'assistant'
        content: m.content
      }));

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          messages: apiHistory
        })
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponseText = data.answer; // La risposta dell'esperto Python

      setAppState(AppState.ANALYZING); // Solo effetto scenico
      await new Promise(r => setTimeout(r, 300)); // Piccolo delay per effetto "hack"

      // 3. Aggiungi Messaggio AI
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponseText,
        // relatedCombos: [], // Il backend ci dà già il testo completo, non serve l'array grezzo
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
      
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `**CRITICAL ERROR:** Connection to Python Core failed.\nEnsure Backend is LIVE at ${BACKEND_URL}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setAppState(AppState.IDLE);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-2 md:p-6 overflow-hidden scanlines relative">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full opacity-20" />
      </div>

      {/* Main Terminal Window */}
      <div className="w-full max-w-5xl h-[90vh] bg-slate-950/90 border border-slate-800 shadow-2xl rounded-lg flex flex-col relative backdrop-blur-md overflow-hidden z-20">
        
        {/* Terminal Header */}
        <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <h1 className="text-green-500 font-display font-bold tracking-wider text-sm md:text-base ml-2">
                    BEYPAL_PUX // <span className="text-white">ONLINE_MODE</span>
                </h1>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-[10px] font-mono text-gray-500 flex items-center gap-2 hidden md:flex">
                    <span className={`w-2 h-2 rounded-full ${appState !== AppState.IDLE ? 'bg-green-400 animate-pulse' : 'bg-green-600'}`} />
                    {appState === AppState.IDLE ? 'CONNECTED' : 'TRANSMITTING'}
                </div>
            </div>
        </div>

        {/* Terminal Body */}
        <Terminal messages={messages} isLoading={appState !== AppState.IDLE} />

        {/* Input Area */}
        <div className="p-4 bg-slate-900/50 border-t border-slate-800 shrink-0">
          <form onSubmit={handleSubmit} className="relative">
             <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={appState !== AppState.IDLE}
                placeholder="Query the Python Brain..."
                className="w-full bg-slate-950 border border-slate-700 text-green-100 font-mono text-sm rounded p-4 pl-10 focus:outline-none focus:border-green-500/50 focus:shadow-[0_0_15px_rgba(34,197,94,0.1)] disabled:opacity-50 transition-all"
             />
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">{'>'}</div>
             <button 
                type="submit" 
                disabled={!input.trim() || appState !== AppState.IDLE}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-green-900/30 text-green-400 border border-green-800/50 rounded text-xs font-display hover:bg-green-800/50 hover:text-green-300 disabled:opacity-0 transition-all"
             >
                SEND
             </button>
          </form>
          <div className="mt-2 flex justify-between text-[10px] text-gray-600 font-mono uppercase">
             <span>Engine: PYTHON RAG (GPT-4o)</span>
             <span className="text-green-500">
                Target: RENDER CLOUD
             </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;