import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Check,
  FileText,
  FolderOpen,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useCheckStorageLimit,
  useGetUserAnalytics,
  useListUserFolders,
  useListUserTags,
  useUploadDocument,
} from "../hooks/useQueries";
import CryptoPaymentModal from "./CryptoPaymentModal";
import { tagColorClass } from "./DocumentList";

interface UploadDocumentProps {
  onSuccess?: () => void;
}

export default function UploadDocument({ onSuccess }: UploadDocumentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [requiredStorageBytes, setRequiredStorageBytes] = useState<bigint>(0n);
  const [pendingUpload, setPendingUpload] = useState<{
    filename: string;
    fileSize: bigint;
    accessCode: string;
    encryptionKey: string;
    blob: ExternalBlob;
    mimeType: string;
    folders: string[];
    tags: string[];
  } | null>(null);

  // Folder / tag state
  const [folderInput, setFolderInput] = useState("");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const uploadDocument = useUploadDocument();
  const checkStorageLimit = useCheckStorageLimit();
  const { data: userAnalytics } = useGetUserAnalytics();
  const { data: existingFolders = [] } = useListUserFolders();
  const { data: existingTags = [] } = useListUserTags();

  const addFolder = (val: string) => {
    const v = val.trim();
    if (v && !selectedFolders.includes(v)) setSelectedFolders((p) => [...p, v]);
    setFolderInput("");
  };

  const addTag = (val: string) => {
    const v = val.trim();
    if (v && !selectedTags.includes(v)) setSelectedTags((p) => [...p, v]);
    setTagInput("");
  };

  const generateAccessCode = () =>
    Math.floor(100000 + Math.random() * 900000).toString();
  const generateEncryptionKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  };

  const getMimeType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const map: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      txt: "text/plain",
      csv: "text/csv",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      zip: "application/zip",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
    };
    return map[ext] || "application/octet-stream";
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (!customFilename) setCustomFilename(selectedFile.name);
    setUploadedDocId(null);
    setAccessCode(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setCustomFilename((p) => p || droppedFile.name);
      setUploadedDocId(null);
      setAccessCode(null);
    }
  }, []);

  const performUpload = async (uploadData: {
    filename: string;
    fileSize: bigint;
    accessCode: string;
    encryptionKey: string;
    blob: ExternalBlob;
    mimeType: string;
    folders: string[];
    tags: string[];
  }) => {
    try {
      const docId = await uploadDocument.mutateAsync(uploadData);
      setUploadedDocId(docId);
      setAccessCode(uploadData.accessCode);
      toast.success("Document uploaded successfully!");
      setPendingUpload(null);
      if (onSuccess) setTimeout(() => onSuccess(), 2000);
    } catch (error: unknown) {
      const err = error as Error;
      if (
        err.message?.includes("Payment required") ||
        err.message?.includes("Storage limit exceeded")
      ) {
        toast.error(
          "Storage limit exceeded. Please complete payment to continue.",
        );
      } else {
        toast.error(err.message || "Failed to upload document");
      }
      console.error("Upload error:", error);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file || !customFilename.trim()) {
      toast.error("Please select a file and provide a filename");
      return;
    }
    try {
      const storageCheck = await checkStorageLimit.mutateAsync(
        BigInt(file.size),
      );
      if (storageCheck.paymentRequired) {
        const currentUsage = userAnalytics?.userStorage || 0n;
        const totalRequired = currentUsage + BigInt(file.size);
        setUploadProgress(0);
        const code = generateAccessCode();
        const encryptionKey = generateEncryptionKey();
        const arrayBuffer = await file.arrayBuffer();
        const blob = ExternalBlob.fromBytes(
          new Uint8Array(arrayBuffer),
        ).withUploadProgress((pct) => setUploadProgress(pct));
        setPendingUpload({
          filename: customFilename.trim(),
          fileSize: BigInt(file.size),
          accessCode: code,
          encryptionKey,
          blob,
          mimeType: getMimeType(file.name),
          folders: selectedFolders,
          tags: selectedTags,
        });
        setRequiredStorageBytes(totalRequired);
        setShowPaymentModal(true);
        return;
      }
      setUploadProgress(0);
      const code = generateAccessCode();
      const encryptionKey = generateEncryptionKey();
      const arrayBuffer = await file.arrayBuffer();
      const blob = ExternalBlob.fromBytes(
        new Uint8Array(arrayBuffer),
      ).withUploadProgress((pct) => setUploadProgress(pct));
      await performUpload({
        filename: customFilename.trim(),
        fileSize: BigInt(file.size),
        accessCode: code,
        encryptionKey,
        blob,
        mimeType: getMimeType(file.name),
        folders: selectedFolders,
        tags: selectedTags,
      });
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to check storage limit");
      console.error("Storage check error:", error);
      setUploadProgress(0);
    }
  };

  const handlePaymentConfirmed = async () => {
    if (pendingUpload) await performUpload(pendingUpload);
  };

  const handleReset = () => {
    setFile(null);
    setCustomFilename("");
    setUploadedDocId(null);
    setAccessCode(null);
    setUploadProgress(0);
    setPendingUpload(null);
    setSelectedFolders([]);
    setSelectedTags([]);
  };

  if (uploadedDocId && accessCode) {
    return (
      <Card
        className="card-elevated border-accent/25 bg-accent/5 max-w-lg mx-auto"
        data-ocid="upload-success"
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 border border-accent/25">
              <Check className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg font-display font-semibold text-foreground">
                Upload Successful
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your document has been securely stored
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Document ID
            </Label>
            <p className="mt-1.5 font-mono text-xs text-foreground break-all">
              {uploadedDocId}
            </p>
          </div>
          <div className="rounded-lg border border-accent/25 bg-accent/5 p-4">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Access Code
            </Label>
            <p className="mt-1.5 text-3xl font-mono font-bold text-accent tracking-widest">
              {accessCode}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Share this code to grant access to your document
            </p>
          </div>
          <Button
            onClick={handleReset}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-elevated"
            data-ocid="upload-another-btn"
          >
            Upload Another Document
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="card-elevated border-border max-w-lg mx-auto"
        data-ocid="upload-card"
      >
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-display font-semibold text-foreground">
            Upload Document
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Securely upload and encrypt your documents
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {uploadDocument.error && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {uploadDocument.error instanceof Error
                  ? uploadDocument.error.message
                  : "Upload failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}
          {checkStorageLimit.error && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {checkStorageLimit.error instanceof Error
                  ? checkStorageLimit.error.message
                  : "Failed to check storage."}
              </AlertDescription>
            </Alert>
          )}

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
              "relative rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer",
              isDragging
                ? "border-accent bg-accent/5 shadow-elevated"
                : "border-border hover:border-accent/50 hover:bg-muted/30",
            ].join(" ")}
            data-ocid="drop-zone"
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                {file ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                      <FileText className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground text-sm">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground text-sm">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Supports all file types
                      </p>
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Custom filename */}
          <div className="space-y-2">
            <Label
              htmlFor="custom-filename"
              className="text-sm font-medium text-foreground"
            >
              Custom Filename
            </Label>
            <Input
              id="custom-filename"
              placeholder="Enter a custom name for your document"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="border-border bg-input text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent"
              data-ocid="filename-input"
            />
          </div>

          {/* Folder assignment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
              Folders{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            {selectedFolders.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedFolders.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-md bg-muted border border-border text-xs px-2 py-0.5 text-foreground font-medium"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedFolders((p) => p.filter((x) => x !== f))
                      }
                      className="ml-0.5 hover:text-destructive transition-colors"
                      aria-label={`Remove folder ${f}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                placeholder="Add folder…"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFolder(folderInput);
                  }
                }}
                list="upload-folder-suggestions"
                className="border-border bg-input text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent"
                data-ocid="folder-input"
              />
              <datalist id="upload-folder-suggestions">
                {existingFolders
                  .filter((f) => !selectedFolders.includes(f))
                  .map((f) => (
                    <option key={f} value={f} />
                  ))}
              </datalist>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 border-border text-sm font-medium"
                onClick={() => addFolder(folderInput)}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Tag assignment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              Tags{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 rounded-full border text-xs px-2 py-0.5 font-medium ${tagColorClass(tag)}`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTags((p) => p.filter((x) => x !== tag))
                      }
                      className="ml-0.5 hover:opacity-70 transition-opacity"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                placeholder="Add tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                list="upload-tag-suggestions"
                className="border-border bg-input text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent"
                data-ocid="tag-input"
              />
              <datalist id="upload-tag-suggestions">
                {existingTags
                  .filter((t) => !selectedTags.includes(t))
                  .map((t) => (
                    <option key={t} value={t} />
                  ))}
              </datalist>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 border-border text-sm font-medium"
                onClick={() => addTag(tagInput)}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Uploading…</span>
                <span className="text-accent font-bold">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border">
                <div
                  className="h-full bg-accent transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={
              !file ||
              !customFilename.trim() ||
              uploadDocument.isPending ||
              checkStorageLimit.isPending
            }
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-elevated transition-all"
            data-ocid="upload-submit-btn"
          >
            {checkStorageLimit.isPending
              ? "Checking storage…"
              : uploadDocument.isPending
                ? "Uploading…"
                : "Upload Document"}
          </Button>
        </CardContent>
      </Card>

      <CryptoPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onPaymentConfirmed={handlePaymentConfirmed}
        requiredStorageBytes={requiredStorageBytes}
      />
    </>
  );
}
