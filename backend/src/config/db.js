import mongoose from "mongoose";

let connected = false;

// Common copy-paste mistakes that turn a valid Atlas URI into one that
// fails DNS SRV resolution: surrounding quotes, and stray whitespace
// inside the string (not just at the ends).
function sanitizeUri(raw) {
  return raw.trim().replace(/^["']|["']$/g, "").replace(/\s+/g, "");
}

export async function connectDB() {
  const rawUri = process.env.MONGODB_URI?.trim();

  if (!rawUri) {
    console.warn(
      "MONGODB_URI not set in backend/.env — running on the in-memory demo store.\n" +
        "  Patient data will work fully but won't survive a server restart.\n" +
        "  Add your MongoDB Atlas connection string to backend/.env to persist it."
    );
    return false;
  }

  const uri = sanitizeUri(rawUri);

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    connected = true;

    mongoose.connection.on("disconnected", () => {
      connected = false;
      console.warn("MongoDB disconnected — falling back to the in-memory store until it reconnects.");
    });
    mongoose.connection.on("reconnected", () => {
      connected = true;
      console.log("MongoDB reconnected.");
    });

    return true;
  } catch (err) {
    connected = false;

    if (/does not share hostname with parent URI|querySrv|ENOTFOUND|ETIMEOUT/i.test(err.message) && uri.startsWith("mongodb+srv://")) {
      console.error(
        "MongoDB Atlas connection failed — continuing on the in-memory store so the app keeps working.\n" +
          "  Reason: " + err.message + "\n\n" +
          "  This is almost always a DNS problem with the mongodb+srv:// format, not a code bug —\n" +
          "  common on college/office WiFi, VPNs, or some ISPs that mangle SRV DNS lookups.\n" +
          "  Two ways to fix it:\n" +
          "   1) Try a different network, or switch your DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare).\n" +
          "   2) In Atlas: Database -> Connect -> Drivers -> \"View full driver example\" ->\n" +
          "      look for the standard (non-SRV) connection string option, or use the legacy\n" +
          "      \"Node.js 2.2.12 or earlier\" driver choice, which gives a mongodb://host1,host2,host3/...\n" +
          "      string instead of mongodb+srv://. Paste that into MONGODB_URI instead — it does the\n" +
          "      same DNS lookup once, up front, so it can't fail this way at connect time.\n" +
          "  Meanwhile the app is fully working on the in-memory store — nothing is broken for a demo."
      );
    } else {
      console.error(
        "MongoDB Atlas connection failed — continuing on the in-memory store so the app keeps working.\n" +
          "  Reason:",
        err.message
      );
    }
    return false;
  }
}

// The single source of truth the rest of the backend checks before deciding
// whether to talk to Mongo or to the in-memory fallback for a given request.
export function dbReady() {
  return connected && mongoose.connection.readyState === 1;
}
