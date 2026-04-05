import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Rnd } from "react-rnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import "./css/EditorPage.css";
import { useDesignOptions } from "./designOptions";
import { useAuth } from "./AuthContext";
import AIChatAssistant from "./AIChatAssistant";
import AddElementsPanel from "./AddElementsPanel";
import TemplateSelector from "./TemplateSelector";
import { getTemplateById, getTemplateComponents } from "./templateData";
import { uploadImageAndSaveMetadata } from "./storageHelpers";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import { db } from "./firebase";
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { storage } from "./firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
const API_BASE = (process.env.REACT_APP_AI_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

// Load Google Fonts
const link = document.createElement("link");
link.rel = "stylesheet";
link.href =
  "https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700&display=swap";
document.head.appendChild(link);

// Add all icons to the library so we can use them by name
library.add(fas, fab, far);

const COMPONENT_TYPES = {
  // Sections
  HERO: "hero",
  FEATURES: "features",
  ABOUT: "about",
  CONTACT: "contact",
  GALLERY: "gallery",
  TESTIMONIALS: "testimonials",
  // Elements
  HEADING: "heading",
  TEXT: "text",
  IMAGE: "image",
  BUTTON: "button",
  CART: "cart",
  ICON: "icon",
};

const TEMPLATE_DATA = {
  portfolio: [
    {
      id: "hero-h1",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 80, y: 120 },
      size: { width: 520, height: 140 },
      zIndex: 1,
      content: {
        text: "Hi, I'm Tham.",
        fontSize: 88,
        fontWeight: 800,
        fontFamily: "system",
        color: "#111827",
        textAlign: "left",
      },
    },
    {
      id: "hero-subtitle",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 80, y: 270 },
      size: { width: 520, height: 70 },
      zIndex: 1,
      content: {
        text: "Creative Designer & Developer",
        fontSize: 22,
        fontFamily: "system",
        color: "#334155",
        textAlign: "left",
      },
    },
    {
      id: "hero-cta",
      type: COMPONENT_TYPES.BUTTON,
      position: { x: 80, y: 360 },
      size: { width: 200, height: 54 },
      zIndex: 1,
      content: {
        label: "View My Work",
        fontSize: 16,
        fontFamily: "system",
        color: "#ffffff",
        backgroundColor: "#2563eb",
        borderRadius: 12,
      },
    },
    {
      id: "hero-image",
      type: COMPONENT_TYPES.IMAGE,
      position: { x: 660, y: 120 },
      size: { width: 460, height: 420 },
      zIndex: 1,
      content: {
        url: "https://images.unsplash.com/photo-1520975958225-5d14f6db0e2f?w=900&fit=crop",
        alt: "Hero Portrait",
      },
    },
    {
      id: "c1",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 80, y: 620 },
      size: { width: 1040, height: 90 },
      zIndex: 1,
      content: {
        text: "Get In Touch",
        fontSize: 44,
        fontWeight: 800,
        fontFamily: "system",
        color: "#111827",
        textAlign: "left",
      },
    },
    {
      id: "c2",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 80, y: 700 },
      size: { width: 1040, height: 50 },
      zIndex: 1,
      content: {
        text: "hello@example.com",
        fontSize: 18,
        fontFamily: "system",
        color: "#2563eb",
        textAlign: "left",
      },
    },
  ],
  business: [
    {
      id: "h1",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 100, y: 100 },
      size: { width: 600, height: 120 },
      zIndex: 1,
      content: {
        text: "Business Solutions",
        fontSize: 56,
        fontWeight: "bold",
        color: "#ffffff",
      },
    },
    {
      id: "h2",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 100, y: 240 },
      size: { width: 600, height: 80 },
      zIndex: 1,
      content: {
        text: "Scaling your ideas to reality with modern strategy",
        fontSize: 22,
        color: "#cccccc",
      },
    },
    {
      id: "b1",
      type: COMPONENT_TYPES.BUTTON,
      position: { x: 100, y: 350 },
      size: { width: 200, height: 60 },
      zIndex: 1,
      content: {
        label: "Get Started",
        fontSize: 18,
        color: "#ffffff",
        backgroundColor: "#3498db",
      },
    },
    {
      id: "i1",
      type: COMPONENT_TYPES.IMAGE,
      position: { x: 750, y: 100 },
      size: { width: 400, height: 400 },
      zIndex: 1,
      content: {
        url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
        alt: "Business Stats",
      },
    },
  ],
  blog: [
    {
      id: "h1",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 50, y: 50 },
      size: { width: 800, height: 100 },
      zIndex: 1,
      content: {
        text: "The Modern Blog",
        fontSize: 72,
        fontWeight: "bold",
        color: "#ffffff",
      },
    },
    {
      id: "h2",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 50, y: 170 },
      size: { width: 800, height: 50 },
      zIndex: 1,
      content: {
        text: "Insights on Tech and Life",
        fontSize: 28,
        color: "#cccccc",
        fontStyle: "italic",
      },
    },
    {
      id: "p1",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 50, y: 300 },
      size: { width: 500, height: 60 },
      zIndex: 1,
      content: {
        text: "React Hooks Deep Dive",
        fontSize: 32,
        fontWeight: "bold",
        color: "#ffffff",
      },
    },
    {
      id: "p2",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 50, y: 370 },
      size: { width: 500, height: 150 },
      zIndex: 1,
      content: {
        text: "Learn how to use useEffect and useMemo effectively in your projects...",
        fontSize: 18,
        color: "#dddddd",
      },
    },
  ],
  restaurant: [
    {
      id: "r1",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 50, y: 50 },
      size: { width: 800, height: 100 },
      zIndex: 1,
      content: {
        text: "La Bella Cucina",
        fontSize: 72,
        fontWeight: "bold",
        fontFamily: "Crimson Pro",
        color: "#ffffff",
      },
    },
    {
      id: "r2",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 50, y: 160 },
      size: { width: 800, height: 60 },
      zIndex: 1,
      content: {
        text: "Authentic Italian Flavors in the Heart of the City",
        fontSize: 24,
        fontStyle: "italic",
        color: "#cccccc",
      },
    },
    {
      id: "rim1",
      type: COMPONENT_TYPES.IMAGE,
      position: { x: 50, y: 240 },
      size: { width: 800, height: 400 },
      zIndex: 1,
      content: {
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        alt: "Restaurant Interior",
      },
    },
    {
      id: "r3",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 50, y: 680 },
      size: { width: 800, height: 60 },
      zIndex: 1,
      content: {
        text: "Our Specialties",
        fontSize: 48,
        fontWeight: "bold",
        color: "#ffffff",
      },
    },
    {
      id: "r4",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 50, y: 750 },
      size: { width: 350, height: 100 },
      zIndex: 1,
      content: {
        text: "Handmade Pasta - $24\nFresh truffles, parmesan, and herbs.",
        fontSize: 18,
        color: "#dddddd",
      },
    },
    {
      id: "r5",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 450, y: 750 },
      size: { width: 350, height: 100 },
      zIndex: 1,
      content: {
        text: "Wood-Fired Pizza - $20\nSan Marzano tomatoes, mozzarella di bufala.",
        fontSize: 18,
        color: "#dddddd",
      },
    },
    {
      id: "rbtn",
      type: COMPONENT_TYPES.BUTTON,
      position: { x: 300, y: 900 },
      size: { width: 250, height: 60 },
      zIndex: 1,
      content: {
        label: "Book a Table",
        fontSize: 20,
        color: "#ffffff",
        backgroundColor: "#e67e22",
        iconName: "calendar-check",
      },
    },
  ],
  photography: [
    {
      id: "ph1",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 50, y: 50 },
      size: { width: 800, height: 80 },
      zIndex: 1,
      content: {
        text: "LUNA STUDIO",
        fontSize: 64,
        fontWeight: "300",
        fontFamily: "sans",
        letterSpacing: "5px",
        color: "#ffffff",
      },
    },
    {
      id: "ph2",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 50, y: 140 },
      size: { width: 800, height: 40 },
      zIndex: 1,
      content: {
        text: "Capturing moments that last forever.",
        fontSize: 18,
        color: "#aaaaaa",
        textAlign: "center",
      },
    },
    {
      id: "phim1",
      type: COMPONENT_TYPES.IMAGE,
      position: { x: 50, y: 220 },
      size: { width: 380, height: 500 },
      zIndex: 1,
      content: {
        url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=500",
        alt: "Portrait",
      },
    },
    {
      id: "phim2",
      type: COMPONENT_TYPES.IMAGE,
      position: { x: 450, y: 220 },
      size: { width: 380, height: 500 },
      zIndex: 1,
      content: {
        url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500",
        alt: "Nature",
      },
    },
    {
      id: "phbtn",
      type: COMPONENT_TYPES.BUTTON,
      position: { x: 350, y: 760 },
      size: { width: 200, height: 50 },
      zIndex: 1,
      content: {
        label: "View Gallery",
        fontSize: 16,
        color: "#000000",
        backgroundColor: "#ffffff",
      },
    },
  ],
  agency: [
    {
      id: "ag1",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 50, y: 100 },
      size: { width: 500, height: 120 },
      zIndex: 1,
      content: {
        text: "We Build Digital Experiences",
        fontSize: 56,
        fontWeight: "bold",
        lineHeight: "1.2",
        color: "#ffffff",
      },
    },
    {
      id: "ag2",
      type: COMPONENT_TYPES.TEXT,
      position: { x: 50, y: 240 },
      size: { width: 400, height: 80 },
      zIndex: 1,
      content: {
        text: "Creative agency focused on branding, web design, and digital strategy.",
        fontSize: 20,
        color: "#cccccc",
      },
    },
    {
      id: "agbtn",
      type: COMPONENT_TYPES.BUTTON,
      position: { x: 50, y: 340 },
      size: { width: 180, height: 50 },
      zIndex: 1,
      content: {
        label: "Our Work",
        fontSize: 18,
        color: "#ffffff",
        backgroundColor: "#3498db",
      },
    },
    {
      id: "agim1",
      type: COMPONENT_TYPES.IMAGE,
      position: { x: 500, y: 100 },
      size: { width: 450, height: 400 },
      zIndex: 1,
      content: {
        url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600",
        alt: "Office Team",
      },
    },
    {
      id: "ag3",
      type: COMPONENT_TYPES.HEADING,
      position: { x: 50, y: 550 },
      size: { width: 900, height: 60 },
      zIndex: 1,
      content: {
        text: "Trusted by top brands worldwide",
        fontSize: 24,
        color: "#888888",
        textAlign: "center",
      },
    },
  ],
};

