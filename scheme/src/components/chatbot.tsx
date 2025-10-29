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
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const now = () => new Date().toLocaleTimeString();
  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (open && qaList.length === 0) fetchQa();
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [chat, availableQuestions, feedbackMode]);

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
        from: "bot",
        text: `Hi! You're chatting with Bhima e-Gold Assistant.`,
        time: now(),
      },
      {
        from: "bot",
        text: "Select a question below to get started.",
        buttons: initialList,
        time: now(),
      },
    ]);
  };

  const handleQuestionClick = async (questionText: string) => {
    setChat((prev) => [
      ...prev,
      { from: "user", text: questionText, time: now() },
      { from: "bot", text: "Bot is typing...", time: now() },
    ]);

    try {
      const res = await axios.post("http://localhost:3000/chatbot/answer", {
        question: questionText,
      });

      const { answer, nextQuestions } = res.data;

      setChat((prev) => {
        const withoutTyping = prev.slice(0, -1);
        const nextQsArray = nextQuestions ? JSON.parse(nextQuestions) : [];

        setAvailableQuestions(nextQsArray);
        if (!nextQsArray.length) setFeedbackMode(true);

        return [
          ...withoutTyping,
          {
            from: "bot",
            text: answer,
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
            text: "Sorry, something went wrong.",
            time: now(),
          },
        ];
      });
    }
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackInput.trim()) return;
    setChat((prev) => [
      ...prev,
      {
        from: "user",
        text: feedbackInput,
        time: now(),
      },
      {
        from: "bot",
        text: "Thank you for your feedback! 😊",
        time: now(),
      },
    ]);
    setFeedbackInput("");
    setFeedbackMode(false);
  };

  const resetChat = () => {
    setChat([]);
    setSelectedScheme(null);
    setAvailableQuestions([]);
    setFeedbackMode(false);
    setFeedbackInput("");
  };

  return (
    <div style={styles.floating}>
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            if (qaList.length > 0) {
              handleSelectScheme("e-Gold");
            }
          }}
          style={styles.openBtn}
        >
          AI
        </button>
      ) : (
        <div style={styles.widget}>
          <div style={styles.header}>
            <strong>💎 Bhima Assistant</strong>
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
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "8px 12px",
                        borderRadius: 12,
                        background: m.from === "user" ? "#0d6efd" : "#f1f3f5",
                        color: m.from === "user" ? "#fff" : "#000",
                      }}
                    >
                      {m.text}
                    </div>

                    {m.buttons && m.buttons.length > 0 && m.from === "bot" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          marginTop: 6,
                        }}
                      >
                        {m.buttons.map((q) => (
                          <button
                            key={q}
                            onClick={() => handleQuestionClick(q)}
                            className="btn btn-outline-secondary btn-sm"
                            style={{ marginBottom: 4 }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {feedbackMode && (
                  <div style={{ marginTop: 6 }}>
                    <input
                      type="text"
                      value={feedbackInput}
                      placeholder="Type your feedback..."
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
                    />
                    <button
                      onClick={handleFeedbackSubmit}
                      className="btn btn-primary btn-sm mt-1"
                      style={{ width: "100%" }}
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          <div style={styles.footer}>
            <small style={{ opacity: 0.8 }}>Bhima Assistant</small>
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
    overflow: "scroll",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  },
  header: {
    padding: "10px 12px",
    background: "#fff",
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
  },
  footer: {
    padding: 8,
    borderTop: "1px solid #e9ecef",
    textAlign: "center",
    background: "#fff",
  },
};
