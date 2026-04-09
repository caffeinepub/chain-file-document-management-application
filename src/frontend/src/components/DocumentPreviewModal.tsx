import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  mimeType: string;
  blobUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  filename,
  mimeType,
  blobUrl,
  isLoading,
  error,
}: DocumentPreviewModalProps) {
  const [previewError, setPreviewError] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on blobUrl change
  useEffect(() => {
    setPreviewError(null);
  }, [blobUrl]);

  const supportedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "text/plain",
  ];
  const isSupported = supportedTypes.includes(mimeType);

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Loading preview…</p>
          </div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex h-[60vh] items-center justify-center p-4">
          <Alert variant="destructive" className="border-destructive/40">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        </div>
      );
    }
    if (!isSupported) {
      return (
        <div className="flex h-[60vh] items-center justify-center p-4">
          <Alert className="border-border bg-muted/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Preview not available for this file type. Please download the file
              to view it.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    if (!blobUrl) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">No preview available</p>
        </div>
      );
    }
    if (previewError) {
      return (
        <div className="flex h-[60vh] items-center justify-center p-4">
          <Alert variant="destructive" className="border-destructive/40">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {mimeType === "application/pdf"
                ? "Failed to load PDF preview. Try downloading the file to view it."
                : "Failed to load preview. Please try downloading the file."}
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    if (mimeType === "application/pdf") {
      return (
        <div className="h-[600px] w-full">
          <embed
            src={blobUrl}
            type="application/pdf"
            width="100%"
            height="600px"
            className="rounded-md border border-border"
            title={`Preview of ${filename}`}
            onError={() => setPreviewError("Failed to load PDF preview")}
          />
        </div>
      );
    }
    if (mimeType === "image/png" || mimeType === "image/jpeg") {
      return (
        <div className="flex h-[70vh] items-center justify-center bg-muted/30 rounded-md border border-border">
          <img
            src={blobUrl}
            alt={filename}
            className="max-h-full max-w-full object-contain"
            onError={() => setPreviewError("Failed to load image preview")}
          />
        </div>
      );
    }
    if (mimeType === "text/plain") {
      return (
        <iframe
          src={blobUrl}
          className="h-[70vh] w-full rounded-md border border-border bg-background"
          title={`Preview of ${filename}`}
          onError={() => setPreviewError("Failed to load text preview")}
        />
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border shadow-deep"
        data-ocid="preview-modal"
      >
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="truncate font-display font-semibold text-foreground text-base">
              {filename}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4 h-7 w-7 rounded-md hover:bg-muted"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto">{renderPreview()}</div>
      </DialogContent>
    </Dialog>
  );
}