const ItemType = {
  COMPONENT: "component",
};

// Font customization options for text-based elements
const FONT_FAMILY_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "serif", label: "Serif" },
  { value: "sans", label: "Sans Serif" },
  { value: "mono", label: "Monospace" },
];

const FONT_FAMILY_MAP = {
  system:
    '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
  mono: '"SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

const resolveFontFamily = (key) => {
  if (!key) return undefined;
  return FONT_FAMILY_MAP[key] || key;
};

const isTextElementType = (type) =>
  type === COMPONENT_TYPES.HEADING || type === COMPONENT_TYPES.TEXT;

function DraggableComponent({
  comp,
  updateComponent,
  activeComponent,
  setActiveComponent,
  removeComponent,
  updateComponentContent,
  customFonts,
  onCrop,
  scale = 1,
}) {
  const isActive = activeComponent?.id === comp.id;
  const [isEditing, setIsEditing] = useState(false);

  // Exit editing mode when component is no longer active
  useEffect(() => {
    if (!isActive) setIsEditing(false);
  }, [isActive]);

  return (
    <Rnd
      scale={scale}
      size={{
        width: comp.size?.width || "auto",
        height: comp.size?.height || "auto",
      }}
      lockAspectRatio={
        comp.type === COMPONENT_TYPES.IMAGE ||
        comp.type === COMPONENT_TYPES.ICON ||
        comp.type === COMPONENT_TYPES.CART
      }
      position={{ x: comp.position?.x || 0, y: comp.position?.y || 0 }}
      onDragStop={(e, d) => {
        updateComponent(comp.id, { position: { x: d.x, y: d.y } }, { recordHistory: true });
      }}
      onResize={(e, direction, ref, delta, position) => {
        const newWidth = ref.offsetWidth;
        const newHeight = ref.offsetHeight;
        const updates = {
          size: { width: newWidth, height: newHeight },
          position: { ...position },
        };

        // Live update for text-like components so font scales while resizing
        if (
          [
            COMPONENT_TYPES.HEADING,
            COMPONENT_TYPES.TEXT,
            COMPONENT_TYPES.BUTTON,
          ].includes(comp.type)
        ) {
          const originalWidth =
            comp.size && comp.size.width ? comp.size.width : newWidth;
          const originalFont =
            comp.content && comp.content.fontSize
              ? comp.content.fontSize
              : comp.type === COMPONENT_TYPES.HEADING
                ? 32
                : comp.type === COMPONENT_TYPES.TEXT
                  ? 18
                  : 16;
          const widthScale = originalWidth > 0 ? newWidth / originalWidth : 1;
          const computedFont = Math.max(
            8,
            Math.round(originalFont * widthScale),
          );
          updates.content = { ...comp.content, fontSize: computedFont };
        }

        updateComponent(comp.id, updates, { recordHistory: false });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newWidth = ref.offsetWidth;
        const newHeight = ref.offsetHeight;

        // Update component size/position
        updateComponent(comp.id, {
          size: { width: newWidth, height: newHeight },
          position: { ...position },
        }, { recordHistory: true });

        // Dynamically adjust font-size or icon size based on resize for text-like components
        try {
          const contentUpdates = {};

          if (
            [
              COMPONENT_TYPES.HEADING,
              COMPONENT_TYPES.TEXT,
              COMPONENT_TYPES.BUTTON,
            ].includes(comp.type)
          ) {
            const originalWidth =
              comp.size && comp.size.width ? comp.size.width : newWidth;
            const originalFont =
              comp.content && comp.content.fontSize
                ? comp.content.fontSize
                : comp.type === COMPONENT_TYPES.HEADING
                  ? 32
                  : comp.type === COMPONENT_TYPES.TEXT
                    ? 18
                    : 16;
            const widthScale = originalWidth > 0 ? newWidth / originalWidth : 1;
            const computedFont = Math.max(
              8,
              Math.round(originalFont * widthScale),
            );
            contentUpdates.fontSize = computedFont;
          }

          if (Object.keys(contentUpdates).length > 0) {
            updateComponentContent(comp.id, contentUpdates, { recordHistory: false });
          }
        } catch (err) {
          console.warn("Error computing scaled content during resize", err);
        }
      }}
      bounds="parent"
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
      }}
      className={`component-wrapper ${isActive ? "active" : ""} ${isEditing ? "editing" : ""} type-${comp.type}`}
      style={{
        zIndex: isActive ? 1000 : comp.zIndex || 1,
        position: "absolute",
      }}
      onClick={(e) => {
        e.stopPropagation();
        setActiveComponent(comp);
      }}
      onDoubleClick={(e) => {
        if (
          comp.type === COMPONENT_TYPES.HEADING ||
          comp.type === COMPONENT_TYPES.TEXT ||
          comp.type === COMPONENT_TYPES.BUTTON
        ) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      minWidth={50}
      minHeight={30}
      dragHandleClassName="drag-handle"
      disableDragging={isEditing}
      cancel=".floating-toolbar, .floating-toolbar *"
    >
      {isActive && isTextElementType(comp.type) && (
        <FloatingToolbar
          comp={comp}
          updateComponent={updateComponent}
          removeComponent={removeComponent}
          updateComponentContent={updateComponentContent}
          customFonts={customFonts || []}
          onCrop={onCrop}
        />
      )}
      <div className="component-controls">
        <button
          className="delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            removeComponent(comp.id);
          }}
        >
          ×
        </button>
      </div>
      <div
        className={`drag-handle ${isEditing ? "disabled" : ""}`}
        style={{
          width: "100%",
          height: "100%",
          cursor: isEditing ? "text" : "grab",
        }}
      >
        <RenderComponent
          component={comp}
          updateContent={(newContent) =>
            updateComponentContent(comp.id, newContent)
          }
          isEditing={isEditing}
          onBlur={() => setIsEditing(false)}
        />
      </div>
    </Rnd>
  );
}

