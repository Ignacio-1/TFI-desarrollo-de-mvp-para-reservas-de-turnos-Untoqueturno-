import { useState } from 'react';
import { Button } from './ui/button';
import { MessageCircle, X, Send } from 'lucide-react';
import { askAI } from '../lib/ai';

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: '¡Hola! Soy la Inteligencia Artificial de Untoqueturno. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Llamada asíncrona a nuestro Backend (que internamente usa RabbitMQ)
      const reply = await askAI({ data: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Hubo un error de conexión.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} className="h-14 w-14 rounded-full shadow-lg">
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div className="flex flex-col w-80 h-[28rem] bg-background border rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
            <span className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Asistente IA
            </span>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-75">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`p-3 rounded-lg text-sm max-w-[85%] ${m.role === 'ai' ? 'bg-muted self-start' : 'bg-primary text-primary-foreground self-end'}`}>
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-muted self-start p-3 rounded-lg text-sm max-w-[85%] animate-pulse">
                Pensando...
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Escribe un mensaje..." 
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="px-3">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
