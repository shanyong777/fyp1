import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faFacebook } from "@fortawesome/free-brands-svg-icons";
import { useAuth } from "./AuthContext";
import "./css/AddElementsPanel.css";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
const API_BASE = (process.env.REACT_APP_AI_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

const ICON_SHAPES_PRESETS = [
  { id: "ig", label: "Instagram", icon: ["fab", "instagram"], color: "#E1306C" },
  { id: "fb", label: "Facebook", icon: ["fab", "facebook"], color: "#1877F2" },
  { id: "tw", label: "Twitter", icon: ["fab", "x-twitter"], color: "#0F172A" },
  { id: "li", label: "LinkedIn", icon: ["fab", "linkedin"], color: "#0A66C2" },
  { id: "gh", label: "GitHub", icon: ["fab", "github"], color: "#111827" },
  { id: "yt", label: "YouTube", icon: ["fab", "youtube"], color: "#FF0000" },
  { id: "tt", label: "TikTok", icon: ["fab", "tiktok"], color: "#0F172A" },
  { id: "mail", label: "Email", icon: "envelope", color: "#6366F1" },
  { id: "phone", label: "Phone", icon: "phone", color: "#10B981" },
  { id: "loc", label: "Location", icon: "location-dot", color: "#F59E0B" },
  { id: "ar", label: "Arrow Right", icon: "arrow-right", color: "#0F172A" },
  { id: "al", label: "Arrow Left", icon: "arrow-left", color: "#0F172A" },
  { id: "au", label: "Arrow Up", icon: "arrow-up", color: "#0F172A" },
  { id: "ad", label: "Arrow Down", icon: "arrow-down", color: "#0F172A" },
  { id: "st", label: "Star", icon: "star", color: "#F59E0B" },
  { id: "ht", label: "Heart", icon: "heart", color: "#EF4444" },
  { id: "cart", label: "Cart", icon: "cart-shopping", color: "#6366F1" },
  { id: "badge", label: "Badge", icon: "certificate", color: "#8B5CF6" },
  { id: "circle", label: "Circle", icon: "circle", color: "#0EA5E9" },
  { id: "square", label: "Square", icon: "square", color: "#22C55E" },
  { id: "diamond", label: "Diamond", icon: "gem", color: "#14B8A6" },
];

const AddElementsPanel = ({ onAdd, onAddWithStyle, designOptions }) => {
  const { user } = useAuth() || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Sections");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("Button"); // Button, Text, Image, Icon

  // Image Upload State
  const [imageUploadMode, setImageUploadMode] = useState("url"); // 'url' or 'file'
  const [imageFile, setImageFile] = useState(null);

  const [isUploading, setIsUploading] = useState(false);

  // Crop modal state for image uploads
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSource, setCropSource] = useState(null); // url or object URL
  const cropFileUrlRef = useRef(null); // to revoke object URL
  const pendingImageNameRef = useRef("");

  // AI Generation State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [newElement, setNewElement] = useState({
    name: "",
    // Common defaults, checks handled in render
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    borderRadius: 4,
    fontSize: "1rem",
    text: "Heading",
    icon: "star",
    url: "",
  });

  const makeRandomImageName = () =>
    `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const nameFromFile = (file) => {
    if (!file?.name) return "";
    const base = file.name.replace(/\.[^/.]+$/, "");
    return base.trim();
  };

  const nameFromUrl = (url) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      const last = (u.pathname || "").split("/").filter(Boolean).pop() || "";
      const decoded = decodeURIComponent(last);
      const base = decoded.replace(/\.[^/.]+$/, "");
      return base.trim();
    } catch {
      return "";
    }
  };

  const getAutoImageName = () => {
    const manual = (newElement.name || "").trim();
    if (manual) return manual;
    const fromFile = nameFromFile(imageFile);
    if (fromFile) return fromFile;
    const fromUrl = nameFromUrl(newElement.url);
    if (fromUrl) return fromUrl;
    return makeRandomImageName();
  };

  const categories = ["Sections", "Icons & Shapes", "All", "Buttons", "Text", "Images"];
  const {
    addButtonStyle,
    addTextStyle,
    addIconStyle,
    addImageAsset,
    buttonStyles = [],
    textStyles = [],
    iconStyles = [],
    imageAssets = [],
  } = designOptions;

  // Filter Logic
  const matchesSearch = (item) =>
    item && (item.name || "").toLowerCase().includes((searchQuery || "").toLowerCase());

  const filteredButtons = buttonStyles.filter(matchesSearch);
  const filteredText = textStyles.filter(matchesSearch);
  const filteredIcons = iconStyles.filter(matchesSearch);
  const filteredImages = imageAssets.filter(matchesSearch);

  const filterButtonStyles = buttonStyles.filter((style) =>
    style && (style.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()),
  );

  const handleAddButton = (style) => {
    // Construct the content overrides for the button
    const contentOverrides = {
      label: "Button",
      backgroundColor: style.backgroundColor,
      color: style.color,
      borderRadius: style.borderRadius,
      buttonStyleId: style.id,
    };

    if (onAddWithStyle) {
      onAddWithStyle("button", contentOverrides);
    } else if (onAdd) {
      // Fallback if generic onAdd
      onAdd("button");
    }
  };

  const openUploadFor = (type) => {
    setSelectedType(type);
    setIsUploadOpen(true);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            "image/jpeg",
            0.8,
          ); // Compress to PEG at 80% quality
        };
      };
    });
  };

  const handleCreateElement = async (e) => {
    e.preventDefault();
    if (selectedType !== "Image" && !newElement.name) return;

    if (selectedType === "Button") {
      await addButtonStyle({
        name: newElement.name,
        backgroundColor: newElement.backgroundColor,
        color: newElement.color,
        borderRadius: parseInt(newElement.borderRadius),
        border: "none",
      });
    } else if (selectedType === "Text") {
      await addTextStyle({
        name: newElement.name,
        fontSize: newElement.fontSize,
        color: newElement.color,
        fontWeight: "normal",
      });
    } else if (selectedType === "Icon") {
      await addIconStyle({
        name: newElement.name,
        icon: newElement.icon,
        color: newElement.color,
        iconUrl: newElement.iconUrl, // Optional for custom icons
      });
    } else if (selectedType === "Image") {
      const imageName = getAutoImageName();
      pendingImageNameRef.current = imageName;
      if (!newElement.name) {
        setNewElement((prev) => ({ ...prev, name: imageName }));
      }
      // Open crop modal using provided URL or selected file
      if (imageUploadMode === "url" && newElement.url) {
        try {
          const res = await fetch(newElement.url, { mode: "cors" });
          const blob = await res.blob();
          const objUrl = URL.createObjectURL(blob);
          setCropSource(objUrl);
          cropFileUrlRef.current = objUrl;
        } catch (err) {
          // Fallback: display direct URL; cropping may fail if CORS is disallowed
          setCropSource(newElement.url);
          cropFileUrlRef.current = null;
        }
        setIsCropModalOpen(true);
        return;
      }
      if (imageUploadMode === "file" && imageFile) {
        const objUrl = URL.createObjectURL(imageFile);
        setCropSource(objUrl);
        cropFileUrlRef.current = objUrl;
        setIsCropModalOpen(true);
        return;
      }
      alert("Please provide an image URL or choose a file to upload.");
      return;
    }

    setIsUploadOpen(false);
    // Reset form
    setNewElement({
      name: "",
      backgroundColor: "#3b82f6",
      color: "#ffffff",
      borderRadius: 4,
      fontSize: "1rem",
      text: "Heading",
      icon: "star",
      url: "",
    });
    setImageFile(null);
    setImageUploadMode("url");
  };

  

  async function getCroppedImg(image, pixelCrop) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
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
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to crop image (CORS may be blocking)."));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.95);
    });
  }

  const handleCropCompleteUpload = async (blob) => {
    try {
      setIsUploading(true);
      const mod = await import("./storageHelpers");
      const result = await mod.uploadImageAndSaveMetadata(blob, "images", () => {});
      const asset = await addImageAsset({
        name: pendingImageNameRef.current || newElement.name || "",
        url: result.url,
      });
      // Also add the cropped image to the canvas immediately
      const img = new Image();
      img.onload = () => {
        const overrides = {
          url: result.url,
          alt: asset.name || "",
          initialWidth: img.naturalWidth,
          initialHeight: img.naturalHeight,
        };
        if (onAddWithStyle) {
          onAddWithStyle("image", overrides);
        } else if (onAdd) {
          onAdd("image");
        }
      };
      img.src = result.url;
      if (cropFileUrlRef.current) {
        URL.revokeObjectURL(cropFileUrlRef.current);
        cropFileUrlRef.current = null;
      }
      pendingImageNameRef.current = "";
      setIsCropModalOpen(false);
      setIsUploadOpen(false);
      setCropSource(null);
      setNewElement({
        name: "",
        backgroundColor: "#3b82f6",
        color: "#ffffff",
        borderRadius: 4,
        fontSize: "1rem",
        text: "Heading",
        icon: "star",
        url: "",
      });
      setImageFile(null);
      setImageUploadMode("url");
    } catch (error) {
      console.error("Upload failed", error);
      alert("Image upload failed: " + (error.message || "Please try again."));
    } finally {
      setIsUploading(false);
    }
  };

  const cancelCrop = () => {
    if (cropFileUrlRef.current) {
      URL.revokeObjectURL(cropFileUrlRef.current);
      cropFileUrlRef.current = null;
    }
    pendingImageNameRef.current = "";
    setIsCropModalOpen(false);
    setCropSource(null);
  };

  function ImageCropModal({ image, onConfirm, onCancel }) {
    const [aspect, setAspect] = useState(undefined); // free by default
    const cropperRef = useRef(null);
    const safeSrc = typeof image === "string" && image.startsWith("http")
      ? `${API_BASE}/proxy-image?url=${encodeURIComponent(image)}`
      : image;

    const confirmCrop = async () => {
      const cropper = cropperRef.current?.cropper;
      if (!cropper) return;
      const canvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: "high" });
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        onConfirm(blob);
      }, "image/jpeg", 0.95);
    };

    return (
      <div className="crop-modal-overlay">
        <div className="crop-modal-content">
          <div className="crop-container" style={{ overflow: "hidden", textAlign: "center" }}>
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
              <button onClick={onCancel} className="cancel-btn">Cancel</button>
              <button onClick={confirmCrop} className="save-btn">Apply Crop</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Add Handlers for new types ---
  const handleAddText = (style) => {
    const overrides = {
      text: style.name, // Use name as default text? or specific content
      fontSize: style.fontSize,
      color: style.color,
      fontWeight: style.fontWeight,
    };
    handleAddToCanvas("text", overrides);
  };

  const handleAddIcon = (style) => {
    const overrides = {
      icon: style.icon,
      color: style.color,
    };
    handleAddToCanvas("icon", overrides);
  };

  const handleAddImage = (style) => {
    // Fetch image to get original dimensions
    const img = new Image();
    img.onload = () => {
      const overrides = {
        url: style.url,
        alt: style.name,
        initialWidth: img.naturalWidth,
        initialHeight: img.naturalHeight,
      };
      handleAddToCanvas("image", overrides);
    };
    img.src = style.url;
  };

  const handleGenerateIcon = async (e) => {
    e.preventDefault();
    if (!aiPrompt) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate-icon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!res.ok) {
        let message = `Generation failed (${res.status})`;
        try {
          const err = await res.json();
          message = err?.message || err?.error || message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = text;
          } catch {}
        }
        throw new Error(message);
      }

      const data = await res.json();

      let imageUrl = "";
      const generated =
        data?.data?.generated ??
        data?.generated ??
        (Array.isArray(data?.data) ? data.data : []) ??
        [];

      const first = Array.isArray(generated) ? generated[0] : generated;

      if (typeof first === "string") {
        imageUrl = first;
      } else if (first && typeof first === "object") {
        if (first.url) {
          imageUrl = first.url;
        } else if (first.base64 || first.b64) {
          const b64 = first.base64 || first.b64;
          const res = await fetch(`data:image/png;base64,${b64}`);
          const blob = await res.blob();
          const mod = await import("./storageHelpers");
          const result = await mod.uploadImageAndSaveMetadata(blob, "ai-icons", () => {});
          imageUrl = result.url;
        }
      }

      if (!imageUrl) {
        // Fallback/Mock for testing if API fails or format differs
        console.warn("Unexpected API response layout", data);
        if (data.url) imageUrl = data.url;
      }

      if (imageUrl) {
        await addIconStyle({
          name: aiPrompt,
          iconUrl: imageUrl,
          isCustom: true,
        });
        setIsAiModalOpen(false);
        setAiPrompt("");
      } else {
        alert("Could not parse generated icon.");
      }
    } catch (error) {
      console.error(error);
      alert(error?.message || "Failed to generate icon.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCanvas = (type, overrides) => {
    if (onAddWithStyle) {
      onAddWithStyle(type, overrides);
    } else if (onAdd) {
      onAdd(type);
    }
  };

  return (
    <div className="add-elements-panel">
      <div className="panel-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0 }}>Add Elements</h3>
        </div>
        <div className="search-bar">
          <FontAwesomeIcon icon="search" className="search-icon" />
          <input
            type="text"
            placeholder="Search elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="category-nav">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="elements-content">
        {(activeCategory === "All" || activeCategory === "Sections") && (
          <div className="element-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h4>Pre-made Sections</h4>
            </div>
            <div className="elements-grid">
              <div
                className="element-card"
                onClick={() => handleAddToCanvas("preset_hero_banner", {})}
                title="Hero Banner"
              >
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    borderRadius: 12,
                    background: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.35)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <FontAwesomeIcon icon="wand-magic-sparkles" style={{ color: "#ffffff" }} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 8 }}>Hero Banner</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Dark + glow CTA
                </div>
              </div>

              <div
                className="element-card"
                onClick={() => handleAddToCanvas("preset_feature_grid", {})}
                title="Feature Grid"
              >
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                    border: "1px solid rgba(15,23,42,0.10)",
                  }}
                >
                  <FontAwesomeIcon icon="layer-group" style={{ color: "#6366f1" }} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 8 }}>Feature Grid</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  3 icon cards
                </div>
              </div>

              <div
                className="element-card"
                onClick={() => handleAddToCanvas("preset_about_me", {})}
                title="About Me"
              >
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                    border: "1px solid rgba(15,23,42,0.10)",
                  }}
                >
                  <FontAwesomeIcon icon="user-astronaut" style={{ color: "#f97316" }} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 8 }}>About Me</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Profile + bio
                </div>
              </div>

              <div
                className="element-card"
                onClick={() => handleAddToCanvas("preset_testimonials", {})}
                title="Testimonials"
              >
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #0F172A 0%, #1F2937 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.35)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <FontAwesomeIcon icon="quote-left" style={{ color: "#A7F3D0" }} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 8 }}>Testimonials</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Social proof
                </div>
              </div>

              <div
                className="element-card"
                onClick={() => handleAddToCanvas("preset_cta_strip", {})}
                title="CTA Strip"
              >
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    borderRadius: 12,
                    background: "linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 16px 40px rgba(99, 102, 241, 0.35)",
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <FontAwesomeIcon icon="bolt" style={{ color: "#ffffff" }} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 8 }}>CTA Strip</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Banner + button
                </div>
              </div>

              <div
                className="element-card"
                onClick={() => handleAddToCanvas("preset_navbar", {})}
                title="Navigation Bar"
              >
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                    border: "1px solid rgba(15,23,42,0.10)",
                  }}
                >
                  <FontAwesomeIcon icon="compass" style={{ color: "#0F172A" }} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 8 }}>
                  Navigation Bar
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Header links
                </div>
              </div>

              <div
                className="element-card"
                onClick={() => handleAddToCanvas("preset_gallery", {})}
                title="Photo Gallery"
              >
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #ECFEFF 0%, #E0F2FE 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                    border: "1px solid rgba(15,23,42,0.10)",
                  }}
                >
                  <FontAwesomeIcon icon="images" style={{ color: "#0EA5E9" }} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 8 }}>
                  Photo Gallery
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Image grid
                </div>
              </div>

              <div
                className="element-card"
                onClick={() => handleAddToCanvas("preset_footer", {})}
                title="Footer Strip"
              >
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #0F172A 0%, #111827 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.35)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <FontAwesomeIcon icon="shoe-prints" style={{ color: "#ffffff" }} />
                </div>
                <div style={{ fontWeight: 800, marginTop: 8 }}>Footer Strip</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Simple footer
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeCategory === "Icons & Shapes") && (
          <div className="element-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h4>Icons & Shapes</h4>
            </div>
            <div className="elements-grid">
              {ICON_SHAPES_PRESETS.map((item) => (
                <div
                  key={item.id}
                  className="element-card icon-shape-card"
                  onClick={() =>
                    handleAddToCanvas("icon", {
                      icon: item.icon,
                      color: item.color,
                      size: 32,
                    })
                  }
                  title={item.label}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="icon-shape-preview"
                    style={{ color: item.color }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BUTTONS SECTION */}
        {(activeCategory === "All" || activeCategory === "Buttons") && (
          <div className="element-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h4>Buttons</h4>
              <button
                className="section-add-btn"
                onClick={() => openUploadFor("Button")}
              >
                + Add
              </button>
            </div>
            <div className="elements-grid">
              <div
                className="element-card"
                onClick={() =>
                  handleAddToCanvas("button", {
                    label: "Button",
                    backgroundColor: "#0F172A",
                    color: "#ffffff",
                    borderRadius: 8,
                  })
                }
              >
                <div
                  className="preview-button"
                  style={{
                    background: "#0F172A",
                    color: "white",
                    borderRadius: "8px",
                    width: "100%",
                  }}
                >
                  Primary
                </div>
              </div>
              <div
                className="element-card"
                onClick={() =>
                  handleAddToCanvas("button", {
                    label: "Button",
                    backgroundColor: "transparent",
                    color: "#0F172A",
                    border: "2px solid #0F172A",
                    borderRadius: 8,
                  })
                }
              >
                <div
                  className="preview-button"
                  style={{
                    background: "transparent",
                    color: "#0F172A",
                    border: "2px solid #0F172A",
                    borderRadius: "8px",
                    width: "100%",
                  }}
                >
                  Outline
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IMAGES SECTION */}
        {(activeCategory === "All" || activeCategory === "Images") && (
          <div className="element-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h4>Images</h4>
              <button
                className="section-add-btn"
                onClick={() => openUploadFor("Image")}
              >
                + Add
              </button>
            </div>
            <div className="elements-grid">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="element-card"
                  onClick={() => handleAddImage(img)}
                >
                  <div
                    className="preview-image"
                    style={{
                      width: "100%",
                      height: "60px",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEXT SECTION */}
        {(activeCategory === "All" || activeCategory === "Text") && (
          <div className="element-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h4>Typography</h4>
              <button
                className="section-add-btn"
                onClick={() => openUploadFor("Text")}
              >
                + Add
              </button>
            </div>
            <div className="elements-grid">
              <div
                className="element-card"
                onClick={() =>
                  handleAddToCanvas("heading", {
                    fontSize: "48px",
                    fontWeight: "bold",
                    text: "Heading",
                  })
                }
              >
                <span
                  className="preview-text"
                  style={{ fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  Heading
                </span>
              </div>
              <div
                className="element-card"
                onClick={() =>
                  handleAddToCanvas("text", {
                    fontSize: "24px",
                    fontWeight: "normal",
                    text: "Subheading",
                  })
                }
              >
                <span className="preview-text" style={{ fontSize: "1.1rem" }}>
                  Subheading
                </span>
              </div>
              <div
                className="element-card"
                onClick={() =>
                  handleAddToCanvas("text", {
                    fontSize: "16px",
                    fontWeight: "normal",
                    text: "Paragraph text goes here.",
                  })
                }
              >
                <span className="preview-text" style={{ fontSize: "0.9rem" }}>
                  Paragraph
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Fallback for empty search */}
        {searchQuery &&
          filterButtonStyles.length === 0 &&
          filteredText.length === 0 &&
          filteredIcons.length === 0 &&
          filteredImages.length === 0 && (
            <div className="empty-state">
              <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
                No elements found.
              </p>
            </div>
          )}
      </div>

      {/* Simple Inline Modal/Overlay for Create */}
      {isUploadOpen && (
        <div
          className="upload-modal-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            className="upload-modal"
            style={{
              background: "var(--bg-card)",
              padding: "20px",
              borderRadius: "8px",
              width: "250px",
              border: "1px solid var(--border-light)",
            }}
          >
            <h4 style={{ margin: "0 0 16px 0", color: "var(--text-main)" }}>
              Create New {selectedType}
            </h4>
            <form onSubmit={handleCreateElement}>
              <div style={{ marginBottom: "12px", display: "none" }}>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "var(--bg-surface)",
                    color: "white",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <option value="Button">Button</option>
                  <option value="Text">Text Style</option>
                  <option value="Icon">Icon</option>
                  <option value="Image">Image Asset</option>
                </select>
              </div>

              {selectedType !== "Image" && (
                <input
                  type="text"
                  placeholder="Name (e.g. Hero Title)"
                  required
                  value={newElement.name}
                  onChange={(e) =>
                    setNewElement({ ...newElement, name: e.target.value })
                  }
                  style={{ marginBottom: "8px" }}
                />
              )}

              {/* CONDITIONAL FIELDS */}
              {selectedType === "Button" && (
                <>
                  <div
                    style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                  >
                    <input
                      type="color"
                      title="Background"
                      value={newElement.backgroundColor}
                      onChange={(e) =>
                        setNewElement({
                          ...newElement,
                          backgroundColor: e.target.value,
                        })
                      }
                      style={{ height: "40px", padding: 0, flex: 1 }}
                    />
                    <input
                      type="color"
                      title="Text Color"
                      value={newElement.color}
                      onChange={(e) =>
                        setNewElement({ ...newElement, color: e.target.value })
                      }
                      style={{ height: "40px", padding: 0, flex: 1 }}
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Border Radius (px)"
                    value={newElement.borderRadius}
                    onChange={(e) =>
                      setNewElement({
                        ...newElement,
                        borderRadius: e.target.value,
                      })
                    }
                    style={{ marginBottom: "16px" }}
                  />
                </>
              )}

              {selectedType === "Text" && (
                <>
                  <input
                    type="text"
                    placeholder="Font Size (e.g. 2rem)"
                    value={newElement.fontSize}
                    onChange={(e) =>
                      setNewElement({ ...newElement, fontSize: e.target.value })
                    }
                    style={{ marginBottom: "8px" }}
                  />
                  <input
                    type="color"
                    title="Text Color"
                    value={newElement.color}
                    onChange={(e) =>
                      setNewElement({ ...newElement, color: e.target.value })
                    }
                    style={{
                      height: "40px",
                      padding: 0,
                      width: "100%",
                      marginBottom: "8px",
                    }}
                  />
                </>
              )}

              {selectedType === "Icon" && (
                <>
                  <input
                    type="text"
                    placeholder="Icon Name (e.g. star, heart)"
                    value={newElement.icon}
                    onChange={(e) =>
                      setNewElement({ ...newElement, icon: e.target.value })
                    }
                    style={{ marginBottom: "8px" }}
                  />
                  <input
                    type="color"
                    title="Icon Color"
                    value={newElement.color}
                    onChange={(e) =>
                      setNewElement({ ...newElement, color: e.target.value })
                    }
                    style={{
                      height: "40px",
                      padding: 0,
                      width: "100%",
                      marginBottom: "8px",
                    }}
                  />
                </>
              )}

              {selectedType === "Image" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "var(--text-main)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <input
                        type="radio"
                        name="imgMode"
                        checked={imageUploadMode === "url"}
                        onChange={() => setImageUploadMode("url")}
                        style={{ marginRight: "5px" }}
                      />
                      Image URL
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "var(--text-main)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <input
                        type="radio"
                        name="imgMode"
                        checked={imageUploadMode === "file"}
                        onChange={() => setImageUploadMode("file")}
                        style={{ marginRight: "5px" }}
                      />
                      Upload File
                    </label>
                  </div>

                  {imageUploadMode === "url" ? (
                    <input
                      type="text"
                      placeholder="Image URL (https://...)"
                      value={newElement.url}
                      onChange={(e) =>
                        setNewElement({ ...newElement, url: e.target.value })
                      }
                      style={{ marginBottom: "8px" }}
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file);
                        if (file && !newElement.name) {
                          const inferred = file.name.replace(/\.[^/.]+$/, "").trim();
                          if (inferred) {
                            setNewElement((prev) => ({ ...prev, name: inferred }));
                          }
                        }
                      }}
                      style={{ marginBottom: "8px", color: "var(--text-main)" }}
                    />
                  )}
                </>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-muted)",
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAiModalOpen && (
        <div
          className="upload-modal-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
          }}
        >
          <div
            className="upload-modal"
            style={{
              background: "var(--bg-card)",
              padding: "20px",
              borderRadius: "8px",
              width: "300px",
              border: "1px solid var(--border-light)",
            }}
          >
            <h4 style={{ margin: "0 0 16px 0", color: "var(--text-main)" }}>
              Generate AI Icon
            </h4>
            <form onSubmit={handleGenerateIcon}>
              <input
                type="text"
                placeholder="Describe icon (e.g. blue rocket)"
                required
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                style={{ marginBottom: "12px", width: "100%", padding: "8px" }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-muted)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  style={{ background: "var(--accent-color)" }}
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isCropModalOpen && cropSource && (
        <ImageCropModal
          image={cropSource}
          onConfirm={handleCropCompleteUpload}
          onCancel={cancelCrop}
        />
      )}
    </div>
  );
};

export default AddElementsPanel;
