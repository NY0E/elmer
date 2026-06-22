"use client";

import { useState, useRef, useEffect } from "react";

const TOPICS = [
  { id: "first_qso", label: "Making Your First QSO", description: "Calling, answering, exchange flow", icon: "📻" },
  { id: "antenna_system", label: "Your Antenna System", description: "Feedline, connectors, SWR, what it all means", icon: "📡" },
  { id: "propagation", label: "Propagation Intuition", description: "Why signals go where they go, when they go there", icon: "🌐" },
  { id: "repeaters", label: "Working Repeaters", description: "Access tones, offsets, linking, etiquette", icon: "🗼" },
  { id: "troubleshooting", label: "Troubleshooting Your Station", description: "RFI, audio problems, poor reports", icon: "🔧" },
  { id: "vhf_practical", label: "VHF/UHF in Practice", description: "Simplex range realities, APRS, weak signal", icon: "📶" },
];

const TOPIC_OPENERS: Record<string, string> = {
  first_qso: "You're sitting at your radio. You tune to 146.520 and the band sounds clear. What do you do next?",
  antenna_system: "You just finished setting up your antenna and your radio is showing an SWR of 2.5:1. Walk me through what's actually happening on that feedline right now.",
  propagation: "It's 9pm on a Tuesday. You want to make a contact. Which band do you turn to first, and why?",
  repeaters: "You key up on a local repeater and get nothing back — no courtesy tone, no response. What's your first thought?",
  troubleshooting: "You're getting a 59 signal report but the other op says your audio sounds 'processed' and harsh. What do you start looking at?",
  vhf_practical: "Your HT claims 5 watts output. You're in your house trying to hit a repeater 15 miles away and you're barely getting in. Walk me through why that might be.",
};

const BEGINNER_OPENER = "Good to have you here. Tell me about your setup — what radio do you have, and have you tried to transmit yet?";
const BEGINNER_TOPIC = { id: "beginner", label: "New Ham Orientation", description: "", icon: "🎙️" };

interface Message { role: "user" | "assistant"; content: string; }
interface Topic { id: string; label: string; description: string; icon: string; }

