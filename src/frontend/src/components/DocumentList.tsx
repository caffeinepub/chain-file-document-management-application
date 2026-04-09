import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Calendar,
  Download,
  Eye,
  FileText,
  HardDrive,
  Key,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useDeleteDocument,
  useDownloadDocument,
  useGetDocumentPreview,
} from "../hooks/useQueries";
import type { DocumentMetadata } from "../types";
import DocumentPreviewModal from "./DocumentPreviewModal";

interface DocumentListProps {
  documents: DocumentMetadata[];
  isLoading: boolean;
}

export default function DocumentList({
  documents,
  isLoading,
}: DocumentListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentMetadata | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const deleteDocument = useDeleteDocument();
  const getDocumentPreview = useGetDocumentPreview();
  const downloadDocument = useDownloadDocument();

  const handleDownload = async (doc: DocumentMetadata) => {
    try {
      const result = await downloadDocument.mutateAsync(doc.id);
      if (!result) {
        toast.error("Failed to download document");
        return;
      }
      const bytes = await result.blob.getBytes();
      const blob = new Blob([bytes], {
        type: result.mimeType || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to download document");
      console.error("Download error:", error);
    }
  };

  const handlePreview = async (doc: DocumentMetadata) => {
    setPreviewDoc(doc);
    setPreviewBlobUrl(null);
    setPreviewError(null);
    try {
      const result = await getDocumentPreview.mutateAsync(doc.id);
      if (!result) {
        setPreviewError("Preview not available for this file type");
        return;
      }
      const bytes = await result.blob.getBytes();
      setPreviewBlobUrl(
        URL.createObjectURL(new Blob([bytes], { type: result.mimeType })),
      );
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Preview error:", error);
      setPreviewError(err.message || "Failed to load preview");
      toast.error(err.message || "Failed to load preview");
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    setPreviewDoc(null);
    setPreviewBlobUrl(null);
    setPreviewError(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDocument.mutateAsync(deleteId);
      toast.success("Document deleted successfully");
      setDeleteId(null);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Failed to delete document");
      console.error("Delete error:", error);
    }
  };

  const formatDate = (timestamp: bigint) =>
    new Date(Number(timestamp) / 1000000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatFileSize = (bytes: bigint) => {
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {["s1", "s2", "s3"].map((k) => (
          <Card key={k} className="card-elevated border-border animate-pulse">
            <CardHeader>
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-8 w-full rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="card-elevated border-border" data-ocid="empty-state">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border mb-6">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">
            No documents yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Upload your first document to start using secure decentralized
            storage.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      {deleteDocument.error && (
        <Alert variant="destructive" className="mb-4 border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {deleteDocument.error instanceof Error
              ? deleteDocument.error.message
              : "Failed to delete document."}
          </AlertDescription>
        </Alert>
      )}

      <div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        data-ocid="document-grid"
      >
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className="card-elevated border-border group flex flex-col"
            data-ocid={`doc-${doc.id}`}
          >
            <CardHeader className="pb-3 flex-none">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm font-display font-semibold text-foreground truncate cursor-help leading-snug">
                        {doc.filename}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs break-words bg-card border-border shadow-prominent"
                    >
                      <p className="break-all text-xs">{doc.filename}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{formatDate(doc.uploadTimestamp)}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 text-xs border-border text-muted-foreground font-mono"
                >
                  <HardDrive className="mr-1 h-3 w-3" />
                  {formatFileSize(doc.fileSize)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3 flex-1 flex flex-col justify-end">
              {/* Access code */}
              <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5">
                <Key className="h-4 w-4 text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Access Code
                  </p>
                  <p className="font-mono text-base font-bold text-accent tracking-widest leading-tight">
                    {doc.accessCode}
                  </p>
                </div>
              </div>

              {/* Document ID */}
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Document ID
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-mono text-xs text-muted-foreground truncate cursor-help">
                      {doc.id}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs break-all bg-card border-border shadow-prominent"
                  >
                    <p className="text-xs">{doc.id}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={() => handlePreview(doc)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border bg-card hover:bg-muted text-sm font-medium transition-colors"
                  disabled={getDocumentPreview.isPending}
                  data-ocid={`preview-${doc.id}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                <Button
                  onClick={() => handleDownload(doc)}
                  size="sm"
                  className="flex-1 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold shadow-elevated transition-all"
                  disabled={downloadDocument.isPending}
                  data-ocid={`download-${doc.id}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="truncate">Download</span>
                </Button>
                <Button
                  onClick={() => setDeleteId(doc.id)}
                  variant="destructive"
                  size="sm"
                  className="shrink-0 font-medium"
                  data-ocid={`delete-${doc.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-card border-border shadow-deep">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-semibold">
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-card hover:bg-muted font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium"
            >
              {deleteDocument.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={handleClosePreview}
          filename={previewDoc.filename}
          mimeType={previewDoc.mimeType}
          blobUrl={previewBlobUrl}
          isLoading={getDocumentPreview.isPending}
          error={previewError}
        />
      )}
    </TooltipProvider>
  );
}
