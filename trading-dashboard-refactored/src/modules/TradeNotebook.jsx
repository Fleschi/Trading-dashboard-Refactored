import { useState, useEffect, useRef } from "react";
import {
  loadNotebookEntries, saveNotebookEntry, updateNotebookEntry,
  deleteNotebookEntry, uploadNotebookScreenshot,
} from "../utils/supabase";

function SelBtn({ label, active, color, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "6px 16px", borderRadius: 8,
      border: `1px solid ${active ? color : "transparent"}`,
      background: active ? `${color}18` : "transparent",
      color: active ? color : "#525252",
      fontSize: 13, cursor: "pointer", fontWeight: active ? 600 : 400,
      transition: "all 0.15s",
    }}>{label}</button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 11, color: "#525252", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, style = {}, placeholder, D }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} style={{
      background: D.bg, border: `1px solid ${D.border}`,
      borderRadius: 8, color: D.text, padding: "8px 12px",
      fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", ...style,
    }} />
  );
}

function Textarea({ value, onChange, D }) {
  return (
    <textarea value={value} onChange={onChange} rows={4} style={{
      background: D.bg, border: `1px solid ${D.border}`,
      borderRadius: 8, color: D.text, padding: "8px 12px",
      fontSize: 13, outline: "none", resize: "vertical",
      width: "100%", boxSizing: "border-box",
    }} />
  );
}

function AttachButton({ label, file, onFile, onClear, D, uploading }) {
  const ref = useRef();
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {!preview ? (
        <button type="button" onClick={() => ref.current.click()} style={{
          padding: "7px 16px", borderRadius: 8, border: `1px solid ${D.border}`,
          background: "transparent", color: D.textMuted, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, width: "fit-content",
        }}>
          <span style={{ fontSize: 14 }}>📎</span> {label}
        </button>
      ) : (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img src={preview} alt={label} style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, border: `1px solid ${D.border}`, display: "block", cursor: "pointer", objectFit: "contain" }} onClick={() => window.open(preview, "_blank")} />
          <button type="button" onClick={onClear} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.75)", border: "none", borderRadius: "50%", width: 24, height: 24, color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      )}
      {uploading && <span style={{ fontSize: 11, color: D.textMuted }}>Uploading…</span>}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

