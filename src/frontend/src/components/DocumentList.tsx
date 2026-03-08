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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { DocumentMetadata } from "../backend";
import {
  useDeleteDocument,
  useDownloadDocument,
  useGetDocumentPreview,
} from "../hooks/useQueries";
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
      const mimeType = result.mimeType || "application/octet-stream";
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error: any) {
      toast.error(error.message || "Failed to download document");
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
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (error: any) {
      console.error("Preview error:", error);
      setPreviewError(error.message || "Failed to load preview");
      toast.error(error.message || "Failed to load preview");
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
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
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
      console.error("Delete error:", error);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: bigint) => {
    const size = Number(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((skeletonKey) => (
          <Card
            key={skeletonKey}
            className="glass-strong animate-pulse shimmer"
          >
            <CardHeader>
              <div className="h-6 w-3/4 rounded-lg bg-muted/50" />
              <div className="h-4 w-1/2 rounded-lg bg-muted/50 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 w-full rounded-lg bg-muted/50" />
                <div className="h-4 w-2/3 rounded-lg bg-muted/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="glass-strong border-2 border-muted/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="mb-6 h-20 w-20 text-muted-foreground/50" />
          <h3 className="mb-3 text-2xl font-display font-bold gradient-text-primary">
            No documents yet
          </h3>
          <p className="text-center text-base font-medium text-muted-foreground max-w-md">
            Upload your first document to get started with secure storage.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      {deleteDocument.error && (
        <Alert variant="destructive" className="mb-6 glass-strong">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm font-medium">
            {deleteDocument.error instanceof Error
              ? deleteDocument.error.message
              : "Failed to delete document. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className="glass-strong border-2 border-primary/15 hover-lift neon-glow-primary group"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardTitle className="text-lg font-display font-bold truncate cursor-help block">
                        {doc.filename}
                      </CardTitle>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs sm:max-w-sm md:max-w-md break-words glass-strong border-2 border-primary/30 font-medium"
                    >
                      <p className="break-all">{doc.filename}</p>
                    </TooltipContent>
                  </Tooltip>
                  <CardDescription className="flex items-center gap-2 mt-2 font-medium">
                    <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="truncate">
                      {formatDate(doc.uploadTimestamp)}
                    </span>
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 glass border-accent/30 font-bold whitespace-nowrap"
                >
                  <HardDrive className="mr-1 h-3 w-3" />
                  {formatFileSize(doc.fileSize)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl glass border border-primary/20 p-3 neon-glow-primary">
                  <Key className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Access Code
                    </p>
                    <p className="font-mono text-lg font-black tracking-wider gradient-text-primary">
                      {doc.accessCode}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl glass border border-muted/20 p-3 overflow-hidden">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                    Document ID
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="font-mono text-xs truncate font-medium cursor-help block">
                        {doc.id}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs sm:max-w-sm md:max-w-md break-all glass-strong border-2 border-primary/30 font-medium"
                    >
                      {doc.id}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePreview(doc)}
                  variant="outline"
                  size="sm"
                  className="gap-2 glass border-primary/30 hover:neon-glow-primary transition-all duration-300 font-bold"
                  disabled={getDocumentPreview.isPending}
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                <Button
                  onClick={() => handleDownload(doc)}
                  className="flex-1 gap-2 neon-glow-accent hover:scale-105 transition-all duration-300 font-bold"
                  size="sm"
                  disabled={downloadDocument.isPending}
                >
                  <Download className="h-4 w-4" />
                  <span className="truncate">Download</span>
                </Button>
                <Button
                  onClick={() => setDeleteId(doc.id)}
                  variant="destructive"
                  size="sm"
                  className="gap-2 elevation-2 hover:scale-105 transition-all duration-300 font-bold shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
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
        <AlertDialogContent className="glass-strong border-2 border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-display font-bold">
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 elevation-2 font-bold"
            >
              {deleteDocument.isPending ? "Deleting..." : "Delete"}
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