function VUMeter({ active }: { active: boolean }) {
  const [levels, setLevels] = useState([2, 3, 1, 4, 2, 3, 1, 2]);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setLevels(() => Array.from({ length: 8 }, () => Math.floor(Math.random() * 8) + 1));
    }, 120);
    return () => clearInterval(interval);
  }, [active]);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "20px" }}>
      {levels.map((h, i) => (
        <div key={i} style={{ width: "3px", height: `${active ? h * 2.5 : 3}px`, background: active ? h > 6 ? "#ef4444" : h > 4 ? "#f59e0b" : "#22c55e" : "#374151", transition: "height 0.1s ease", borderRadius: "1px" }} />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isElmer = msg.role === "assistant";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isElmer ? "flex-start" : "flex-end", marginBottom: "16px" }}>
      {isElmer && (
        <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#f59e0b", fontFamily: "'Share Tech Mono', monospace", marginBottom: "4px", paddingLeft: "4px" }}>
          ELMER
        </div>
      )}
      <div style={{ maxWidth: "82%", padding: "12px 16px", borderRadius: isElmer ? "2px 12px 12px 12px" : "12px 2px 12px 12px", background: isElmer ? "#1a2332" : "#1e3a2f", border: isElmer ? "1px solid #2d4a6b" : "1px solid #2d5a3f", color: isElmer ? "#c8d8e8" : "#a8d8b8", fontSize: "15px", lineHeight: "1.6", fontFamily: "'Inter', sans-serif" }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function Elmer() {
  const [screen, setScreen] = useState<"home" | "chat">("home");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [error, setError] = useState("");
  const [isBeginner, setIsBeginner] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startSession = (topic: Topic, beginner = false) => {
    setSelectedTopic(topic);
    setIsBeginner(beginner);
    const opener = beginner ? BEGINNER_OPENER : TOPIC_OPENERS[topic.id];
    setMessages([{ role: "assistant", content: opener }]);
    setError("");
    setScreen("chat");
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !selectedTopic) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);
    setTransmitting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          topicLabel: selectedTopic.label,
          openerText: isBeginner ? BEGINNER_OPENER : TOPIC_OPENERS[selectedTopic.id],
          isBeginner,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Lost the signal. Check your connection and try again.");
    } finally {
      setLoading(false);
      setTransmitting(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetHome = () => { setScreen("home"); setMessages([]); setInput(""); setError(""); setIsBeginner(false); };

  // ── HOME ────────────────────────────────────────────────────────

  if (screen === "home") {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0f14", color: "#c8d8e8", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid #1e2d3d", padding: "24px 32px", display: "flex", alignItems: "baseline", gap: "16px" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "28px", color: "#f59e0b", letterSpacing: "0.08em" }}>ELMER</div>
          <div style={{ fontSize: "12px", color: "#4a6a8a", letterSpacing: "0.15em", textTransform: "uppercase" }}>Practical Ham Radio · Socratic Tutor</div>
        </div>

        {/* Hero */}
        <div style={{ padding: "48px 32px 24px", maxWidth: "680px" }}>
          <div style={{ fontSize: "13px", color: "#f59e0b", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "0.1em", marginBottom: "12px" }}>
            // you passed the exam. now what?
          </div>
          <p style={{ fontSize: "17px", lineHeight: "1.7", color: "#8a9ab8", margin: 0 }}>
            Elmer doesn&apos;t explain things. He asks questions until you figure it out yourself.
            That&apos;s how real operational knowledge gets built — not from reading, from thinking.
          </p>
        </div>

        {/* New Ham banner */}
        <div style={{ padding: "16px 32px 8px", maxWidth: "900px" }}>
          <button
            onClick={() => startSession(BEGINNER_TOPIC, true)}
            style={{
              width: "100%",
              background: "#0f1a0f",
              border: "1px solid #2d5a2d",
              borderRadius: "6px",
              padding: "20px 24px",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#22c55e"; (e.currentTarget as HTMLButtonElement).style.background = "#111f11"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2d5a2d"; (e.currentTarget as HTMLButtonElement).style.background = "#0f1a0f"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "22px" }}>🎙️</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#22c55e", letterSpacing: "0.02em", marginBottom: "3px" }}>
                  New ham? Start here.
                </div>
                <div style={{ fontSize: "12px", color: "#4a6a4a" }}>
                  Just got your ticket and not sure where to begin. Elmer will meet you where you are.
                </div>
              </div>
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#2d5a2d", letterSpacing: "0.1em", flexShrink: 0 }}>
              START →
            </div>
          </button>
        </div>

        {/* Divider */}
        <div style={{ padding: "20px 32px 8px", maxWidth: "900px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "#1e2d3d" }} />
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "#2a3a4a", letterSpacing: "0.15em" }}>OR PICK A TOPIC</div>
            <div style={{ flex: 1, height: "1px", background: "#1e2d3d" }} />
          </div>
        </div>

        {/* Topic grid */}
        <div style={{ padding: "8px 32px 48px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", maxWidth: "900px" }}>
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => startSession(topic)}
              style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: "4px", padding: "20px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "6px", transition: "border-color 0.15s, background 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#f59e0b"; (e.currentTarget as HTMLButtonElement).style.background = "#141e2a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2d3d"; (e.currentTarget as HTMLButtonElement).style.background = "#0f1923"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>{topic.icon}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#c8d8e8", letterSpacing: "0.01em" }}>{topic.label}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#4a6a8a", paddingLeft: "30px" }}>{topic.description}</div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", padding: "16px 32px", borderTop: "1px solid #1e2d3d", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#2a3a4a", letterSpacing: "0.1em" }}>NY0E.COM</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#2a3a4a", letterSpacing: "0.1em" }}>73</span>
        </div>
      </div>
    );
  }

  // ── CHAT ────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f14", color: "#c8d8e8", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ borderBottom: "1px solid #1e2d3d", padding: "14px 24px", display: "flex", alignItems: "center", gap: "16px", background: "#0b0f14", position: "sticky", top: 0, zIndex: 10 }}>
        <button
          onClick={resetHome}
          style={{ background: "none", border: "none", color: "#4a6a8a", cursor: "pointer", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", letterSpacing: "0.08em", padding: "4px 0" }}
        >
          {isBeginner ? "← HOME" : "← TOPICS"}
        </button>
        <div style={{ width: "1px", height: "16px", background: "#1e2d3d" }} />
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "13px", color: isBeginner ? "#22c55e" : "#f59e0b", letterSpacing: "0.06em" }}>
          {isBeginner ? "🎙️ NEW HAM ORIENTATION" : `${selectedTopic?.icon} ${selectedTopic?.label.toUpperCase()}`}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <VUMeter active={transmitting || loading} />
        </div>
      </div>

      <div style={{ flex: 1, padding: "24px", overflowY: "auto", maxWidth: "720px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#f59e0b", fontFamily: "'Share Tech Mono', monospace", paddingLeft: "4px" }}>ELMER</div>
            <div style={{ background: "#1a2332", border: "1px solid #2d4a6b", borderRadius: "2px 12px 12px 12px", padding: "12px 16px", display: "flex", gap: "6px", alignItems: "center", width: "fit-content" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#2a1a1a", border: "1px solid #5a2a2a", borderRadius: "4px", padding: "10px 14px", color: "#e88", fontSize: "13px", fontFamily: "'Share Tech Mono', monospace", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: "1px solid #1e2d3d", padding: "16px 24px", background: "#0b0f14", maxWidth: "720px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "14px", color: "#f59e0b", paddingBottom: "10px", flexShrink: 0 }}>{">"}</div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Key up..."
            rows={1}
            style={{ flex: 1, background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: "4px", padding: "10px 14px", color: "#c8d8e8", fontSize: "15px", fontFamily: "'Inter', sans-serif", resize: "none", outline: "none", lineHeight: "1.5", minHeight: "42px", maxHeight: "140px", overflowY: "auto" }}
            onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 140) + "px"; }}
            onFocus={(e) => (e.target.style.borderColor = "#2d4a6b")}
            onBlur={(e) => (e.target.style.borderColor = "#1e2d3d")}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim() ? "#1a2332" : "#f59e0b", border: "none", borderRadius: "4px", padding: "10px 18px", color: loading || !input.trim() ? "#2a3a4a" : "#0b0f14", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", letterSpacing: "0.1em", cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "background 0.15s, color 0.15s", flexShrink: 0, height: "42px" }}
          >
            TX
          </button>
        </div>
        <div style={{ fontSize: "11px", color: "#2a3a4a", fontFamily: "'Share Tech Mono', monospace", marginTop: "8px", paddingLeft: "22px" }}>
          ENTER TO TRANSMIT · SHIFT+ENTER FOR NEW LINE
        </div>
      </div>
    </div>
  );
}
