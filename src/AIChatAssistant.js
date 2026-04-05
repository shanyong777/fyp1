import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './css/AIChatAssistant.css';

const API_BASE = (process.env.REACT_APP_AI_API_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

const AIChatAssistant = ({
    currentComponents,
    activeComponent,
    onAddComponent,
    onUpdateComponent,
    onUpdateComponentContent,
    onRemoveComponent,
    onUpdateGlobalStyle,
    globalStyles
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [messages, setMessages] = useState([
        { id: 1, role: 'ai', text: 'Hi! I can help you build your website. Try asking "Add a hero section" or "Change the title color to blue".' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [aiServerOnline, setAiServerOnline] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const tryLocalCommand = (text) => {
        const raw = String(text || "").trim();
        const lower = raw.toLowerCase();

        const colorMap = {
            blue: "#3b82f6",
            red: "#ef4444",
            green: "#10b981",
            purple: "#8b5cf6",
            pink: "#ec4899",
            black: "#000000",
            white: "#ffffff",
            gray: "#64748b",
            grey: "#64748b",
        };

        const hexMatch = raw.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
        const namedColorMatch = Object.keys(colorMap).find((c) =>
            lower.includes(c),
        );
        const resolvedColor = hexMatch ? hexMatch[0] : namedColorMatch ? colorMap[namedColorMatch] : null;

        const addMatch = lower.match(
            /\badd\b.*\b(hero|features|about|contact|gallery|testimonials|heading|text|image|button|cart|icon)\b/,
        );
        if (addMatch) {
            return {
                action: "add_component",
                type: addMatch[1],
                reason: `Added ${addMatch[1]}.`,
            };
        }

        if (/\b(remove|delete)\b/.test(lower)) {
            return {
                action: "remove_component",
                targetId: "active",
                reason: "Removed the selected component.",
            };
        }

        if (resolvedColor && /\b(background|page background|canvas background)\b/.test(lower)) {
            return {
                action: "update_global_style",
                updates: { backgroundColor: resolvedColor },
                reason: "Updated the page background color.",
            };
        }

        if (resolvedColor && /\b(text|title|heading)\b/.test(lower) && /\bcolor\b/.test(lower)) {
            return {
                action: "update_component",
                targetId: "active",
                updates: { color: resolvedColor },
                reason: "Updated the selected text color.",
            };
        }

        return null;
    };

    useEffect(() => {
        let cancelled = false;
        async function checkHealth() {
            try {
                const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 5000);
                if (cancelled) return;
                setAiServerOnline(res.ok);
            } catch (e) {
                if (cancelled) return;
                setAiServerOnline(false);
            }
        }
        checkHealth();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            if (aiServerOnline === false) {
                const local = tryLocalCommand(userMessage.text);
                if (local) {
                    processAICommand(local);
                    return;
                }
                throw new Error("AI server is offline. Start the backend and try again.");
            }

            const res = await fetchWithTimeout(`${API_BASE}/generate-editor-action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: userMessage.text,
                    currentComponents: currentComponents,
                    activeComponentId: activeComponent?.id,
                    globalStyles: globalStyles
                }),
            }, 30000);

            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const msg =
                    data?.error ||
                    data?.message ||
                    `Request failed (${res.status} ${res.statusText})`;
                const err = new Error(msg);
                err.status = res.status;
                err.details = data?.details;
                throw err;
            }

            // Process the AI command
            processAICommand(data);

        } catch (error) {
            console.error(error);
            if (aiServerOnline === null) {
                setAiServerOnline(false);
            }

            const local = tryLocalCommand(userMessage.text);
            if (local) {
                processAICommand(local);
                return;
            }

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                text:
                    error?.name === "AbortError"
                        ? "AI request timed out. Is the backend running?"
                        : error?.status === 500
                            ? `AI server error: ${error.message}`
                            : (error?.message || 'Sorry, I encountered an error processing your request.')
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const processAICommand = (command) => {
        let responseText = '';

        switch (command.action) {
            case 'add_component':
                if (onAddComponent) {
                    onAddComponent(command.type);
                    responseText = command.reason || `Added a ${command.type} section.`;
                } else {
                    responseText = "I tried to add a component, but the editor implementation is missing.";
                }
                break;

            case 'update_component':
                const targetId = command.targetId === 'active' ? activeComponent?.id : command.targetId;

                if (!targetId) {
                    responseText = "I couldn't find the component you wanted to update. Please select it first.";
                    break;
                }

                if (command.updates) {
                    // Split updates between structural properties (width, height, x, y) and content properties
                    const structuralProps = ['width', 'height', 'x', 'y', 'zIndex'];
                    const contentUpdates = {};

                    Object.entries(command.updates).forEach(([key, value]) => {
                        if (structuralProps.includes(key)) {
                            // Handle nested position/size if needed, but for now assuming flat updates from AI need mapping
                            // actually AI might return flat updates, need to map to correct object structure if complex
                            // For simplicity let's assume content updates mainly
                        } else {
                            contentUpdates[key] = value;
                        }
                    });

                    if (Object.keys(contentUpdates).length > 0 && onUpdateComponentContent) {
                        onUpdateComponentContent(targetId, contentUpdates);
                    }
                    // Implement structural updates if needed

                    responseText = command.reason || "Updated the component.";
                }
                break;

            case 'update_global_style':
                if (onUpdateGlobalStyle && command.updates) {
                    onUpdateGlobalStyle(command.updates);
                    responseText = command.reason || "Updated global styles.";
                } else {
                    responseText = "I couldn't update the global styles.";
                }
                break;

            case 'remove_component':
                const idToRemove = command.targetId === 'active' ? activeComponent?.id : command.targetId;
                if (idToRemove && onRemoveComponent) {
                    onRemoveComponent(idToRemove);
                    responseText = command.reason || "Removed the component.";
                } else {
                    responseText = "I couldn't find the component to remove.";
                }
                break;

            case 'chat':
            default:
                responseText = command.message || "I'm not sure how to do that yet.";
                break;
        }

        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            role: 'ai',
            text: responseText
        }]);
    };

    return (
        <div className={`ai-chat-assistant ${isOpen ? '' : 'minimized'}`}>
            <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
                <h3><FontAwesomeIcon icon="robot" /> AI Assistant</h3>
                <div className="chat-controls">
                    <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
                        <FontAwesomeIcon icon={isOpen ? "chevron-down" : "chevron-up"} />
                    </button>
                </div>
            </div>

            {isOpen && (
                <>
                    <div className="chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message ai typing-indicator">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Ask me to change something..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            className="send-btn"
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                        >
                            <FontAwesomeIcon icon="paper-plane" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AIChatAssistant;
