import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  FilePlus2,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
  FolderHeart,
  Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { BODY_PARTS, bodyPartMeta, formatWhen } from "../lib/constants";
import { uploadDocument } from "../lib/uploadService";

const MAX_SIZE_KB = 8000;

export default function RecordsTab() {
  const { patient, addFile, deleteFile, addHistory, deleteHistory } = useAuth();
  const fileInputRef = useRef(null);
  const [pendingBodyPart, setPendingBodyPart] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadingId, setUploadingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [historyForm, setHistoryForm] = useState({ condition: "", date: "", notes: "" });

  function triggerUpload(bodyPart) {
    setPendingBodyPart(bodyPart);
    setUploadError("");
    fileInputRef.current?.click();
  }

  async function processFile(file, bodyPart) {
    const sizeKB = Math.round(file.size / 1024);
    if (sizeKB > MAX_SIZE_KB) {
      setUploadError(
        `"${file.name}" is too large (${sizeKB} KB). Please keep uploads under ${MAX_SIZE_KB} KB.`
      );
      return;
    }
    setUploadError("");
    const uploadId = crypto.randomUUID();
    setUploadingId(uploadId);
    try {
      // Uploads the real file (any type — image, PDF, report) to
      // Cloudinary via the backend and gets back a real, shareable URL.
      // This is what makes a document show up for the doctor in real
      // time: previously only a base64 image preview was kept, and
      // non-image files (PDFs, reports) had no viewable content saved at
      // all, plus large base64 payloads could silently fail to reach the
      // server. Now every file type is stored properly and only a small
      // URL is saved on the patient record.
      const isImage = file.type.startsWith("image/");
      const uploaded = await uploadDocument(file);
      addFile({
        id: uploadId,
        name: file.name,
        bodyPart,
        sizeKB: uploaded.sizeKB ?? sizeKB,
        uploadedAt: new Date().toISOString(),
        url: uploaded.url,
        preview: isImage ? uploaded.url : null,
        isImage,
        local: uploaded.local,
      });
      toast.success(
        uploaded.local
          ? `Added "${file.name}" — saved locally only (Cloudinary isn't configured on the server yet).`
          : `Added "${file.name}" to ${bodyPartMeta(bodyPart).label}`
      );
    } catch (err) {
      toast.error(`Couldn't upload "${file.name}" — please try again.`);
    } finally {
      setUploadingId((cur) => (cur === uploadId ? null : cur));
    }
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingBodyPart) return;
    processFile(file, pendingBodyPart);
  }

  function handleDrop(e, bodyPart) {
    e.preventDefault();
    setDragOverId(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file, bodyPart);
  }

  function handleAddHistory() {
    if (!historyForm.condition.trim()) {
      toast.error("Add a condition or event first.");
      return;
    }
    addHistory({
      id: crypto.randomUUID(),
      condition: historyForm.condition.trim(),
      date: historyForm.date || new Date().toISOString().slice(0, 10),
      notes: historyForm.notes.trim(),
    });
    setHistoryForm({ condition: "", date: "", notes: "" });
    setShowHistoryForm(false);
  }

  function confirmDeleteFile(f) {
    if (window.confirm(`Remove "${f.name}" from your records? This can't be undone.`)) {
      deleteFile(f.id);
    }
  }

  function confirmDeleteHistory(h) {
    if (window.confirm(`Remove "${h.condition}" from your history? This can't be undone.`)) {
      deleteHistory(h.id);
    }
  }

  const docCount = patient.files.length;
  const historyCount = patient.history.length;

  return (
    <div className="flex flex-col gap-9">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} />

      {/* Friendly intro banner explaining the page at a glance */}
      <div className="a-card-soft p-5 flex items-start gap-4 bg-sage/40 border-sage">
        <span className="bg-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <FolderHeart size={19} color="#1F5C4A" />
        </span>
        <div>
          <div className="font-serif text-[17px]">This is your personal health folder</div>
          <p className="text-[13.5px] text-muted mt-1 leading-relaxed max-w-[560px]">
            Two things to do here: <strong>upload documents</strong> under the body part they
            relate to, and <strong>log anything worth remembering</strong> — a diagnosis, a
            surgery, an ongoing condition. Your doctor sees only what you save here.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <span className="chip">
              <FileText size={12} /> {docCount} document{docCount === 1 ? "" : "s"}
            </span>
            <span className="chip">
              <Plus size={12} /> {historyCount} history entr{historyCount === 1 ? "y" : "ies"}
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1 — Upload */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <span className="step-badge">1</span>
          <div className="font-semibold text-[15px]">Upload a document</div>
        </div>
        <p className="text-[13px] text-faint ml-8 mb-3.5">
          Tap the category that matches your file — or drag a file straight onto it.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BODY_PARTS.map((bp) => (
            <div
              key={bp.id}
              className={`tile p-[16px_12px] text-center relative ${
                dragOverId === bp.id ? "tile-drop-active" : ""
              }`}
              onClick={() => triggerUpload(bp.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(bp.id);
              }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(e, bp.id)}
              title={`Upload to ${bp.label}`}
            >
              <div className="flex justify-center">
                <span className="bg-sage w-10 h-10 rounded-full flex items-center justify-center">
                  <bp.icon size={18} color="#1F5C4A" />
                </span>
              </div>
              <div className="text-[12.5px] mt-2.5 font-medium leading-tight">{bp.label}</div>
              <div className="text-[10.5px] text-faint mt-1 leading-tight">{bp.hint}</div>
              <span className="absolute top-2 right-2 text-[#9AA69D]">
                <Upload size={13} />
              </span>
            </div>
          ))}
        </div>
        {uploadError && (
          <div className="flex items-center gap-2 text-coral text-[13.5px] mt-3">
            <AlertCircle size={15} /> {uploadError}
          </div>
        )}
        {uploadingId && (
          <div className="flex items-center gap-2 text-muted text-[13.5px] mt-3">
            <Upload size={14} className="animate-pulse" /> Uploading…
          </div>
        )}

        <div className="mt-5">
          {docCount === 0 ? (
            <div className="empty-state p-8">
              <FilePlus2 size={22} className="mx-auto text-faint" />
              <div className="text-[13.5px] text-muted mt-2 font-medium">
                No documents yet
              </div>
              <div className="text-[12.5px] text-faint mt-1">
                Tap any category above to add your first one — a report, prescription, or scan.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patient.files.map((f) => {
                const meta = bodyPartMeta(f.bodyPart);
                return (
                  <div key={f.id} className="a-card-soft flex items-center gap-3 p-3.5 group">
                    <a
                      href={f.url || f.preview || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={f.url || f.preview ? "Open document" : undefined}
                    >
                      {f.preview ? (
                        <img src={f.preview} alt={f.name} className="w-11 h-11 object-cover rounded-md shrink-0" />
                      ) : (
                        <span className="bg-sage w-11 h-11 rounded-md flex items-center justify-center shrink-0">
                          <meta.icon size={18} color="#1F5C4A" />
                        </span>
                      )}
                    </a>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {f.url || f.preview ? (
                          <a href={f.url || f.preview} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {f.name}
                          </a>
                        ) : (
                          f.name
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="chip">
                          <meta.icon size={11} /> {meta.label}
                        </span>
                        <span className="text-[11.5px] text-faint">
                          {f.sizeKB} KB · {formatWhen(f.uploadedAt)}
                        </span>
                        {f.local && (
                          <span className="text-[11px] text-coral" title="Cloudinary isn't configured yet — this file only lives in this browser.">
                            Local only
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => confirmDeleteFile(f)} className="icon-btn-danger" title="Remove document">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* STEP 2 — Medical history */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <span className="step-badge">2</span>
          <div className="font-semibold text-[15px]">Log your medical history</div>
        </div>
        <p className="text-[13px] text-faint ml-8 mb-3.5">
          Add anything a doctor should know — past or ongoing conditions, surgeries, or diagnoses.
        </p>

        <div className="ml-8">
          {!showHistoryForm ? (
            <button className="btn btn-outline" onClick={() => setShowHistoryForm(true)}>
              <Plus size={15} /> Add a history entry
            </button>
          ) : (
            <div className="a-card-soft flex flex-col gap-4 p-5 mb-5 max-w-[560px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] text-muted">
                  <Info size={14} /> Keep it brief — you can always add another entry later.
                </div>
                <button
                  className="bg-none border-none cursor-pointer text-faint"
                  onClick={() => setShowHistoryForm(false)}
                  title="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-[2]">
                  <label className="a-label">Condition / event</label>
                  <input
                    className="a-input"
                    placeholder="e.g. Seasonal allergies"
                    autoFocus
                    value={historyForm.condition}
                    onChange={(e) => setHistoryForm({ ...historyForm, condition: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleAddHistory()}
                  />
                </div>
                <div className="flex-1">
                  <label className="a-label">Date</label>
                  <input
                    className="a-input"
                    type="date"
                    value={historyForm.date}
                    onChange={(e) => setHistoryForm({ ...historyForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="a-label">Notes (optional)</label>
                <input
                  className="a-input"
                  placeholder="Any detail worth remembering"
                  value={historyForm.notes}
                  onChange={(e) => setHistoryForm({ ...historyForm, notes: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddHistory()}
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="btn btn-primary" onClick={handleAddHistory}>
                  <Plus size={15} /> Save entry
                </button>
                <button className="btn btn-outline" onClick={() => setShowHistoryForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-5">
            {historyCount === 0 ? (
              <div className="empty-state p-8 max-w-[560px]">
                <FileText size={22} className="mx-auto text-faint" />
                <div className="text-[13.5px] text-muted mt-2 font-medium">
                  Nothing logged yet
                </div>
                <div className="text-[12.5px] text-faint mt-1">
                  Use "Add a history entry" above to note down a condition or past event.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-[560px]">
                {patient.history.map((h) => (
                  <div key={h.id} className="a-card-soft flex items-start gap-3 p-4 border-l-[3px] border-l-marigold group">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[14.5px]">{h.condition}</span>
                        <span className="text-xs text-faint">{formatWhen(h.date)}</span>
                      </div>
                      {h.notes && <div className="text-[13px] text-muted mt-1">{h.notes}</div>}
                    </div>
                    <button onClick={() => confirmDeleteHistory(h)} className="icon-btn-danger" title="Remove entry">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
