import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, FileText, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useCheckStorageLimit,
  useGetUserAnalytics,
  useUploadDocument,
} from "../hooks/useQueries";
import CryptoPaymentModal from "./CryptoPaymentModal";

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
  } | null>(null);

  const uploadDocument = useUploadDocument();
  const checkStorageLimit = useCheckStorageLimit();
  const { data: userAnalytics } = useGetUserAnalytics();

  const generateAccessCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateEncryptionKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  };

  const getMimeType = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      csv: "text/csv",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      wav: "audio/wav",
    };
    return mimeTypes[extension] || "application/octet-stream";
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    if (!customFilename) {
      setCustomFilename(selectedFile.name);
    }
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
      setCustomFilename((prev) => prev || droppedFile.name);
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
  }) => {
    try {
      const docId = await uploadDocument.mutateAsync(uploadData);
      setUploadedDocId(docId);
      setAccessCode(uploadData.accessCode);
      toast.success("Document uploaded successfully!");
      setPendingUpload(null);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      if (
        error.message?.includes("Payment required") ||
        error.message?.includes("Storage limit exceeded")
      ) {
        toast.error(
          "Storage limit exceeded. Please complete payment to continue.",
        );
      } else {
        toast.error(error.message || "Failed to upload document");
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
        const uint8Array = new Uint8Array(arrayBuffer);

        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
          (percentage) => {
            setUploadProgress(percentage);
          },
        );

        const mimeType = getMimeType(file.name);

        setPendingUpload({
          filename: customFilename.trim(),
          fileSize: BigInt(file.size),
          accessCode: code,
          encryptionKey,
          blob,
          mimeType,
        });

        setRequiredStorageBytes(totalRequired);
        setShowPaymentModal(true);
        return;
      }

      setUploadProgress(0);
      const code = generateAccessCode();
      const encryptionKey = generateEncryptionKey();

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage) => {
          setUploadProgress(percentage);
        },
      );

      const mimeType = getMimeType(file.name);

      await performUpload({
        filename: customFilename.trim(),
        fileSize: BigInt(file.size),
        accessCode: code,
        encryptionKey,
        blob,
        mimeType,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to check storage limit");
      console.error("Storage check error:", error);
      setUploadProgress(0);
    }
  };

  const handlePaymentConfirmed = async () => {
    if (pendingUpload) {
      await performUpload(pendingUpload);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCustomFilename("");
    setUploadedDocId(null);
    setAccessCode(null);
    setUploadProgress(0);
    setPendingUpload(null);
  };

  if (uploadedDocId && accessCode) {
    return (
      <Card className="glass-strong border-2 border-accent/30 neon-glow-accent elevation-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent neon-glow-accent">
              <Check className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display font-bold gradient-text-accent">
                Upload Successful!
              </CardTitle>
              <CardDescription className="text-base font-medium">
                Your document has been securely uploaded
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4">
            <div className="rounded-2xl glass border-2 border-primary/30 p-5 neon-glow-primary">
              <Label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Document ID
              </Label>
              <p className="mt-2 font-mono text-sm break-all font-medium">
                {uploadedDocId}
              </p>
            </div>
            <div className="rounded-2xl glass border-2 border-accent/30 p-5 neon-glow-accent">
              <Label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Access Code
              </Label>
              <p className="mt-2 text-3xl font-black tracking-wider gradient-text-accent">
                {accessCode}
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Share this code to grant access to your document
              </p>
            </div>
          </div>
          <Button
            onClick={handleReset}
            className="w-full text-lg py-6 neon-glow-primary hover:scale-105 transition-all duration-300 font-bold elevation-2"
          >
            Upload Another Document
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-strong border-2 border-primary/20 neon-glow-primary">
        <CardHeader>
          <CardTitle className="text-2xl font-display font-bold gradient-text-primary">
            Upload Document
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Securely upload and encrypt your documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {uploadDocument.error && (
            <Alert variant="destructive" className="glass-strong">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium">
                {uploadDocument.error instanceof Error
                  ? uploadDocument.error.message
                  : "Upload failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          {checkStorageLimit.error && (
            <Alert variant="destructive" className="glass-strong">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium">
                {checkStorageLimit.error instanceof Error
                  ? checkStorageLimit.error.message
                  : "Failed to check storage. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-3 border-dashed p-12 text-center transition-all duration-300 ${
              isDragging
                ? "border-primary glass-strong neon-glow-primary scale-105"
                : "border-muted-foreground/25 glass hover:border-primary/40 hover:neon-glow-primary"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelect(selectedFile);
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                {file ? (
                  <>
                    <FileText className="h-16 w-16 text-primary" />
                    <p className="font-display font-bold text-lg">
                      {file.name}
                    </p>
                    <p className="text-base font-medium text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-16 w-16 text-muted-foreground" />
                    <p className="font-display font-bold text-lg">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-base font-medium text-muted-foreground">
                      Supports all file types
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <Label htmlFor="custom-filename" className="text-base font-bold">
              Custom Filename
            </Label>
            <Input
              id="custom-filename"
              placeholder="Enter a custom name for your document"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              className="glass border-2 border-primary/20 text-base font-medium h-12"
            />
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-3">
              <div className="flex justify-between text-base font-bold">
                <span>Uploading...</span>
                <span className="gradient-text-accent">{uploadProgress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full glass border border-primary/20">
                <div
                  className="h-full bg-gradient-to-r from-primary via-accent to-secondary transition-all duration-300 neon-glow-primary"
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
            className="w-full text-lg py-6 neon-glow-accent hover:scale-105 transition-all duration-300 font-bold elevation-2"
          >
            {checkStorageLimit.isPending
              ? "Checking storage..."
              : uploadDocument.isPending
                ? "Uploading..."
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
