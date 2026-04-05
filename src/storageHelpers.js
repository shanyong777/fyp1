import { storage, db, auth } from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

async function optimizeImageBlob(file, maxDim = 1600, quality = 0.8) {
  // If not an image, return original file as blob
  if (!file.type || !file.type.startsWith("image/")) {
    return { blob: file, type: file.type || "application/octet-stream" };
  }

  // Use createImageBitmap when available for better performance
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (err) {
    // Fallback: load via Image
    const dataUrl = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    bitmap = await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        try {
          res(img);
        } catch (e) {
          rej(e);
        }
      };
      img.onerror = rej;
      img.src = dataUrl;
    });
  }

  const width = bitmap.width || bitmap.naturalWidth || file.width || 0;
  const height = bitmap.height || bitmap.naturalHeight || file.height || 0;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const outW = Math.max(1, Math.round(width * scale));
  const outH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  // Draw bitmap or image element
  if (bitmap instanceof Image || bitmap instanceof HTMLImageElement) {
    ctx.drawImage(bitmap, 0, 0, outW, outH);
  } else {
    ctx.drawImage(bitmap, 0, 0, outW, outH);
    // Close ImageBitmap when supported
    if (bitmap.close)
      try {
        bitmap.close();
      } catch (e) {}
  }

  // Prefer WebP for smaller size when available, fallback to jpeg
  const preferType = "image/webp";
  const shouldUseWebP =
    canvas.toDataURL(preferType).indexOf("data:image/webp") === 0;
  const outType = shouldUseWebP
    ? preferType
    : file.type === "image/png"
      ? "image/png"
      : "image/jpeg";

  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), outType, quality);
  });

  if (!blob) {
    console.warn("Canvas toBlob failed, using original file");
    return { blob: file, type: file.type };
  }

  return { blob, type: blob.type };
}

// Uploads a file (image optimized) to Firebase Storage and writes metadata to Firestore.
// onProgress (optional) is called with percentage (0-100) updates.
export async function uploadImageAndSaveMetadata(
  file,
  folder = "images",
  onProgress,
) {
  if (!file) throw new Error("No file provided");

  // Optimize image client-side to reduce upload size and time
  const { blob, type } = await optimizeImageBlob(file, 1600, 0.8);

  // Use a short random id rather than original filename
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const ext =
    type && type.split("/")[1]
      ? type.split("/")[1].replace("jpeg", "jpg")
      : "bin";
  const path = `${folder}/${id}.${ext}`;

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, blob, {
    contentType: type,
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes) {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          );
          try {
            onProgress(percent);
          } catch (e) {}
        }
      },
      (error) => {
        console.error("Firebase Storage Upload Error:", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File uploaded successfully, download URL:", url);
          
          let docId = null;
          try {
            const user = auth.currentUser;
            const docRef = await addDoc(collection(db, "images"), {
              // intentionally not saving original file name per request
              path,
              url,
              size: blob.size,
              contentType: type,
              userId: user ? user.uid : "anonymous",
              createdAt: serverTimestamp(),
            });
            docId = docRef.id;
            console.log("Metadata saved to Firestore, docId:", docId);
          } catch (firestoreErr) {
            console.warn("Firestore metadata save failed, continuing with URL only:", firestoreErr);
            // Don't reject if Firestore fails, as long as storage worked
          }

          resolve({ url, path, docId });
        } catch (err) {
          console.error("Error finalizing upload:", err);
          reject(err);
        }
      },
    );
  });
}
