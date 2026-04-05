import React, { useState } from 'react';
import './css/AIDashboard.css';

const API_BASE = (process.env.REACT_APP_AI_API_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

const AIDashboard = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setError(null);
        setResponse('');

        try {
            const res = await fetch(`${API_BASE}/generate-gemini`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate content');
            }

            setResponse(data.content);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-dashboard">
            <h2>AI Content Generator</h2>
            <p>Power your creativity with Gemini AI. Generate content for your website in seconds.</p>

            <div className="ai-input-group">
                <input
                    type="text"
                    className="ai-input"
                    placeholder="Describe what you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                    className="ai-button"
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? <span className="loading-spinner"></span> : 'Generate'}
                </button>
            </div>

            {error && (
                <div className="ai-result" style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2' }}>
                    <h3 style={{ color: '#b91c1c' }}>Error</h3>
                    <div className="ai-content" style={{ color: '#b91c1c' }}>{error}</div>
                </div>
            )}

            {response && (
                <div className="ai-result">
                    <h3>Generated Content</h3>
                    <div className="ai-content">{response}</div>
                </div>
            )}
        </div>
    );
};

export default AIDashboard;
