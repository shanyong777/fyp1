import React from "react";
import { useNavigate } from "react-router-dom";
import { TEMPLATE_CATALOG } from "./templateData";

function TemplateSelector({ onSelectTemplate, onClose, title }) {
  const navigate = useNavigate();

  const handleSelect = (templateId) => {
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
      return;
    }
    navigate("/editor/workspace", { state: { templateId } });
  };

  return (
    <div
      style={{
        padding: "28px",
        width: "100%",
        maxWidth: 1120,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            {title || "Choose a template"}
          </div>
          <div style={{ color: "var(--text-muted)", marginTop: 6 }}>
            Start fast with a layout, then customize like Canva.
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(15,23,42,0.12)",
              color: "var(--text-main)",
              boxShadow: "none",
              transform: "none",
            }}
          >
            Close
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {TEMPLATE_CATALOG.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelect(t.id)}
            style={{
              textAlign: "left",
              padding: 0,
              borderRadius: 12,
              border: "1px solid rgba(15,23,42,0.10)",
              background: "rgba(255,255,255,0.9)",
              overflow: "hidden",
              boxShadow: "none",
              transform: "none",
              transition: "box-shadow 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 12px 28px rgba(15, 23, 42, 0.12)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "none";
            }}
          >
            <div
              style={{
                height: 150,
                backgroundImage: `url(${t.thumbnail})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div style={{ padding: 14 }}>
              <div
                style={{
                  fontWeight: 900,
                  color: "var(--text-main)",
                  marginBottom: 6,
                  letterSpacing: "-0.01em",
                }}
              >
                {t.title}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {t.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TemplateSelector;

