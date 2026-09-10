import mongoose from "mongoose";

const { Schema } = mongoose;

// Mixed is used for the nested collections on purpose: this schema mirrors
// whatever shape the frontend already builds for files/history/reminders/
// consultations/intake (see frontend/src/context/AuthContext.jsx), so the
// backend never has to be kept in lockstep with every small UI field change.
const PatientSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    age: Number,
    dob: String,
    gender: String,
    language: { type: String, default: "English" },
    files: { type: [Schema.Types.Mixed], default: [] },
    history: { type: [Schema.Types.Mixed], default: [] },
    reminders: { type: [Schema.Types.Mixed], default: [] },
    consultations: { type: [Schema.Types.Mixed], default: [] },
    intake: { type: Schema.Types.Mixed, default: null },
    intakeHistory: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

export default mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
