import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

type QAItem = {
  id: number;
  SchemeName: string;
  question: string;
  answer: string;
  nextQuestions?: string[];
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qaList, setQaList] = useState<QAItem[]>([]);
  const [grouped, setGrouped] = useState<Record<string, QAItem[]>>({});
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [chat, setChat] = useState<
    { from: "user" | "bot"; text: string; buttons?: string[]; time: string }[]
  >([]);
  const [availableQuestions, setAvailableQuestions] = useState<string[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const now = () => new Date().toLocaleTimeString();
  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (open && qaList.length === 0) fetchQa();
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [chat, availableQuestions]);

  const fetchQa = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/chatbot/getAllQa");
      const data: QAItem[] = res.data?.data || [];
      setQaList(data);

      const g: Record<string, QAItem[]> = {};
      data.forEach((item) => {
        const key = item.SchemeName || "General";
        if (!g[key]) g[key] = [];
        g[key].push(item);
      });
      setGrouped(g);

      if (g["e-Gold"]) handleSelectScheme("e-Gold", g);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScheme = (
    scheme: string,
    groupedObj?: Record<string, QAItem[]>
  ) => {
    const g = groupedObj || grouped;
    setSelectedScheme(scheme);

    const initialList = g[scheme] ? g[scheme].map((q) => q.question) : [];
    setAvailableQuestions(initialList);

    setChat([
      {
        from:"bot",
        text: "👋 Hello, I'm hear to Assist You 🙋🏻‍♂️",
        time: now(),
      }
    ]);
  };

  // 🧠 Main logic for question click or search
  const askQuestion = async (questionText: string) => {
    setChat((prev) => [
      ...prev,
      { from: "user", text: questionText, time: now() },
      { from: "bot", text: "Bot is typing...", time: now() },
    ]);

    try {
      const res = await axios.post("http://localhost:3000/chatbot/answer", {
        question: questionText,
      });

      const { success, answer, nextQuestions, message } = res.data;

      setChat((prev) => {
        const withoutTyping = prev.slice(0, -1);

        const nextQsArray =
          typeof nextQuestions === "string"
            ? JSON.parse(nextQuestions)
            : nextQuestions || [];

        setAvailableQuestions(nextQsArray);

        return [
          ...withoutTyping,
          {
            from: "bot",
            text: success ? answer : message || "No relevant answer found.",
            buttons: nextQsArray,
            time: now(),
          },
        ];
      });
    } catch {
      setChat((prev) => {
        const withoutTyping = prev.slice(0, -1);
        return [
          ...withoutTyping,
          {
            from: "bot",
            text: "Sorry, something went wrong. Please try again later.",
            time: now(),
          },
        ];
      });
    }
  };

  const handleQuestionClick = (q: string) => askQuestion(q);

  const handleQuerySubmit = () => {
    if (!queryInput.trim()) return;
    askQuestion(queryInput.trim());
    setQueryInput("");
  };

  const resetChat = () => {
    setChat([]);
    setSelectedScheme(null);
    setAvailableQuestions([]);
  };

  return (
    <div style={styles.floating}>
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            if (qaList.length > 0) handleSelectScheme("e-Gold");
          }}
          style={styles.openBtn}
        >
          AI
        </button>
      ) : (
        <div style={styles.widget}>
          <div style={styles.header}>
            <strong>Hello, I'm BHEEM</strong>
            <button
              onClick={() => {
                setOpen(false);
                resetChat();
              }}
              style={styles.iconBtn}
            >
              ×
            </button>
          </div>

          <div style={styles.body}>
            {selectedScheme && (
              <div style={styles.chatArea}>
  {chat.map((m, i) => (
    <div
      key={i}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: m.from === "user" ? "flex-end" : "flex-start",
        marginBottom: 8,
        width: "100%",
      }}
    >
      {/* BOT MESSAGE UI */}
      {m.from === "bot" && (
        <div className="bot-message" style={{ display: "flex", gap: 2 }}>
          <img src="/boticon.png" className="bot-avatar" />
          <div
            style={{
              maxWidth: "90%",
              padding: "8px 12px",
              borderRadius: 12,
              background: "#f1eeeeff",
              color: "#503504ff",
            }}
          >
            {m.text}
          </div>
        </div>
      )}

      {/* USER MESSAGE UI */}
      {m.from === "user" && (
        <div
          className="user-message"
          style={{ display: "flex", gap: 2 }}
        >
          <div
            style={{
              maxWidth: "90%",
              padding: "8px 12px",
              borderRadius: 12,
              background: "#f7d18aff",
              color: "#020000ff",
            }}
          >
            {m.text}
          </div>
          <img src="/user.png" className="bot-avatar" />
        </div>
      )}

      {/* NEXT QUESTION BUTTONS (BOT ONLY) */}
      {m.buttons && m.buttons.length > 0 && m.from === "bot" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "12px",
          }}
        >
          {m.buttons.map((q, index) => (
            <div
              key={q}
              style={{
                animation: `fadeInBubble 0.5s ease ${index * 0.12}s both`,
              }}
            >
              <button
                onClick={() => handleQuestionClick(q.replace(/[[\]"]+/g, ""))}
                style={{
                  border: "none",
                  background: "linear-gradient(135deg, #ffe7d0ff 0%)",
                  borderRadius: "20px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  color: "#000000ff",
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
                  transition: "all 0.2s ease",
                  width: "fit-content",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 10px rgba(108, 99, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 3px 6px rgba(0,0,0,0.15)";
                }}
              >
                {q.replace(/[[\]"]+/g, "")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ))}
  <div ref={chatEndRef} />
</div>
            )}
          </div>

          {/* Manual question box */}
          <div
            style={{
              display: "flex",
              padding: 8
            }}
          >
            <input
              type="text"
              name="query"
              id="query"
              placeholder="Ask anything..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuerySubmit()}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 20,
                border: "1px solid #b1aeaeff",
                marginRight: 6,
                paddingLeft: 14,
              }}
            />
            <button
              onClick={handleQuerySubmit}
              disabled={!queryInput.trim()}
              style={{
                border: "none",
                borderRadius: "50%",
                backgroundImage: "url('/send.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            >
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  floating: {
    position: "fixed",
    right: 40,
    bottom: 40,
    zIndex: 9999,
  },
  openBtn: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "none",
    background: "#0d6efd",
    color: "#fff",
    fontSize: 12,
    cursor: "pointer",
  },
  widget: {
    width: 420,
    height: 620,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    background: "#ffff",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.12)",
  },
  header: {
    padding: "10px 12px",
    background: "linear-gradient(rgba(224, 105, 8, 0.99), rgba(250, 221, 60, 0.95))",
    color:"#050505ff",
    borderBottom: "1px solid #e9ecef",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 20,
  },
  body: {
    flex: 1,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "6px 6px",
    maxHeight: "490px",
  }
};
