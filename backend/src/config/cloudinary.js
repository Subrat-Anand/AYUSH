// ============================================================================
//  CLOUDINARY CONFIG — real, persistent storage for patient-uploaded
//  documents (reports, prescriptions, scans, photos).
//
//  Mirrors config/gemini.js on purpose: nothing else in the codebase needs
//  to change once you paste real credentials into backend/.env. Until then,
//  isCloudinaryConfigured stays false and routes/uploads.js tells the
//  frontend to fall back to storing a local base64 preview instead, so the
//  app never breaks — it just won't have real, shareable file URLs yet.
// ============================================================================
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

export default cloudinary;
