import { Router } from "express";
import multer from "multer";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const router = Router();

// Memory storage — the file never touches disk, we just hand the buffer
// straight to Cloudinary. 8MB is comfortably above a typical phone photo
// or scanned PDF report.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// POST /api/uploads
// multipart/form-data, field name "file".
// Reply: { url, publicId, resourceType, name, sizeKB }
//
// This is what makes documents/photos a patient uploads in RecordsTab
// actually show up for the doctor: instead of embedding a giant base64
// string in the patient record (which used to silently blow past the
// PATCH /api/patients body-size limit once a couple of files piled up —
// the doctor would just never receive that update), we upload the real
// file to Cloudinary here and store only the small resulting URL.
router.post("/", (req, res) => {
  if (!isCloudinaryConfigured) {
    return res.status(503).json({
      error: "Cloudinary isn't configured on the server yet.",
      cloudinaryConfigured: false,
    });
  }

  upload.single("file")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "File is too large — please keep uploads under 8MB." : err.message;
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file was attached to the request." });
    }

    // "auto" lets Cloudinary route images to its image pipeline (so we get
    // thumbnails/previews for free) and everything else (PDFs, docs) to its
    // raw file pipeline, so any document type a patient attaches is stored
    // and stays openable by the doctor.
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "ayush-patient-documents",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload failed:", error.message);
          return res.status(502).json({ error: "Could not upload the file right now. Please try again." });
        }
        res.json({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          name: req.file.originalname,
          sizeKB: Math.round(req.file.size / 1024),
        });
      }
    );
    uploadStream.end(req.file.buffer);
  });
});

export default router;
