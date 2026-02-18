import { useState, useRef, useEffect } from "react";
import { Send, Search, Phone, Video, MoreVertical, Image, Smile } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { mockCreators } from "@/data/creators";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  text: string;
  from: "me" | "them";
  time: string;
}

interface Conversation {
  id: number;
  creator: (typeof mockCreators)[0];
  lastMessage: string;
  unread: number;
  time: string;
  messages: Message[];
}

const conversations: Conversation[] = [
  {
    id: 1,
    creator: mockCreators[0],
    lastMessage: "Obrigada pelo apoio! 💕",
    unread: 2,
    time: "2min",
    messages: [
      { id: 1, text: "Oi! Adorei seu último post de treino 🔥", from: "me", time: "14:20" },
      { id: 2, text: "Que fofo! Fico feliz que gostou ❤️", from: "them", time: "14:22" },
      { id: 3, text: "Quando vem o próximo conteúdo exclusivo?", from: "me", time: "14:23" },
      { id: 4, text: "Obrigada pelo apoio! 💕", from: "them", time: "14:25" },
    ],
  },
  {
    id: 2,
    creator: mockCreators[4],
    lastMessage: "A aula de hoje está confirmada!",
    unread: 0,
    time: "1h",
    messages: [
      { id: 1, text: "Olá! Tenho uma dúvida sobre o módulo de investimentos", from: "me", time: "10:00" },
      { id: 2, text: "Claro, pode perguntar!", from: "them", time: "10:05" },
      { id: 3, text: "A aula de hoje está confirmada!", from: "them", time: "10:06" },
    ],
  },
  {
    id: 3,
    creator: mockCreators[6],
    lastMessage: "Esse look ficou incrível em você!",
    unread: 1,
    time: "3h",
    messages: [
      { id: 1, text: "Comprei o look que você indicou!", from: "me", time: "08:00" },
      { id: 2, text: "Que maravilha!! 😍", from: "them", time: "08:10" },
      { id: 3, text: "Esse look ficou incrível em você!", from: "them", time: "08:11" },
    ],
  },
  {
    id: 4,
    creator: mockCreators[2],
    lastMessage: "A receita de risoto está no link!",
    unread: 0,
    time: "1d",
    messages: [
      { id: 1, text: "Qual a receita que você usou no vídeo?", from: "me", time: "yesterday" },
      { id: 2, text: "A receita de risoto está no link!", from: "them", time: "yesterday" },
    ],
  },
];

const Messages = () => {
  const [selected, setSelected] = useState<Conversation>(conversations[0]);
  const [convs, setConvs] = useState(conversations);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected.messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      text: input.trim(),
      from: "me",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = convs.map((c) =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: input.trim(), time: "agora" }
        : c
    );
    setConvs(updated);
    setSelected((prev) => ({ ...prev, messages: [...prev.messages, newMsg] }));
    setInput("");
  };

  const filteredConvs = convs.filter((c) =>
    c.creator.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container max-w-6xl pt-20 pb-0 flex-1 flex" style={{ height: "calc(100vh - 80px)" }}>
        <div className="flex w-full rounded-2xl overflow-hidden glass-card my-4 gap-0">
          {/* Conversation list */}
          <div className="w-80 flex-shrink-0 border-r border-border/50 flex flex-col">
            <div className="p-4 border-b border-border/50">
              <h2 className="font-display text-lg font-bold text-foreground mb-3">Mensagens</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversa..."
                  className="pl-9 bg-muted/20 border-border/50 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelected(conv);
                    setConvs((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread: 0 } : c));
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/20 border-b border-border/30",
                    selected.id === conv.id && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <img src={conv.creator.avatar} alt={conv.creator.name} className="h-11 w-11 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground truncate">{conv.creator.name}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">{conv.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-primary text-[10px] font-bold text-primary-foreground">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={selected.creator.avatar} alt={selected.creator.name} className="h-10 w-10 rounded-full object-cover" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{selected.creator.name}</p>
                  <p className="text-xs text-green-400">Online agora</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  <Video className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {selected.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.from === "me" ? "justify-end" : "justify-start")}
                >
                  {msg.from === "them" && (
                    <img src={selected.creator.avatar} alt="" className="h-7 w-7 rounded-full object-cover mr-2 self-end flex-shrink-0" />
                  )}
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.from === "me"
                      ? "bg-gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/50 text-foreground rounded-bl-md"
                  )}>
                    <p>{msg.text}</p>
                    <p className={cn("text-[10px] mt-1", msg.from === "me" ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <Image className="h-5 w-5" />
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                  <Smile className="h-5 w-5" />
                </button>
                <Input
                  placeholder="Escreva uma mensagem..."
                  className="bg-muted/20 border-border/50 flex-1"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
