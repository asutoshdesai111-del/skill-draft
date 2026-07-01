import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getToken } from "@/lib/auth";
import { UploadCloud, FileText, X, AlertCircle, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const IMPORT_SESSION_KEY = "skilldraft_pending_import";

function isAcceptedFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function apiBase(): string {
  return import.meta.env.DEV ? "http://localhost:8080" : "";
}

// Uses XMLHttpRequest (not fetch) specifically because it's the only way to
// get real upload progress events in the browser.
function uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.addEventListener("load", () => {
      let body: unknown = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON response */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
      } else {
        const message = (body as { error?: string } | null)?.error || `Upload failed (${xhr.status})`;
        reject(new Error(message));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload. Please check your connection and try again.")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled.")));

    xhr.open("POST", `${apiBase()}/api/resumes/import`);
    const token = getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(form);
  });
}

export function saveImportToSession(data: unknown): void {
  sessionStorage.setItem(IMPORT_SESSION_KEY, JSON.stringify(data));
}

export function readImportFromSession(): unknown | null {
  const raw = sessionStorage.getItem(IMPORT_SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearImportSession(): void {
  sessionStorage.removeItem(IMPORT_SESSION_KEY);
}

export default function ResumeUploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setError(null);
  };

  const handleClose = (next: boolean) => {
    if (!uploading) {
      reset();
      onOpenChange(next);
    }
  };

  const validateAndSetFile = (candidate: File) => {
    setError(null);
    if (!isAcceptedFile(candidate)) {
      setError("Unsupported file type. Please upload a PDF, DOC, or DOCX file.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError(`File is too large (${formatSize(candidate.size)}). Maximum size is 5MB.`);
      return;
    }
    setFile(candidate);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const data = await uploadWithProgress(file, setProgress);
      saveImportToSession(data);
      reset();
      onOpenChange(false);
      setLocation("/import-review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while processing your file. Please try again.");
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Resume</DialogTitle>
          <DialogDescription>
            Upload an existing resume (PDF, DOC, or DOCX, max 5MB) and we'll automatically pre-fill your details — you'll get a chance to review and fix anything before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              data-testid="dropzone-resume-upload"
            >
              <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drag & drop your resume here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse · PDF, DOC, DOCX up to 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                data-testid="input-resume-file"
                onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); }}
              />
            </div>
          ) : (
            <div className="border rounded-lg p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                {uploading && <Progress value={progress} className="h-1.5 mt-2" data-testid="progress-upload" />}
              </div>
              {!uploading && (
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setFile(null)} data-testid="button-remove-file">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" data-testid="alert-upload-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={uploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploading} data-testid="button-upload-resume">
            {uploading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing... {progress}%</>
              : "Upload & Extract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