function FloatingToolbar({
  comp,
  updateComponent,
  removeComponent,
  updateComponentContent,
  customFonts,
  onCrop,
}) {
  const defaultFonts = [
    "Crimson Pro",
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
  ];
  const fonts =
    customFonts && customFonts.length > 0
      ? [...defaultFonts, ...customFonts.map((f) => f.name)]
      : defaultFonts;

  // Calculate if we should flip the toolbar to the bottom
  // If the component is near the top of the canvas (y < 80), flip it down
  const isNearTop = comp.position && comp.position.y < 80;

  return (
    <div
      className={`floating-toolbar ${isNearTop ? "bottom" : ""}`}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onDragStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="toolbar-group">
        <select
          value={comp.content.fontFamily || "Crimson Pro"}
          onChange={(e) =>
            updateComponentContent(comp.id, { fontFamily: e.target.value })
          }
          onMouseDown={(e) => e.stopPropagation()}
          className="toolbar-select"
        >
          {fonts.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          title="Bring Forward (move this layer above others)"
          onClick={(e) => {
            e.stopPropagation();
            updateComponent(comp.id, {
              zIndex: (comp.zIndex || 1) + 1,
            });
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FontAwesomeIcon icon="arrow-up" />
        </button>
        <button
          className="toolbar-btn"
          title="Send Backward (move this layer behind others)"
          onClick={(e) => {
            e.stopPropagation();
            updateComponent(comp.id, {
              zIndex: Math.max(1, (comp.zIndex || 1) - 1),
            });
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FontAwesomeIcon icon="arrow-down" />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${comp.content.textAlign === "left" ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            updateComponentContent(comp.id, { textAlign: "left" });
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FontAwesomeIcon icon="align-left" />
        </button>
        <button
          className={`toolbar-btn ${comp.content.textAlign === "center" || !comp.content.textAlign ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            updateComponentContent(comp.id, { textAlign: "center" });
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FontAwesomeIcon icon="align-center" />
        </button>
        <button
          className={`toolbar-btn ${comp.content.textAlign === "right" ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            updateComponentContent(comp.id, { textAlign: "right" });
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FontAwesomeIcon icon="align-right" />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateComponentContent(comp.id, {
              fontSize: Math.max(1, (comp.content.fontSize || 16) - 1),
            });
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="toolbar-btn"
        >
          -
        </button>
        <input
          type="number"
          value={comp.content.fontSize || 16}
          onChange={(e) =>
            updateComponentContent(comp.id, {
              fontSize: parseInt(e.target.value) || 16,
            })
          }
          onMouseDown={(e) => e.stopPropagation()}
          className="toolbar-input"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateComponentContent(comp.id, {
              fontSize: (comp.content.fontSize || 16) + 1,
            });
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="toolbar-btn"
        >
          +
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <input
          type="color"
          value={comp.content.color || "#ffffff"}
          onChange={(e) =>
            updateComponentContent(comp.id, { color: e.target.value })
          }
          onMouseDown={(e) => e.stopPropagation()}
          className="toolbar-color-picker"
        />
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${comp.content.fontWeight === "bold" ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            updateComponentContent(comp.id, {
              fontWeight:
                comp.content.fontWeight === "bold" ? "normal" : "bold",
            });
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <b>B</b>
        </button>
        <button
          className={`toolbar-btn ${comp.content.fontStyle === "italic" ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            updateComponentContent(comp.id, {
              fontStyle:
                comp.content.fontStyle === "italic" ? "normal" : "italic",
            });
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <i>I</i>
        </button>
        <button
          className={`toolbar-btn ${comp.content.textDecoration === "underline" ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            updateComponentContent(comp.id, {
              textDecoration:
                comp.content.textDecoration === "underline"
                  ? "none"
                  : "underline",
            });
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <u>U</u>
        </button>
      </div>

      {/* Crop for Image component */}
      {comp.type === "image" && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <button
              className="toolbar-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onCrop) onCrop(comp);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Crop Image"
            >
              <FontAwesomeIcon icon="crop-alt" />
            </button>
            <button
              className="toolbar-btn"
              onClick={(e) => {
                e.stopPropagation();
                const nextUrl = window.prompt("Enter new image URL:");
                const trimmed = (nextUrl || "").trim();
                if (!trimmed) return;
                updateComponentContent(comp.id, { url: trimmed });
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Replace Image"
            >
              <FontAwesomeIcon icon="image" />
            </button>
          </div>
        </>
      )}

      {/* Icon support for Button component */}
      {comp.type === "button" && (
        <>
          <div className="toolbar-divider" />
          <div className="toolbar-group">
            <input
              type="text"
              placeholder="Icon"
              title="FontAwesome Icon Name (e.g. check, star, arrow-right)"
              value={comp.content.iconName || ""}
              onChange={(e) =>
                updateComponentContent(comp.id, { iconName: e.target.value })
              }
              className="toolbar-input"
              style={{ width: "60px", textAlign: "left" }}
            />
          </div>
        </>
      )}

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn delete"
          onClick={() => removeComponent(comp.id)}
        >
          <FontAwesomeIcon icon="trash" />
        </button>
      </div>
    </div>
  );
}

function ElementIcon({ type }) {
  switch (type) {
    case "heading":
      return <span className="icon">H</span>;
    case "text":
      return <span className="icon">T</span>;
    case "image":
      return <span className="icon">🖼️</span>;
    case "button":
      return <span className="icon">🔘</span>;
    case "cart":
      return <span className="icon">🛒</span>;
    case "icon":
      return <span className="icon">★</span>;
    default:
      return null;
  }
}

function RenderComponent({ component, updateContent, isEditing, onBlur }) {
  const { type, content } = component;

  const handleBlur = (e, field) => {
    updateContent({ [field]: e.target.innerText });
    if (onBlur) onBlur();
  };

  switch (type) {
    case COMPONENT_TYPES.HEADING:
      return (
        <h2
          className="comp-heading"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur(e, "text")}
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
            fontFamily:
              resolveFontFamily(content.fontFamily) || "'Crimson Pro', serif",
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
            pointerEvents: isEditing ? "auto" : "none",
          }}
        >
          {content.text}
        </h2>
      );
    case COMPONENT_TYPES.TEXT:
      return (
        <p
          className="comp-text"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur(e, "text")}
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
            fontFamily:
              resolveFontFamily(content.fontFamily) || "'Crimson Pro', serif",
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
            pointerEvents: isEditing ? "auto" : "none",
          }}
        >
          {content.text}
        </p>
      );
    case COMPONENT_TYPES.IMAGE:
      return (
        <img
          className="comp-image"
          src={content.url}
          alt={content.alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius:
              typeof content.borderRadius === "number"
                ? `${content.borderRadius}px`
                : content.borderRadius || undefined,
            boxShadow: content.boxShadow || undefined,
            pointerEvents: "none",
          }}
        />
      );
    case COMPONENT_TYPES.BUTTON:
      return (
        <button
          className="comp-button"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={(e) => handleBlur(e, "label")}
          style={{
            fontFamily: resolveFontFamily(content.fontFamily),
            fontSize: content.fontSize ? `${content.fontSize}px` : undefined,
            color: content.color || undefined,
            background: content.background || undefined,
            backgroundColor: content.backgroundColor || undefined,
            borderRadius:
              typeof content.borderRadius === "number"
                ? `${content.borderRadius}px`
                : "4px",
            boxShadow: content.boxShadow || undefined,
            width: "100%",
            height: "100%",
            margin: 0,
            border: "none",
            cursor: isEditing ? "text" : "pointer",
            pointerEvents: isEditing ? "auto" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {content.iconName && <FontAwesomeIcon icon={content.iconName} />}
          {content.label}
        </button>
      );
    case COMPONENT_TYPES.CART:
      // Dynamically calculate cart icon size
      const cartW = component.size?.width || 0;
      const cartH = component.size?.height || 0;
      const dynamicCartSize = Math.min(cartW, cartH) || 32;

      return (
        <div
          className="comp-cart"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <span
            style={{
              fontSize: `${dynamicCartSize}px`,
              color: content.color,
            }}
          >
            🛒
          </span>
          <span
            className="cart-badge"
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
    case COMPONENT_TYPES.ICON:
      // Dynamically calculate icon size to match container's smallest dimension
      const containerW = component.size?.width || 0;
      const containerH = component.size?.height || 0;
      const dynamicSize = Math.min(containerW, containerH) || 32;

      return (
        <div
          className="comp-icon-wrapper"
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
    default:
      return (
        <div className="comp-default" style={{ padding: "20px" }}>
          <h3>{type}</h3>
          <p>
            This component is now broken down into individual elements for
            better control.
          </p>
        </div>
      );
  }
}

async function getCroppedImg(image, pixelCrop) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(pixelCrop.width * pixelRatio);
  canvas.height = Math.floor(pixelCrop.height * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 1);
  });
}

function CropModal({ image, onCropComplete, onCancel }) {
  const [aspect, setAspect] = useState(undefined);
  const cropperRef = useRef(null);
  const safeSrc = typeof image === "string" && image.startsWith("http")
    ? `${API_BASE}/proxy-image?url=${encodeURIComponent(image)}`
    : image;

  function handleCrop() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: "high" });
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      onCropComplete(blob, canvas.width, canvas.height);
    }, "image/jpeg", 0.95);
  }

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-content">
        <div className="crop-container" style={{ overflow: 'hidden', textAlign: 'center' }}>
          <Cropper
            src={safeSrc}
            style={{ height: 400, width: "100%" }}
            aspectRatio={aspect || NaN}
            guides={true}
            viewMode={1}
            background={false}
            responsive={true}
            autoCropArea={1}
            checkOrientation={false}
            crossOrigin="anonymous"
            ref={cropperRef}
          />
        </div>
        <div className="crop-controls">
          <div className="aspect-ratio-selector">
            <button className={aspect === undefined ? "active" : ""} onClick={() => setAspect(undefined)}>Free</button>
            <button className={aspect === 1 ? "active" : ""} onClick={() => setAspect(1)}>1:1</button>
            <button className={aspect === 4 / 3 ? "active" : ""} onClick={() => setAspect(4 / 3)}>4:3</button>
            <button className={aspect === 16 / 9 ? "active" : ""} onClick={() => setAspect(16 / 9)}>16:9</button>
          </div>
          <div className="crop-buttons">
            <button onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleCrop} className="save-btn">
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorPage({ theme, toggleTheme }) {
  const { user } = useAuth() || {};
  const location = useLocation();
  const [components, setComponents] = useState([]);
  const [title, setTitle] = useState("My Portfolio");
  const [activeComponent, setActiveComponent] = useState(null);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [canvasMode, setCanvasMode] = useState("desktop");
  // Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  // Design Options & Fonts
  const [customFonts, setCustomFonts] = useState([]);
  const [fontUrl, setFontUrl] = useState("");
  const [globalStyles, setGlobalStyles] = useState({
    backgroundColor: "#ffffff",
    fontFamily: "system",
  });
  const designOptions = useDesignOptions();

  // Cropping state
  const [croppingComponent, setCroppingComponent] = useState(null);
  const initialAppliedRef = useRef(false);
  const HISTORY_LIMIT = 30;
  const historyRef = useRef({ past: [], future: [] });
  const isRestoringRef = useRef(false);
  const lastHistoryKeyRef = useRef("");
  const componentsRef = useRef(components);
  const globalStylesRef = useRef(globalStyles);
  const titleRef = useRef(title);

  useEffect(() => {
    componentsRef.current = components;
  }, [components]);

  useEffect(() => {
    globalStylesRef.current = globalStyles;
  }, [globalStyles]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const canvasMinHeight = React.useMemo(() => {
    const maxBottom = Math.max(
      0,
      ...components.map((c) => {
        const y = c?.position?.y || 0;
        const h = c?.size?.height || 0;
        return y + h;
      }),
    );
    const custom = parseInt(globalStyles?.customHeight, 10);
    const base =
      Number.isFinite(custom) && custom > 0 ? custom : 1080;
    return Math.max(base, maxBottom + 100);
  }, [components, globalStyles?.customHeight]);

  const makeSnapshot = React.useCallback(() => {
    return {
      components: JSON.parse(JSON.stringify(componentsRef.current || [])),
      globalStyles: JSON.parse(
        JSON.stringify(globalStylesRef.current || { backgroundColor: "#ffffff", fontFamily: "system" }),
      ),
      title: String(titleRef.current || ""),
    };
  }, []);

  const resetHistory = React.useCallback(() => {
    historyRef.current.past = [];
    historyRef.current.future = [];
    lastHistoryKeyRef.current = "";
  }, []);

  const pushHistory = React.useCallback(() => {
    if (isRestoringRef.current) return;
    const snap = makeSnapshot();
    const key = JSON.stringify(snap);
    if (key === lastHistoryKeyRef.current) return;
    historyRef.current.past.push(snap);
    if (historyRef.current.past.length > HISTORY_LIMIT) {
      historyRef.current.past.splice(0, historyRef.current.past.length - HISTORY_LIMIT);
    }
    historyRef.current.future = [];
    lastHistoryKeyRef.current = key;
  }, [HISTORY_LIMIT, makeSnapshot]);

  const updateGlobalStyles = React.useCallback(
    (styles, options = {}) => {
      if (options.recordHistory !== false) pushHistory();
      setGlobalStyles((prev) => ({ ...prev, ...(styles || {}) }));
    },
    [pushHistory],
  );

  const applySnapshot = React.useCallback((snap) => {
    if (!snap) return;
    isRestoringRef.current = true;
    setComponents(Array.isArray(snap.components) ? snap.components : []);
    setGlobalStyles(
      snap.globalStyles && typeof snap.globalStyles === "object"
        ? snap.globalStyles
        : { backgroundColor: "#ffffff", fontFamily: "system" },
    );
    setTitle(typeof snap.title === "string" ? snap.title : "My Website");
    setActiveComponent(null);
    isRestoringRef.current = false;
    lastHistoryKeyRef.current = JSON.stringify(snap);
  }, []);

  const undo = React.useCallback(() => {
    const past = historyRef.current.past;
    if (!past.length) return;
    const current = makeSnapshot();
    historyRef.current.future.push(current);
    if (historyRef.current.future.length > HISTORY_LIMIT) {
      historyRef.current.future.splice(0, historyRef.current.future.length - HISTORY_LIMIT);
    }
    const prev = past.pop();
    applySnapshot(prev);
  }, [HISTORY_LIMIT, applySnapshot, makeSnapshot]);

  const redo = React.useCallback(() => {
    const future = historyRef.current.future;
    if (!future.length) return;
    const current = makeSnapshot();
    historyRef.current.past.push(current);
    if (historyRef.current.past.length > HISTORY_LIMIT) {
      historyRef.current.past.splice(0, historyRef.current.past.length - HISTORY_LIMIT);
    }
    const next = future.pop();
    applySnapshot(next);
  }, [HISTORY_LIMIT, applySnapshot, makeSnapshot]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      const key = String(e.key || "").toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  useEffect(() => {
    if (!activeComponent) return;

    const handleMouseDown = (e) => {
      const target = e.target;
      if (!target) return;

      if (target.closest?.(".component-wrapper")) return;
      if (target.closest?.(".floating-toolbar")) return;

      setActiveComponent(null);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [activeComponent]);

  // Make custom fonts available globally or pass them down
  window.customFonts = customFonts;

  const applyTemplate = React.useCallback((templateId) => {
    resetHistory();
    const next = getTemplateComponents(templateId);
    const meta = getTemplateById(templateId);
    setComponents(next);
    setActiveComponent(null);
    setCurrentDesignId(null);
    setTitle(meta?.title || "My Website");
  }, [resetHistory]);

  const addCustomFont = () => {
    if (!fontUrl) return;

    // Simple validation for Google Fonts
    if (!fontUrl.includes("fonts.googleapis.com")) {
      alert("Please enter a valid Google Fonts URL");
      return;
    }

    try {
      // Extract font family name
      const urlObj = new URL(fontUrl);
      const familyParam = urlObj.searchParams.get("family");

      if (familyParam) {
        // Handle multiple fonts or weights (take the first one before :)
        let familyName = familyParam.split(":")[0];
        // Remove plus signs
        familyName = familyName.replace(/\+/g, " ");

        // Check if already added
        if (customFonts.some((f) => f.name === familyName)) {
          alert("Font already added!");
          return;
        }

        // Inject link
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = fontUrl;
        document.head.appendChild(link);

        setCustomFonts([...customFonts, { name: familyName, url: fontUrl }]);
        setFontUrl(""); // Clear input
      }
    } catch (e) {
      console.error("Error parsing font URL", e);
      alert("Invalid URL format");
    }
  };

  useEffect(() => {
    if (initialAppliedRef.current) return;
    initialAppliedRef.current = true;

    const state = location.state || {};
    if (state && typeof state === "object") {
      if (typeof state.templateId === "string") {
        applyTemplate(state.templateId);
        return;
      }
      if (Array.isArray(state.components)) {
        resetHistory();
        setComponents(JSON.parse(JSON.stringify(state.components)));
        setActiveComponent(null);
        setCurrentDesignId(null);
        return;
      }
    }

    const params = new URLSearchParams(location.search);
    const templateId = params.get("template");
    if (templateId && TEMPLATE_DATA[templateId]) {
      resetHistory();
      setComponents(JSON.parse(JSON.stringify(TEMPLATE_DATA[templateId])));
      setTitle(
        `${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Website`,
      );
      setCurrentDesignId(null);
    }
  }, [applyTemplate, location, resetHistory]);

  const [saveStatus, setSaveStatus] = useState("");
  const [currentDesignId, setCurrentDesignId] = useState(null);

  const saveDesign = async () => {
    if (!user) {
      alert("Please login to save your design.");
      return null;
    }

    try {
      setSaveStatus("Saving...");
      
      const sanitizedComponents = JSON.parse(JSON.stringify(components));
      const designData = {
        components: sanitizedComponents,
        globalStyles: JSON.parse(JSON.stringify(globalStyles)),
        title,
        updatedAt: serverTimestamp(),
        userId: user.uid,
      };

      let savedId = currentDesignId || null;
      if (currentDesignId) {
        const designRef = doc(db, "designs", currentDesignId);
        await setDoc(designRef, designData, { merge: true });
      } else {
        // Create a new document for a new creation
        const designsCol = collection(db, "designs");
        const newDoc = await addDoc(designsCol, designData);
        setCurrentDesignId(newDoc.id);
        savedId = newDoc.id;
        // Update URL so subsequent saves use this ID
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete("template");
        newUrl.searchParams.set("design", newDoc.id);
        window.history.pushState({}, "", newUrl);
      }

      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(""), 3000);
      return savedId;
    } catch (err) {
      console.error("Detailed save error:", err);
      setSaveStatus("Error saving");
      alert("Failed to save design. Please check your internet connection.");
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadUserDesign() {
      if (!user) return;

      const params = new URLSearchParams(location.search);
      const designId = params.get("design");
      const templateId = params.get("template");
      const state = location.state || {};
      const hasStateTemplate =
        state &&
        typeof state === "object" &&
        (typeof state.templateId === "string" || Array.isArray(state.components));

      // Case 1: Load specific design from Home Page
      if (designId) {
        try {
          const designRef = doc(db, "designs", designId);
          const designSnap = await getDoc(designRef);

          if (designSnap.exists()) {
            const data = designSnap.data();
            if (cancelled) return;
            resetHistory();
            setComponents(data.components || []);
            setTitle(data.title || "My Website");
            if (data.globalStyles && typeof data.globalStyles === "object") {
              setGlobalStyles((prev) => ({ ...prev, ...data.globalStyles }));
            }
            setCurrentDesignId(designId);
            console.log("Loaded specific design:", designId);
          }
        } catch (err) {
          console.error("Error loading specific design:", err);
        }
        return;
      }

      // Case 2: Starting from template (already handled by other useEffect, but let's sync)
      if (templateId || hasStateTemplate) {
        setCurrentDesignId(null); // It's a new design based on template
        return;
      }

      // Case 3: Load default user design (if no params)
      try {
        const designRef = doc(db, "designs", user.uid);
        const designSnap = await getDoc(designRef);

        if (designSnap.exists()) {
          const data = designSnap.data();
          if (cancelled) return;
          resetHistory();
          setComponents(data.components || []);
          setTitle(data.title || "My Website");
          if (data.globalStyles && typeof data.globalStyles === "object") {
            setGlobalStyles((prev) => ({ ...prev, ...data.globalStyles }));
          }
          setCurrentDesignId(user.uid);
          console.log("Loaded default user design");
        }
      } catch (err) {
        console.error("Detailed load error:", err);
      }
    }

    loadUserDesign();
    return () => {
      cancelled = true;
    };
  }, [location, resetHistory, user]);

  // Sidebar Resize Logic
  const startResizing = React.useCallback((mouseDownEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX; // Assuming sidebar is on left
        if (newWidth > 200 && newWidth < 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Updated to accept optional content overrides
  const addComponent = (type, contentOverrides = {}) => {
    const timestamp = Date.now();
    pushHistory();

    // Check if it's a section type that needs to be broken down
    const isSection = [
      "hero",
      "features",
      "about",
      "contact",
      "gallery",
      "testimonials",
      "preset_hero_banner",
      "preset_feature_grid",
      "preset_about_me",
      "preset_testimonials",
      "preset_cta_strip",
      "preset_navbar",
      "preset_gallery",
      "preset_footer",
    ].includes(type);

    const finalizeComponentAddition = (initialSize, overrides) => {
      const newComponent = {
        id: `${type}-${timestamp}`,
        type: type,
        content: getDefaultContent(type),
        position: { x: 50, y: 50 },
        size: initialSize,
        zIndex: 1,
      };

      if (Object.keys(overrides).length > 0) {
        const { initialWidth, initialHeight, ...restOverrides } = overrides;
        newComponent.content = { ...newComponent.content, ...restOverrides };
      }

      setComponents((prev) => [...prev, newComponent]);
      setActiveComponent(newComponent);
    };

    if (isSection) {
      let newComponents = [];
      const maxBottom = Math.max(
        0,
        ...components.map((c) => {
          const y = c.position?.y || 0;
          const h = c.size?.height || 0;
          return y + h;
        }),
      );
      const baseY = Math.max(120, maxBottom + 80);

      switch (type) {
        case "hero":
          newComponents = [
            {
              id: `h1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 50, y: baseY },
              size: { width: 800, height: 100 },
              zIndex: 1,
              content: {
                text: "New Hero Title",
                fontSize: 64,
                fontWeight: "bold",
              },
            },
            {
              id: `h2-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 50, y: baseY + 120 },
              size: { width: 800, height: 60 },
              zIndex: 1,
              content: {
                text: "Add your catchy subtitle here",
                fontSize: 24,
                color: "#666",
              },
            },
          ];
          break;
        case "preset_hero_banner":
          newComponents = [
            {
              id: `phb-bg-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 80, y: baseY },
              size: { width: 1040, height: 380 },
              zIndex: 1,
              content: {
                text: "",
                background: "#0f172a",
                borderRadius: 24,
                boxShadow: "0 30px 70px rgba(15, 23, 42, 0.45)",
                padding: "0",
              },
            },
            {
              id: `phb-deco-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 120, y: baseY + 46 },
              size: { width: 300, height: 42 },
              zIndex: 2,
              content: {
                text: "CANVA‑STYLE SECTION",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "Inter",
                color: "#E2E8F0",
                textAlign: "left",
                letterSpacing: "0.18em",
                background: "rgba(255,255,255,0.08)",
                borderRadius: 999,
                padding: "10px 16px",
              },
            },
            {
              id: `phb-h1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 120, y: baseY + 90 },
              size: { width: 640, height: 160 },
              zIndex: 2,
              content: {
                text: "Build stunning\nwebsites fast.",
                fontSize: 64,
                fontWeight: 900,
                fontFamily: "Inter",
                color: "#ffffff",
                textAlign: "left",
                lineHeight: 1.05,
                padding: "0",
              },
            },
            {
              id: `phb-sub-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 120, y: baseY + 250 },
              size: { width: 620, height: 70 },
              zIndex: 2,
              content: {
                text: "Drag, drop, and customize — no code required. Perfect spacing built in.",
                fontSize: 18,
                fontFamily: "Inter",
                color: "#CBD5E1",
                textAlign: "left",
                lineHeight: 1.5,
                padding: "0",
              },
            },
            {
              id: `phb-cta-${timestamp}`,
              type: COMPONENT_TYPES.BUTTON,
              position: { x: 120, y: baseY + 330 },
              size: { width: 190, height: 54 },
              zIndex: 2,
              content: {
                label: "Get Started",
                fontSize: 16,
                fontFamily: "Inter",
                color: "#ffffff",
                background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
                borderRadius: 14,
                boxShadow:
                  "0 18px 45px rgba(99, 102, 241, 0.55), 0 0 0 1px rgba(255,255,255,0.14)",
              },
            },
            {
              id: `phb-img-${timestamp}`,
              type: COMPONENT_TYPES.IMAGE,
              position: { x: 820, y: baseY + 70 },
              size: { width: 260, height: 260 },
              zIndex: 2,
              content: {
                url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&fit=crop",
                alt: "Team",
                borderRadius: 22,
                boxShadow: "0 28px 60px rgba(0,0,0,0.35)",
              },
            },
          ];
          break;
        case "features":
          newComponents = [
            {
              id: `f1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 50, y: baseY },
              size: { width: 800, height: 80 },
              zIndex: 1,
              content: {
                text: "Our Features",
                fontSize: 48,
                fontWeight: "bold",
              },
            },
            {
              id: `f2-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 50, y: baseY + 100 },
              size: { width: 250, height: 100 },
              zIndex: 1,
              content: { text: "Feature One Description", fontSize: 18 },
            },
            {
              id: `f3-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 325, y: baseY + 100 },
              size: { width: 250, height: 100 },
              zIndex: 1,
              content: { text: "Feature Two Description", fontSize: 18 },
            },
            {
              id: `f4-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 600, y: baseY + 100 },
              size: { width: 250, height: 100 },
              zIndex: 1,
              content: { text: "Feature Three Description", fontSize: 18 },
            },
          ];
          break;
        case "preset_feature_grid": {
          const cardY = baseY + 150;
          const cardW = 320;
          const gap = 40;
          const xs = [80, 80 + cardW + gap, 80 + (cardW + gap) * 2];
          const cardBg = {
            text: "",
            background: "#ffffff",
            borderRadius: 20,
            boxShadow: "0 22px 55px rgba(15, 23, 42, 0.10)",
            padding: "0",
          };
          const makeCard = (idx, iconName, iconColor, title, body) => [
            {
              id: `pfg-card-${idx}-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: xs[idx], y: cardY },
              size: { width: cardW, height: 190 },
              zIndex: 1,
              content: cardBg,
            },
            {
              id: `pfg-icon-${idx}-${timestamp}`,
              type: COMPONENT_TYPES.ICON,
              position: { x: xs[idx] + 22, y: cardY + 20 },
              size: { width: 46, height: 46 },
              zIndex: 2,
              content: { iconName, color: iconColor },
            },
            {
              id: `pfg-title-${idx}-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: xs[idx] + 22, y: cardY + 76 },
              size: { width: cardW - 44, height: 34 },
              zIndex: 2,
              content: {
                text: title,
                fontSize: 18,
                fontWeight: 800,
                fontFamily: "Inter",
                color: "#0F172A",
                textAlign: "left",
                padding: "0",
              },
            },
            {
              id: `pfg-body-${idx}-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: xs[idx] + 22, y: cardY + 112 },
              size: { width: cardW - 44, height: 64 },
              zIndex: 2,
              content: {
                text: body,
                fontSize: 14,
                fontFamily: "Inter",
                color: "#475569",
                textAlign: "left",
                padding: "0",
                lineHeight: 1.45,
              },
            },
          ];
          newComponents = [
            {
              id: `pfg-h1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 80, y: baseY },
              size: { width: 820, height: 70 },
              zIndex: 2,
              content: {
                text: "Why people love this builder",
                fontSize: 44,
                fontWeight: 900,
                fontFamily: "Inter",
                color: "#0F172A",
                textAlign: "left",
                padding: "0",
              },
            },
            {
              id: `pfg-sub-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 80, y: baseY + 74 },
              size: { width: 780, height: 52 },
              zIndex: 2,
              content: {
                text: "Three clean feature cards with icons, perfect spacing, and modern Tailwind-style colors.",
                fontSize: 16,
                fontFamily: "Inter",
                color: "#334155",
                textAlign: "left",
                padding: "0",
              },
            },
            ...makeCard(
              0,
              "bolt",
              "#6366F1",
              "Fast",
              "Start from templates and build your layout in minutes.",
            ),
            ...makeCard(
              1,
              "shield",
              "#10B981",
              "Reliable",
              "Built-in safeguards and a stable editor workflow.",
            ),
            ...makeCard(
              2,
              "sparkles",
              "#F59E0B",
              "Beautiful",
              "Typography + spacing that looks premium instantly.",
            ),
          ];
          break;
        }
        case "about":
          newComponents = [
            {
              id: `a1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 50, y: baseY },
              size: { width: 400, height: 80 },
              zIndex: 1,
              content: {
                text: "About Us",
                fontSize: 48,
                fontWeight: "bold",
                color: "#ffffff",
              },
            },
            {
              id: `a2-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 50, y: baseY + 100 },
              size: { width: 400, height: 200 },
              zIndex: 1,
              content: {
                text: "Write your story here. Explain what makes your business unique and why customers should choose you.",
                fontSize: 18,
                color: "#dddddd",
              },
            },
            {
              id: `a3-${timestamp}`,
              type: COMPONENT_TYPES.IMAGE,
              position: { x: 500, y: baseY },
              size: { width: 400, height: 300 },
              zIndex: 1,
              content: {
                url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
                alt: "Team",
              },
            },
          ];
          break;
        case "preset_about_me":
          newComponents = [
            {
              id: `pam-card-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 80, y: baseY },
              size: { width: 1040, height: 280 },
              zIndex: 1,
              content: {
                text: "",
                background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
                borderRadius: 24,
                boxShadow: "0 26px 60px rgba(15, 23, 42, 0.12)",
                padding: "0",
              },
            },
            {
              id: `pam-photo-${timestamp}`,
              type: COMPONENT_TYPES.IMAGE,
              position: { x: 120, y: baseY + 50 },
              size: { width: 180, height: 180 },
              zIndex: 2,
              content: {
                url: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=900&fit=crop",
                alt: "Profile",
                borderRadius: 999,
                boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
              },
            },
            {
              id: `pam-kicker-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 340, y: baseY + 56 },
              size: { width: 720, height: 38 },
              zIndex: 2,
              content: {
                text: "ABOUT ME",
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "Inter",
                color: "#6366F1",
                textAlign: "left",
                letterSpacing: "0.22em",
                padding: "0",
              },
            },
            {
              id: `pam-h1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 340, y: baseY + 92 },
              size: { width: 720, height: 70 },
              zIndex: 2,
              content: {
                text: "Hi, I’m Alex — designer & builder.",
                fontSize: 36,
                fontWeight: 900,
                fontFamily: "Inter",
                color: "#0F172A",
                textAlign: "left",
                padding: "0",
              },
            },
            {
              id: `pam-body-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 340, y: baseY + 162 },
              size: { width: 720, height: 110 },
              zIndex: 2,
              content: {
                text: "I love clean UI, bold typography, and thoughtful details. This preset gives you a polished About section with a circular portrait and balanced text layout.",
                fontSize: 16,
                fontFamily: "Inter",
                color: "#334155",
                textAlign: "left",
                lineHeight: 1.55,
                padding: "0",
              },
            },
          ];
          break;
        case "contact":
          newComponents = [
            {
              id: `c1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 50, y: baseY },
              size: { width: 800, height: 80 },
              zIndex: 1,
              content: { text: "Contact Us", fontSize: 48, fontWeight: "bold" },
            },
            {
              id: `c2-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 50, y: baseY + 100 },
              size: { width: 800, height: 40 },
              zIndex: 1,
              content: {
                text: "Email: contact@example.com",
                fontSize: 20,
                color: "#4a90e2",
              },
            },
          ];
          break;
        case "preset_testimonials": {
          const sectionH = 380;
          const y0 = baseY;
          const cardY = y0 + 150;
          const cardW = 320;
          const gap = 40;
          const xs = [80, 80 + cardW + gap, 80 + (cardW + gap) * 2];
          const makeQuote = (idx, quote, name) => [
            {
              id: `pt-bg-${idx}-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: xs[idx], y: cardY },
              size: { width: cardW, height: 190 },
              zIndex: 2,
              content: {
                text: "",
                background: "rgba(255,255,255,0.08)",
                borderRadius: 20,
                boxShadow: "0 18px 44px rgba(0,0,0,0.35)",
                padding: "0",
              },
            },
            {
              id: `pt-quote-${idx}-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: xs[idx] + 18, y: cardY + 18 },
              size: { width: cardW - 36, height: 110 },
              zIndex: 3,
              content: {
                text: `“${quote}”`,
                fontSize: 14,
                fontFamily: "Inter",
                color: "#E2E8F0",
                textAlign: "left",
                lineHeight: 1.5,
                padding: "0",
              },
            },
            {
              id: `pt-name-${idx}-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: xs[idx] + 18, y: cardY + 138 },
              size: { width: cardW - 36, height: 34 },
              zIndex: 3,
              content: {
                text: `— ${name}`,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "Inter",
                color: "#A7F3D0",
                textAlign: "left",
                padding: "0",
              },
            },
          ];
          newComponents = [
            {
              id: `pt-section-bg-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 80, y: y0 },
              size: { width: 1040, height: sectionH },
              zIndex: 1,
              content: {
                text: "",
                background: "linear-gradient(135deg, #0F172A 0%, #111827 60%, #4F46E5 100%)",
                borderRadius: 24,
                boxShadow: "0 30px 70px rgba(15, 23, 42, 0.45)",
                padding: "0",
              },
            },
            {
              id: `pt-h1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 120, y: y0 + 40 },
              size: { width: 800, height: 70 },
              zIndex: 2,
              content: {
                text: "Trusted by creators",
                fontSize: 44,
                fontWeight: 900,
                fontFamily: "Inter",
                color: "#ffffff",
                textAlign: "left",
                padding: "0",
              },
            },
            {
              id: `pt-sub-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 120, y: y0 + 110 },
              size: { width: 820, height: 44 },
              zIndex: 2,
              content: {
                text: "A sleek testimonial strip with soft glass cards and perfect spacing.",
                fontSize: 16,
                fontFamily: "Inter",
                color: "#CBD5E1",
                textAlign: "left",
                padding: "0",
              },
            },
            ...makeQuote(0, "Looks professional instantly. My clients love it.", "Nadia • Designer"),
            ...makeQuote(1, "The presets save me hours every week.", "Ken • Founder"),
            ...makeQuote(2, "Clean, modern, and easy for non-coders.", "Ivy • Student"),
          ];
          break;
        }
        case "preset_cta_strip":
          newComponents = [
            {
              id: `pct-bg-${timestamp}`,
              type: COMPONENT_TYPES.TEXT,
              position: { x: 80, y: baseY },
              size: { width: 1040, height: 170 },
              zIndex: 1,
              content: {
                text: "",
                background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)",
                borderRadius: 24,
                boxShadow: "0 28px 60px rgba(99, 102, 241, 0.35)",
                padding: "0",
              },
            },
            {
              id: `pct-h1-${timestamp}`,
              type: COMPONENT_TYPES.HEADING,
              position: { x: 120, y: baseY + 42 },
              size: { width: 680, height: 70 },
              zIndex: 2,
              content: {
                text: "Ready to publish your site?",
                fontSize: 44,
                fontWeight: 900,
                fontFamily: "Inter",
                color: "#ffffff",
                textAlign: "left",
                padding: "0",
              },
            },
            {
              id: `pct-btn-${timestamp}`,
              type: COMPONENT_TYPES.BUTTON,
              position: { x: 860, y: baseY + 58 },
              size: { width: 220, height: 54 },
              zIndex: 2,
              content: {
                label: "Create Free Design",
                fontSize: 16,
                fontFamily: "Inter",
                color: "#0F172A",
                background: "rgba(255,255,255,0.92)",
                borderRadius: 14,
                boxShadow: "0 18px 45px rgba(15, 23, 42, 0.22)",
              },
            },
          ];
          break;

        case "preset_navbar":
          newComponents = [
            { id: `nav-bg-${timestamp}`, type: "text", position: { x: 0, y: baseY }, size: { width: 1200, height: 80 }, zIndex: 1, content: { text: "", background: "#ffffff", borderBottom: "1px solid #e2e8f0" } },
            { id: `nav-logo-${timestamp}`, type: "heading", position: { x: 80, y: baseY + 20 }, size: { width: 200, height: 40 }, zIndex: 2, content: { text: "Brand.", fontSize: 28, fontWeight: 900, textAlign: "left" } },
            { id: `nav-links-${timestamp}`, type: "text", position: { x: 400, y: baseY + 25 }, size: { width: 400, height: 30 }, zIndex: 2, content: { text: "Home        About        Work        Contact", fontSize: 16, color: "#475569", textAlign: "center", fontWeight: 500 } },
            { id: `nav-btn-${timestamp}`, type: "button", position: { x: 960, y: baseY + 15 }, size: { width: 160, height: 50 }, zIndex: 2, content: { label: "Get Started", backgroundColor: "#0F172A", color: "#ffffff", borderRadius: 8 } }
          ];
          break;

        case "preset_gallery":
          newComponents = [
            { id: `gal-h1-${timestamp}`, type: "heading", position: { x: 80, y: baseY }, size: { width: 1040, height: 60 }, zIndex: 2, content: { text: "Our Work", fontSize: 44, fontWeight: 900, textAlign: "center", color: "#0F172A" } },
            { id: `gal-img1-${timestamp}`, type: "image", position: { x: 80, y: baseY + 100 }, size: { width: 660, height: 400 }, zIndex: 1, content: { url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800", alt: "Gallery 1", borderRadius: 16 } },
            { id: `gal-img2-${timestamp}`, type: "image", position: { x: 780, y: baseY + 100 }, size: { width: 340, height: 180 }, zIndex: 1, content: { url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400", alt: "Gallery 2", borderRadius: 16 } },
            { id: `gal-img3-${timestamp}`, type: "image", position: { x: 780, y: baseY + 320 }, size: { width: 340, height: 180 }, zIndex: 1, content: { url: "https://images.unsplash.com/photo-1526481280695-3c687fd5432c?w=400", alt: "Gallery 3", borderRadius: 16 } },
          ];
          break;

        case "preset_footer":
          newComponents = [
            { id: `ftr-bg-${timestamp}`, type: "text", position: { x: 0, y: baseY }, size: { width: 1200, height: 100 }, zIndex: 1, content: { text: "", background: "#0F172A" } },
            { id: `ftr-copy-${timestamp}`, type: "text", position: { x: 80, y: baseY + 40 }, size: { width: 400, height: 30 }, zIndex: 2, content: { text: "© 2026 Your Company. All rights reserved.", fontSize: 14, color: "#94A3B8", textAlign: "left" } },
            { id: `ftr-icon1-${timestamp}`, type: "icon", position: { x: 960, y: baseY + 35 }, size: { width: 30, height: 30 }, zIndex: 2, content: { icon: "twitter", color: "#ffffff" } },
            { id: `ftr-icon2-${timestamp}`, type: "icon", position: { x: 1020, y: baseY + 35 }, size: { width: 30, height: 30 }, zIndex: 2, content: { icon: "instagram", color: "#ffffff" } },
            { id: `ftr-icon3-${timestamp}`, type: "icon", position: { x: 1080, y: baseY + 35 }, size: { width: 30, height: 30 }, zIndex: 2, content: { icon: "envelope", color: "#ffffff" } }
          ];
          break;
        default:
          finalizeComponentAddition({ width: 250, height: 150 }, {});
          return;
      }
      setComponents((prev) => [...prev, ...newComponents]);
      setActiveComponent(newComponents[0]);
    } else {
      // Determine initial size
      if (type === COMPONENT_TYPES.IMAGE) {
        const imageUrl =
          contentOverrides.url ||
          getDefaultContent(COMPONENT_TYPES.IMAGE).url;
        const img = new Image();
        img.onload = () => {
          let width = contentOverrides.initialWidth || img.naturalWidth || 250;
          let height = contentOverrides.initialHeight || img.naturalHeight || 150;

          // Smart scaling: Cap max dimension to 500px while maintaining aspect ratio
          const MAX_INITIAL_DIM = 500;
          if (width > MAX_INITIAL_DIM || height > MAX_INITIAL_DIM) {
            const scale = Math.min(MAX_INITIAL_DIM / width, MAX_INITIAL_DIM / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          const size = { width, height };
          finalizeComponentAddition(size, contentOverrides);
        };
        img.onerror = () => {
          finalizeComponentAddition({ width: 250, height: 150 }, contentOverrides);
        };
        img.src = imageUrl;
      } else {
        let initialSize = { width: 250, height: 150 };
        if (type === COMPONENT_TYPES.ICON) {
          initialSize = { width: 100, height: 100 };
        }
        finalizeComponentAddition(initialSize, contentOverrides);
      }
    }
  };

  const getDefaultContent = (type) => {
    switch (type) {
      case COMPONENT_TYPES.HERO:
        return {
          title: "New Hero Section",
          subtitle: "Add a catchy subtitle here",
        };
      case COMPONENT_TYPES.FEATURES:
        return {
          title: "Our Features",
          list: ["Feature 1", "Feature 2", "Feature 3"],
        };
      case COMPONENT_TYPES.ABOUT:
        return {
          title: "About Us",
          text: "Write something about your business or yourself.",
        };

      case COMPONENT_TYPES.IMAGE:
        return {
          url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
          alt: "Landscape",
        };
      case COMPONENT_TYPES.BUTTON:
        return {
          label: "Click Me",
          link: "#",
          fontFamily: "system",
          fontSize: 16,
          color: "#ffffff",
        };
      case COMPONENT_TYPES.CART:
        return { size: 24, color: "#333" };
      case COMPONENT_TYPES.ICON:
        return { iconName: "star", size: 32, color: "#f1c40f" };
      default:
        return { title: "New Section" };
    }
  };

  const updateComponent = (id, updates, options = {}) => {
    if (options.recordHistory !== false) pushHistory();
    setComponents((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      if (activeComponent?.id === id) {
        setActiveComponent(updated.find((c) => c.id === id));
      }
      return updated;
    });
  };

  const updateComponentContent = (id, newContent, options = {}) => {
    if (options.recordHistory !== false) pushHistory();
    setComponents((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, content: { ...c.content, ...newContent } } : c,
      );
      if (activeComponent?.id === id) {
        setActiveComponent(updated.find((c) => c.id === id));
      }
      return updated;
    });
  };

  const removeComponent = (id) => {
    pushHistory();
    setComponents((prev) => prev.filter((c) => c.id !== id));
    if (activeComponent?.id === id) setActiveComponent(null);
  };

  const moveComponent = (dragIndex, hoverIndex) => {
    // This function is no longer needed for RND absolute positioning
    // But we keep it empty to avoid breaking any references if they exist
  };

  const sectionTypes = [
    "hero",
    "features",
    "about",
    "contact",
    "gallery",
    "testimonials",
  ];
  const elementTypes = ["heading", "text", "image", "button", "cart", "icon"];

  const uploadBlobToUserImages = async (blob) => {
    let id = "";
    try {
      const uuidMod = await import("uuid");
      id = uuidMod.v4();
    } catch {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        id = window.crypto.randomUUID();
      } else {
        id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      }
    }
    const type = blob.type || "image/jpeg";
    const ext = type.split("/")[1] ? type.split("/")[1].replace("jpeg", "jpg") : "jpg";
    const path = `user-images/${id}.${ext}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, blob, { contentType: type });
    const url = await getDownloadURL(ref);
    return { url, path };
  };

  const handleCropComplete = async (blob, width, height) => {
    if (!croppingComponent) return;

    try {
      const result = await uploadBlobToUserImages(blob);

      // Smart scaling for the new cropped size (cap at 500px)
      let newWidth = width;
      let heightVal = height;
      const MAX_DIM = 500;
      if (newWidth > MAX_DIM || heightVal > MAX_DIM) {
        const scale = Math.min(MAX_DIM / newWidth, MAX_DIM / heightVal);
        newWidth = Math.round(newWidth * scale);
        heightVal = Math.round(heightVal * scale);
      }

      // Update both content (URL) and size (so aspect ratio locks correctly)
      updateComponent(croppingComponent.id, {
        size: { width: newWidth, height: heightVal },
        content: { ...croppingComponent.content, url: result.url },
      });

      setCroppingComponent(null);
    } catch (err) {
      console.error("Crop upload failed", err);
      alert("Cropping failed: " + (err.message || err));
    }
  };

  return (
    <div className="editor-layout">
      <header className="workspace-header">
        <div className="workspace-header-inner">
          <div className="workspace-header-left">
            <div className="workspace-logo">My Portfolio</div>
          </div>
          <nav className="workspace-nav" aria-label="Primary">
            <Link to="/about" className="workspace-nav-link">
              About
            </Link>
            <Link to="/projects" className="workspace-nav-link">
              Projects
            </Link>
            <Link to="/contact" className="workspace-nav-link">
              Contact
            </Link>
          </nav>
          <div className="workspace-header-right">
            <button
              type="button"
              className="workspace-btn workspace-btn-secondary"
              onClick={() => setIsTemplatePickerOpen(true)}
            >
              Templates
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="workspace-btn workspace-btn-secondary"
            >
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
            <button
              type="button"
              className="workspace-btn workspace-btn-secondary"
              onClick={saveDesign}
            >
              Save
            </button>
            <button
              type="button"
              className="workspace-btn workspace-btn-primary"
              onClick={async () => {
                const id = currentDesignId || (await saveDesign());
                if (!id) return;
                window.open(`${window.location.origin}/site/${id}`, "_blank");
              }}
            >
              Publish
            </button>
            <div style={{ width: 1, height: 22, background: "rgba(15, 23, 42, 0.14)" }} />
            <button
              type="button"
              className={`workspace-btn workspace-btn-secondary ${canvasMode === "desktop" ? "active" : ""}`}
              onClick={() => setCanvasMode("desktop")}
              title="Desktop preview"
              style={{ width: 44, padding: 0 }}
            >
              <FontAwesomeIcon icon="desktop" />
            </button>
            <button
              type="button"
              className={`workspace-btn workspace-btn-secondary ${canvasMode === "mobile" ? "active" : ""}`}
              onClick={() => setCanvasMode("mobile")}
              title="Mobile preview"
              style={{ width: 44, padding: 0 }}
            >
              <FontAwesomeIcon icon="mobile-screen" />
            </button>
          </div>
        </div>
      </header>

      <div className="editor-body">
        <aside className="editor-sidebar" style={{ width: sidebarWidth }}>
          <div className="component-group" style={{ height: "100%", padding: 0 }}>
            <AddElementsPanel
              onAdd={addComponent}
              onAddWithStyle={addComponent}
              designOptions={designOptions}
            />
          </div>
          <div className="sidebar-resizer" onMouseDown={startResizing} />
          <div
            style={{
              padding: "15px",
              borderTop: "1px solid #eee",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <h4 style={{ margin: 0 }}>Page Height (px)</h4>
            <input
              type="number"
              inputMode="numeric"
              placeholder="1080"
              value={
                globalStyles?.customHeight === undefined ||
                globalStyles?.customHeight === null
                  ? ""
                  : globalStyles.customHeight
              }
              onChange={(e) => {
                const raw = String(e.target.value || "").trim();
                const next = raw ? parseInt(raw, 10) : undefined;
                updateGlobalStyles({
                  customHeight: Number.isFinite(next) && next > 0 ? next : undefined,
                });
              }}
              style={{ padding: "6px 8px", fontSize: "12px" }}
            />
          </div>
          <div
            className="custom-font-section"
            style={{ padding: "15px", borderTop: "1px solid #eee" }}
          >
            <h4>Custom Fonts</h4>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="text"
                placeholder="Google Fonts URL..."
                value={fontUrl}
                onChange={(e) => setFontUrl(e.target.value)}
                style={{ flex: 1, padding: "5px", fontSize: "12px" }}
              />
              <button
                onClick={addCustomFont}
                className="add-btn"
                style={{ padding: "5px 10px" }}
                type="button"
              >
                Add
              </button>
            </div>
            <small
              style={{
                color: "#888",
                fontSize: "10px",
                marginTop: "5px",
                display: "block",
              }}
            >
              Paste URL from fonts.google.com (e.g. valid CSS2 link)
            </small>
            {customFonts.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <small>Added:</small>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "5px",
                    marginTop: "5px",
                  }}
                >
                  {customFonts.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#eee",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "11px",
                      }}
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="editor-canvas">
          {/* THE OUTER PHONE WINDOW */}
          <div
            className={`website-preview ${canvasMode === "mobile" ? "mobile-preview" : ""}`}
            onClick={() => setActiveComponent(null)}
            style={{
              ...globalStyles,
              margin: canvasMode === "mobile" ? "18px auto" : "0 auto",
              position: "relative",
              fontFamily:
                globalStyles.fontFamily === "system"
                  ? "inherit"
                  : globalStyles.fontFamily,
              overflowX: "hidden",
            }}
          >
            {/* THE INNER SCALED CANVAS */}
            <div
              style={{
                width: "1200px",
                minHeight: `${canvasMinHeight}px`,
                margin: canvasMode === "mobile" ? "0" : "0 auto",
                transform: canvasMode === "mobile" ? `scale(${375 / 1200})` : "scale(1)",
                transformOrigin: "top left",
                position: "relative",
                backgroundColor: "white",
              }}
            >
              {components.length === 0 && (
                <div className="empty-state">
                  <p>Your website is empty. Add sections or elements from the sidebar!</p>
                </div>
              )}
              {components.map((comp) => (
                <DraggableComponent
                  key={comp.id}
                  comp={comp}
                  updateComponent={updateComponent}
                  activeComponent={activeComponent}
                  setActiveComponent={setActiveComponent}
                  removeComponent={removeComponent}
                  updateComponentContent={updateComponentContent}
                  customFonts={customFonts}
                  onCrop={(c) => setCroppingComponent(c)}
                  scale={canvasMode === "mobile" ? 375 / 1200 : 1}
                />
              ))}
            </div>
          </div>

          <AIChatAssistant
            currentComponents={components}
            activeComponent={activeComponent}
            onAddComponent={addComponent}
            onUpdateComponent={updateComponent}
            onUpdateComponentContent={updateComponentContent}
            onRemoveComponent={removeComponent}
            globalStyles={globalStyles}
            onUpdateGlobalStyle={(styles) => updateGlobalStyles(styles)}
          />
        </main>
      </div>

      {croppingComponent && (
        <CropModal
          image={croppingComponent.content.url}
          onCropComplete={handleCropComplete}
          onCancel={() => setCroppingComponent(null)}
        />
      )}

      {isTemplatePickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsTemplatePickerOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            backdropFilter: "blur(6px)",
            zIndex: 2000,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              margin: "56px auto",
              width: "min(1120px, calc(100% - 24px))",
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.10)",
              borderRadius: 16,
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
            }}
          >
            <TemplateSelector
              title="Swap templates"
              onClose={() => setIsTemplatePickerOpen(false)}
              onSelectTemplate={(templateId) => {
                applyTemplate(templateId);
                setIsTemplatePickerOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorPage;