function EntryCard({ entry, D, onDelete, onEdit }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const typeColor = entry.type === "Continuation" ? D.green : D.yellow;
  const htfColor  = entry.along_htf === "Yes" ? D.green : D.red;

  return (
    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", cursor: "pointer", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: D.textMuted, fontFamily: "monospace" }}>{entry.time_entered}</span>
        {entry.type && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 6, background: `${typeColor}18`, color: typeColor }}>{entry.type}</span>
        )}
        {entry.along_htf && (
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: `${htfColor}12`, color: htfColor, fontWeight: 600 }}>HTF {entry.along_htf}</span>
        )}
        {entry.key_takeaway && (
          <span style={{ fontSize: 12, color: D.textMuted, fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.key_takeaway}</span>
        )}
        <span style={{ marginLeft: "auto", color: D.textMuted, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${D.border}`, padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {(entry.screenshot_htf_url || entry.screenshot_exec_url) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {entry.screenshot_htf_url && (
                <div>
                  <div style={{ fontSize: 10, color: D.textMuted, marginBottom: 6 }}>Daily Bias</div>
                  <img src={entry.screenshot_htf_url} alt="HTF" style={{ width: "100%", borderRadius: 8, border: `1px solid ${D.border}`, cursor: "pointer" }} onClick={() => window.open(entry.screenshot_htf_url, "_blank")} />
                </div>
              )}
              {entry.screenshot_exec_url && (
                <div>
                  <div style={{ fontSize: 10, color: D.textMuted, marginBottom: 6 }}>Execution</div>
                  <img src={entry.screenshot_exec_url} alt="Exec" style={{ width: "100%", borderRadius: 8, border: `1px solid ${D.border}`, cursor: "pointer" }} onClick={() => window.open(entry.screenshot_exec_url, "_blank")} />
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {entry.went_good && (
              <div>
                <div style={{ fontSize: 10, color: D.green, marginBottom: 6 }}>What went well</div>
                <div style={{ fontSize: 13, color: D.text, whiteSpace: "pre-wrap" }}>{entry.went_good}</div>
              </div>
            )}
            {entry.went_wrong && (
              <div>
                <div style={{ fontSize: 10, color: D.red, marginBottom: 6 }}>What went wrong</div>
                <div style={{ fontSize: 13, color: D.text, whiteSpace: "pre-wrap" }}>{entry.went_wrong}</div>
              </div>
            )}
          </div>

          {entry.key_takeaway && (
            <div style={{ background: `${D.border}40`, border: `1px solid ${D.border}`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 10, color: D.textMuted, marginBottom: 4 }}>Key Takeaway</div>
              <div style={{ fontSize: 13, color: D.text }}>{entry.key_takeaway}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onEdit(entry)} style={{ background: "transparent", border: `1px solid ${D.border}`, borderRadius: 6, color: D.text, cursor: "pointer", fontSize: 12, padding: "4px 12px" }}>Edit</button>
            <button onClick={async () => { setDeleting(true); await onDelete(entry.id); }} disabled={deleting} style={{ background: "transparent", border: `1px solid ${D.border}`, borderRadius: 6, color: D.red, cursor: "pointer", fontSize: 12, padding: "4px 12px", opacity: deleting ? 0.5 : 1 }}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyForm = () => ({ datetime: "", type: "", alongHTF: "", wentGood: "", wentWrong: "", keyTakeaway: "", fileHTF: null, fileExec: null });

export default function TradeNotebook({ design }) {
  const D = design;
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingHTF, setUploadingHTF] = useState(false);
  const [uploadingExec, setUploadingExec] = useState(false);
  const [error, setError] = useState(null);

  const startEdit = (entry) => {
    setForm({ datetime: entry.time_entered || "", type: entry.type || "", alongHTF: entry.along_htf || "", wentGood: entry.went_good || "", wentWrong: entry.went_wrong || "", keyTakeaway: entry.key_takeaway || "", fileHTF: null, fileExec: null });
    setEditingId(entry.id);
    setShowForm(true);
  };

  useEffect(() => {
    loadNotebookEntries().then(data => { setEntries(data); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleDatetime = (e) => {
    let raw = e.target.value.replace(/[^\d]/g, "");
    let out = "";
    if (raw.length > 0) out = raw.slice(0, 2);
    if (raw.length > 2) out += "/" + raw.slice(2, 4);
    if (raw.length > 4) out += "/" + raw.slice(4, 6);
    if (raw.length > 6) out += " " + raw.slice(6, 8);
    if (raw.length > 8) out += ":" + raw.slice(8, 10);
    set("datetime", out);
  };

  const submit = async () => {
    if (!form.datetime) return;
    setSaving(true); setError(null);
    try {
      let screenshotHTFUrl = null, screenshotExecUrl = null;
      if (form.fileHTF) { setUploadingHTF(true); screenshotHTFUrl = await uploadNotebookScreenshot(form.fileHTF, "htf"); setUploadingHTF(false); }
      if (form.fileExec) { setUploadingExec(true); screenshotExecUrl = await uploadNotebookScreenshot(form.fileExec, "exec"); setUploadingExec(false); }
      const payload = { time_entered: form.datetime, type: form.type, along_htf: form.alongHTF, went_good: form.wentGood, went_wrong: form.wentWrong, key_takeaway: form.keyTakeaway, screenshot_htf_url: screenshotHTFUrl, screenshot_exec_url: screenshotExecUrl };
      if (editingId) {
        const updated = await updateNotebookEntry(editingId, payload);
        setEntries(prev => prev.map(e => e.id === editingId ? updated : e));
      } else {
        const saved = await saveNotebookEntry(payload);
        setEntries(prev => [saved, ...prev]);
      }
      setForm(emptyForm()); setEditingId(null); setShowForm(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); setUploadingHTF(false); setUploadingExec(false); }
  };

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: D.textMuted, fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, color: D.textMuted }}>{entries.length} entries</div>
        <button onClick={() => { setShowForm(s => !s); setError(null); }} style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${D.border}`, background: "transparent", color: showForm ? D.textMuted : D.text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {showForm ? "Cancel" : "+ New Entry"}
        </button>
      </div>

      {error && <div style={{ background: `${D.red}12`, border: `1px solid ${D.red}30`, borderRadius: 10, padding: "10px 16px", fontSize: 12, color: D.red }}>{error}</div>}

      {showForm && (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="Date & Time">
            <TextInput value={form.datetime} onChange={handleDatetime} D={D} placeholder="DD/MM/YY HH:MM" style={{ maxWidth: 180, fontFamily: "monospace" }} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Type">
              <div style={{ display: "flex", gap: 8 }}>
                {["Continuation", "Reversal"].map(t => (
                  <SelBtn key={t} label={t} active={form.type === t} color={t === "Continuation" ? D.green : D.yellow} onClick={() => set("type", t)} />
                ))}
              </div>
            </Field>
            <Field label="Along HTF">
              <div style={{ display: "flex", gap: 8 }}>
                {["Yes", "No"].map(t => (
                  <SelBtn key={t} label={t} active={form.alongHTF === t} color={t === "Yes" ? D.green : D.red} onClick={() => set("alongHTF", t)} />
                ))}
              </div>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Daily Bias"><AttachButton label="Attach screenshot" file={form.fileHTF} onFile={f => set("fileHTF", f)} onClear={() => set("fileHTF", null)} uploading={uploadingHTF} D={D} /></Field>
            <Field label="Execution"><AttachButton label="Attach screenshot" file={form.fileExec} onFile={f => set("fileExec", f)} onClear={() => set("fileExec", null)} uploading={uploadingExec} D={D} /></Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="What went well"><Textarea value={form.wentGood} onChange={e => set("wentGood", e.target.value)} D={D} /></Field>
            <Field label="What went wrong"><Textarea value={form.wentWrong} onChange={e => set("wentWrong", e.target.value)} D={D} /></Field>
          </div>

          <Field label="Key Takeaway"><Textarea value={form.keyTakeaway} onChange={e => set("keyTakeaway", e.target.value)} D={D} /></Field>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={submit} disabled={!form.datetime || saving} style={{ padding: "10px 28px", borderRadius: 10, border: `1px solid ${D.border}`, background: form.datetime && !saving ? D.text : "transparent", color: form.datetime && !saving ? D.bg : D.textMuted, fontSize: 14, fontWeight: 600, cursor: form.datetime && !saving ? "pointer" : "default" }}>
              {saving ? "Saving…" : "Save Entry"}
            </button>
            {saving && <span style={{ fontSize: 12, color: D.textMuted }}>{uploadingHTF ? "Uploading HTF…" : uploadingExec ? "Uploading execution…" : "Saving…"}</span>}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: 32, textAlign: "center", color: D.textMuted, fontSize: 13 }}>No entries yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map(e => (
          <EntryCard key={e.id} entry={e} D={D} onEdit={startEdit} onDelete={async (id) => {
            try { await deleteNotebookEntry(id); setEntries(prev => prev.filter(x => x.id !== id)); }
            catch (e) { setError(e.message); }
          }} />
        ))}
      </div>
    </div>
  );
}