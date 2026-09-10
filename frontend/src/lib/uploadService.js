import axiosClient from "./axiosClient";

/**
 * Uploads a document/photo to the backend, which stores it on Cloudinary
 * and hands back a real, shareable URL.
 *
 * Expected backend contract — POST {VITE_API_BASE_URL}/api/uploads
 * (multipart/form-data, field name "file")
 * reply: { url, publicId, resourceType, name, sizeKB }
 *
 * Falls back to a local, in-browser base64 preview if Cloudinary isn't
 * configured on the server yet (503) or the backend can't be reached at
 * all, so uploading still "works" for the patient during setup — it just
 * won't be visible to a doctor on another device until real credentials
 * are added (see backend/.env.example).
 */
export async function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file);

  try {
    // axiosClient defaults to "Content-Type: application/json" for every
    // request — explicitly clearing it here (rather than setting
    // "multipart/form-data" ourselves) lets the browser generate the
    // correct multipart boundary for this FormData body. Skipping this
    // would send JSON headers with a multipart body and the upload would
    // fail to parse on the server.
    const { data } = await axiosClient.post("/api/uploads", form, {
      headers: { "Content-Type": undefined },
    });
    return {
      url: data.url,
      publicId: data.publicId,
      resourceType: data.resourceType,
      sizeKB: data.sizeKB,
      local: false,
    };
  } catch (err) {
    console.warn("Cloudinary upload unavailable, falling back to a local preview:", err?.message);
    const dataUrl = await readAsDataUrl(file);
    return {
      url: dataUrl,
      publicId: null,
      resourceType: file.type.startsWith("image/") ? "image" : "raw",
      sizeKB: Math.round(file.size / 1024),
      local: true,
    };
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
