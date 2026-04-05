import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";

library.add(fas, fab, far);

const resolveFontFamily = (fontFamily) => {
  const v = String(fontFamily || "").trim();
  if (!v || v === "system") return "inherit";
  return v;
};

function PublishedPage() {
  const { designId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [components, setComponents] = useState([]);
  const [globalStyles, setGlobalStyles] = useState({
    backgroundColor: "#ffffff",
    fontFamily: "system",
  });

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      if (!designId) {
        setError("Missing designId");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const ref = doc(db, "designs", designId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (!isCancelled) {
            setError("This site does not exist or is no longer available.");
            setLoading(false);
          }
          return;
        }

        const data = snap.data() || {};
        if (!isCancelled) {
          setComponents(Array.isArray(data.components) ? data.components : []);
          setGlobalStyles(
            data.globalStyles && typeof data.globalStyles === "object"
              ? { backgroundColor: "#ffffff", fontFamily: "system", ...data.globalStyles }
              : { backgroundColor: "#ffffff", fontFamily: "system" },
          );
          setLoading(false);
        }
      } catch (e) {
        if (!isCancelled) {
          setError(e?.message || "Failed to load site.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, [designId]);

  const canvasHeight = useMemo(() => {
    const maxBottom = Math.max(
      720,
      ...components.map((c) => {
        const y = c?.position?.y || 0;
        const h = c?.size?.height || 0;
        return y + h;
      }),
    );
    return maxBottom + 80;
  }, [components]);

  const [scale, setScale] = useState(1);
  const BASE_WIDTH = 1200;

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth || BASE_WIDTH;
      const next = Math.min(1, w / BASE_WIDTH);
      setScale(next);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const renderComponent = (component) => {
    const { type, content = {} } = component || {};
    const w = component?.size?.width || 0;
    const h = component?.size?.height || 0;

    if (type === "heading") {
      return (
        <h1
          style={{
            width: "100%",
            height: "100%",
            margin: 0,
            display: "flex",
            alignItems: "center",
            justifyContent:
              content.textAlign === "left"
                ? "flex-start"
                : content.textAlign === "right"
                  ? "flex-end"
                  : "center",
            textAlign: content.textAlign || "center",
            fontSize: content.fontSize ? `${content.fontSize}px` : "32px",
            fontFamily: resolveFontFamily(content.fontFamily) || "inherit",
            fontWeight: content.fontWeight || "normal",
            fontStyle: content.fontStyle || "normal",
            textDecoration: content.textDecoration || "none",
            color: content.color || undefined,
            background: content.background || undefined,
            backgroundColor: content.backgroundColor || undefined,
            borderRadius:
              typeof content.borderRadius === "number"
                ? `${content.borderRadius}px`
                : content.borderRadius || undefined,
            boxShadow: content.boxShadow || undefined,
            padding: content.padding || "10px",
            letterSpacing: content.letterSpacing || undefined,
            lineHeight: content.lineHeight || undefined,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
          }}
        >
          {content.text}
        </h1>
      );
    }

    if (type === "text") {
      return (
        <p
          style={{
            width: "100%",
            height: "100%",
            margin: 0,
            display: "flex",
            alignItems: "center",
            justifyContent:
              content.textAlign === "left"
                ? "flex-start"
                : content.textAlign === "right"
                  ? "flex-end"
                  : "center",
            textAlign: content.textAlign || "center",
            fontSize: content.fontSize ? `${content.fontSize}px` : "18px",
            fontFamily: resolveFontFamily(content.fontFamily) || "inherit",
            fontWeight: content.fontWeight || "normal",
            fontStyle: content.fontStyle || "normal",
            textDecoration: content.textDecoration || "none",
            color: content.color || undefined,
            background: content.background || undefined,
            backgroundColor: content.backgroundColor || undefined,
            borderRadius:
              typeof content.borderRadius === "number"
                ? `${content.borderRadius}px`
                : content.borderRadius || undefined,
            boxShadow: content.boxShadow || undefined,
            padding: content.padding || "10px",
            letterSpacing: content.letterSpacing || undefined,
            lineHeight: content.lineHeight || undefined,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
          }}
        >
          {content.text}
        </p>
      );
    }

    if (type === "image") {
      return (
        <img
          src={content.url}
          alt={content.alt || "image"}
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius:
              typeof content.borderRadius === "number"
                ? `${content.borderRadius}px`
                : content.borderRadius || undefined,
            boxShadow: content.boxShadow || undefined,
            display: "block",
          }}
        />
      );
    }

    if (type === "button") {
      return (
        <button
          type="button"
          style={{
            width: "100%",
            height: "100%",
            margin: 0,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            fontFamily: resolveFontFamily(content.fontFamily) || "inherit",
            fontSize: content.fontSize ? `${content.fontSize}px` : undefined,
            color: content.color || undefined,
            background: content.background || undefined,
            backgroundColor: content.backgroundColor || undefined,
            borderRadius:
              typeof content.borderRadius === "number"
                ? `${content.borderRadius}px`
                : "4px",
            boxShadow: content.boxShadow || undefined,
          }}
          onClick={() => {
            if (content.link) window.location.href = content.link;
          }}
        >
          {content.iconName && <FontAwesomeIcon icon={content.iconName} />}
          {content.label}
        </button>
      );
    }

    if (type === "cart") {
      const dynamicSize = Math.min(w || 0, h || 0) || 32;
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <span style={{ fontSize: `${dynamicSize}px`, color: content.color }}>
            🛒
          </span>
          <span
            style={{
              position: "absolute",
              top: "10%",
              right: "10%",
              background: "#dc3545",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            0
          </span>
        </div>
      );
    }

    if (type === "icon") {
      const dynamicSize = Math.min(w || 0, h || 0) || 32;
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {content.iconUrl ? (
            <img
              src={content.iconUrl}
              alt="icon"
              loading="lazy"
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <FontAwesomeIcon
              icon={content.icon || content.iconName || "star"}
              style={{ fontSize: `${dynamicSize}px`, color: content.color }}
            />
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: globalStyles.backgroundColor || "#ffffff",
          color: "var(--text-main)",
          fontFamily: resolveFontFamily(globalStyles.fontFamily),
        }}
      >
        Loading site…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: globalStyles.backgroundColor || "#ffffff",
          color: "var(--text-main)",
          fontFamily: resolveFontFamily(globalStyles.fontFamily),
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: globalStyles.backgroundColor,
        fontFamily: resolveFontFamily(globalStyles.fontFamily),
        ...globalStyles,
      }}
    >
      <div style={{ width: "100%", overflowX: "hidden", minHeight: canvasHeight * scale }}>
        <div
          style={{
            position: "relative",
            width: BASE_WIDTH,
            minHeight: canvasHeight,
            margin: "0 auto",
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          {components.map((comp) => (
            <div
              key={comp.id}
              style={{
                position: "absolute",
                left: comp?.position?.x || 0,
                top: comp?.position?.y || 0,
                width: comp?.size?.width || 0,
                height: comp?.size?.height || 0,
                zIndex: comp?.zIndex || 1,
              }}
            >
              {renderComponent(comp)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PublishedPage;
