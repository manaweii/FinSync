import React, { useMemo, useRef, useState, useEffect } from "react";
import { ChatBubbleLeftEllipsisIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import useAuthStore from "../../store/useAuthStore";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Hi! I am your FinSync assistant. Ask me about your imported finance data, reports, predictions, or how to use any FinSync page.",
};

export default function FinSyncChatbot() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);

  const canAsk = useMemo(() => Boolean(token && user?.orgId), [token, user?.orgId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    setMessages([INITIAL_MESSAGE]);
    setQuestion("");
    setError("");
    setOpen(false);
  }, [user?.orgId]);

  const sendQuestion = async (event) => {
    event.preventDefault();

    const text = question.trim();
    if (!text || loading) return;

    if (!canAsk) {
      setError("Login and organization context are required for chatbot answers.");
      return;
    }

    const userMessage = { role: "user", text };
    const nextMessages = [...messages, userMessage];

    setQuestion("");
    setError("");
    setMessages(nextMessages);
    setLoading(true);

    try {
      const history = nextMessages.slice(-10).map((item) => ({
        role: item.role,
        message: item.text,
      }));

      const response = await fetch(`${API_BASE}/chatbot/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: text,
          history,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Chatbot request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: payload?.answer || "I could not generate an answer right now.",
          meta: payload?.meta || null,
        },
      ]);
    } catch (requestError) {
      const message = requestError?.message || "Something went wrong while calling chatbot.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I could not answer right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-6 right-6 z-[120] w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl border border-teal-200 bg-white shadow-2xl shadow-slate-900/20">
          <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">FinSync Assistant</p>
              <p className="text-[11px] text-teal-100">Data-aware finance and product guidance</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl p-1 text-white/90 transition hover:bg-white/20"
              aria-label="Close chatbot"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="max-h-[420px] min-h-[300px] space-y-3 overflow-y-auto bg-slate-50 px-3 py-3">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    item.role === "user"
                      ? "bg-teal-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {item.text}
                  {item.meta?.source === "fallback" ? (
                    <p className="mt-2 text-[11px] text-amber-600">AI fallback mode: live model unavailable.</p>
                  ) : null}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={sendQuestion} className="border-t border-slate-200 bg-white p-3">
            {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}

            <div className="flex items-center gap-2">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about finances or how to use FinSync..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                maxLength={1200}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[110] inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-xl shadow-teal-900/30 transition hover:scale-105"
          aria-label="Open FinSync chatbot"
        >
          <ChatBubbleLeftEllipsisIcon className="h-7 w-7" />
        </button>
      ) : null}
    </>
  );
}
