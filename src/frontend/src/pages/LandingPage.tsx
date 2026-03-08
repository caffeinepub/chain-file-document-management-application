import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Cloud,
  Download,
  Eye,
  FileCheck,
  FileText,
  HardDrive,
  LayoutDashboard,
  Lock,
  Shield,
  Unlock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DocumentMetadata } from "../backend";
import Analytics from "../components/Analytics";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDownloadDocumentWithCode,
  useGetDocumentPreviewWithCode,
} from "../hooks/useQueries";

interface LandingPageProps {
  onNavigateToDashboard?: () => void;
}

export default function LandingPage({
  onNavigateToDashboard,
}: LandingPageProps) {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { actor } = useActor();
  const [accessCode, setAccessCode] = useState("");
  const [unlockedDoc, setUnlockedDoc] = useState<DocumentMetadata | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const getDocumentPreview = useGetDocumentPreviewWithCode();
  const downloadDocument = useDownloadDocumentWithCode();

  const isAuthenticated = !!identity;

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleUnlock = async () => {
    if (accessCode.length !== 6) {
      toast.error("Please enter a 6-digit access code");
      return;
    }

    if (!actor) {
      toast.error("System not ready, please try again");
      return;
    }

    setIsUnlocking(true);
    try {
      const metadata = await actor.getDocumentMetadataWithCode(accessCode);

      if (metadata) {
        setUnlockedDoc(metadata);
        toast.success("Document unlocked successfully!");
      } else {
        toast.error("Invalid access code");
        setUnlockedDoc(null);
      }
    } catch (error) {
      toast.error("Failed to unlock document");
      console.error(error);
      setUnlockedDoc(null);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePreview = async () => {
    if (!unlockedDoc) return;

    setShowPreview(true);
    setPreviewBlobUrl(null);
    setPreviewError(null);

    try {
      const result = await getDocumentPreview.mutateAsync(accessCode);

      if (!result) {
        setPreviewError("Preview not available for this file type");
        return;
      }

      const bytes = await result.blob.getBytes();
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewError("Failed to load preview");
      toast.error("Failed to load preview");
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setShowPreview(false);
    setPreviewBlobUrl(null);
    setPreviewError(null);
  };

  const handleDownload = async () => {
    if (!unlockedDoc) return;

    try {
      const result = await downloadDocument.mutateAsync(accessCode);

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
    } catch (error) {
      toast.error("Failed to download document");
      console.error(error);
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

  return (
    <div className="container py-12 px-4 md:px-6">
      {/* Hero Section */}
      <section className="mb-20 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Enlarged Logo Section */}
          <div className="relative flex justify-center mb-12">
            <div className="relative">
              <img
                src="/assets/uploads/grok_image_xcsys9y-1.jpg"
                alt="Chain File Logo"
                className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 drop-shadow-2xl animate-float mx-auto rounded-2xl object-cover"
              />
              <div className="absolute inset-0 blur-3xl bg-primary/30 -z-10 rounded-full scale-110" />
            </div>
          </div>

          <div className="relative">
            <img
              src="/assets/generated/hero-banner.dim_1200x400.png"
              alt="Chain File Hero"
              className="mx-auto mb-10 w-full max-w-3xl rounded-2xl glass-strong elevation-4 hover-lift"
            />
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 -z-10 rounded-2xl" />
          </div>
          <h1 className="text-5xl font-display font-black tracking-tight sm:text-6xl md:text-7xl">
            <span className="gradient-text-primary block mb-2">
              Secure Document
            </span>
            <span className="gradient-text-accent">Management</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl font-medium text-muted-foreground leading-relaxed">
            Upload, encrypt, and share your documents with confidence. Access
            your files from any device with
            <span className="text-primary font-bold">
              {" "}
              military-grade security
            </span>{" "}
            powered by the
            <span className="text-accent font-bold"> Internet Computer</span>.
          </p>
          <div className="flex justify-center gap-4">
            {isAuthenticated && onNavigateToDashboard ? (
              <Button
                size="lg"
                onClick={onNavigateToDashboard}
                className="gap-2 text-lg px-8 py-6 neon-glow-primary hover:scale-105 transition-all duration-300 font-bold elevation-3"
              >
                <LayoutDashboard className="h-6 w-6" />
                Go to Dashboard
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleLogin}
                disabled={loginStatus === "logging-in"}
                className="gap-2 text-lg px-8 py-6 neon-glow-primary hover:scale-105 transition-all duration-300 font-bold elevation-3"
              >
                <Shield className="h-6 w-6" />
                {loginStatus === "logging-in" ? "Connecting..." : "Get Started"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Public Analytics Section */}
      <section className="mb-20">
        <div className="mx-auto max-w-5xl">
          <Analytics />
        </div>
      </section>

      {/* Access Document Section */}
      <section className="mb-20">
        <div className="mx-auto max-w-2xl">
          <Card className="glass-strong border-2 border-primary/20 neon-glow-primary hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-display font-bold gradient-text-primary">
                <Unlock className="h-7 w-7 text-primary" />
                Access a Document
              </CardTitle>
              <CardDescription className="text-base font-medium">
                Have an access code? Enter the 6-digit code to preview or
                download the document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="access-code" className="text-base font-bold">
                  Access Code
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={accessCode}
                    onChange={(value) => setAccessCode(value)}
                    disabled={isUnlocking}
                  >
                    <InputOTPGroup className="gap-3">
                      <InputOTPSlot
                        index={0}
                        className="glass border-2 border-primary/30 text-xl font-bold neon-glow-primary"
                      />
                      <InputOTPSlot
                        index={1}
                        className="glass border-2 border-primary/30 text-xl font-bold neon-glow-primary"
                      />
                      <InputOTPSlot
                        index={2}
                        className="glass border-2 border-primary/30 text-xl font-bold neon-glow-primary"
                      />
                      <InputOTPSlot
                        index={3}
                        className="glass border-2 border-primary/30 text-xl font-bold neon-glow-primary"
                      />
                      <InputOTPSlot
                        index={4}
                        className="glass border-2 border-primary/30 text-xl font-bold neon-glow-primary"
                      />
                      <InputOTPSlot
                        index={5}
                        className="glass border-2 border-primary/30 text-xl font-bold neon-glow-primary"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                onClick={handleUnlock}
                disabled={accessCode.length !== 6 || isUnlocking}
                className="w-full gap-2 text-lg py-6 neon-glow-accent hover:scale-105 transition-all duration-300 font-bold elevation-2"
                size="lg"
              >
                <Unlock className="h-5 w-5" />
                {isUnlocking ? "Unlocking..." : "Unlock Document"}
              </Button>
            </CardContent>
          </Card>

          {unlockedDoc && (
            <Card className="mt-6 glass-strong border-2 border-accent/30 neon-glow-accent hover-lift">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-3 text-xl font-display font-bold gradient-text-accent">
                      <FileText className="h-6 w-6 text-accent" />
                      {unlockedDoc.filename}
                    </CardTitle>
                    <CardDescription className="mt-3 space-y-2 text-base">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4 text-primary" />
                        Uploaded: {formatDate(unlockedDoc.uploadTimestamp)}
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <HardDrive className="h-4 w-4 text-secondary" />
                        Size: {formatFileSize(unlockedDoc.fileSize)}
                      </div>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    size="lg"
                    className="gap-2 glass border-2 border-primary/30 neon-glow-primary hover:scale-105 transition-all duration-300 font-bold"
                    disabled={getDocumentPreview.isPending}
                  >
                    <Eye className="h-5 w-5" />
                    {getDocumentPreview.isPending ? "Loading..." : "Preview"}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    className="gap-2 neon-glow-accent hover:scale-105 transition-all duration-300 font-bold elevation-2"
                    disabled={downloadDocument.isPending}
                  >
                    <Download className="h-5 w-5" />
                    {downloadDocument.isPending ? "Downloading..." : "Download"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="mb-12 text-center text-4xl font-display font-black gradient-text-primary">
          Why Choose Chain File?
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-strong border-2 border-primary/20 hover-lift neon-glow-primary">
            <CardHeader>
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl glass border-2 border-primary/30 neon-glow-primary">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-display font-bold">
                End-to-End Encryption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base font-medium">
                Your documents are encrypted before upload. Only you have the
                keys to decrypt them.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-strong border-2 border-secondary/20 hover-lift neon-glow-secondary">
            <CardHeader>
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl glass border-2 border-secondary/30 neon-glow-secondary">
                <FileCheck className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-xl font-display font-bold">
                Access Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base font-medium">
                Generate unique 6-digit codes for each document. Share access
                securely with anyone.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-strong border-2 border-accent/20 hover-lift neon-glow-accent">
            <CardHeader>
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl glass border-2 border-accent/30 neon-glow-accent">
                <Cloud className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl font-display font-bold">
                Cross-Device Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base font-medium">
                Access your documents from any device, anywhere. Your files
                follow you seamlessly.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-strong border-2 border-primary/20 hover-lift neon-glow-primary">
            <CardHeader>
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl glass border-2 border-primary/30 neon-glow-primary">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-display font-bold">
                Blockchain Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base font-medium">
                Built on the Internet Computer blockchain for unmatched security
                and reliability.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="rounded-3xl glass-strong border-2 border-primary/30 p-12 text-center neon-glow-primary elevation-4">
          <Shield className="mx-auto mb-6 h-16 w-16 text-primary" />
          <h2 className="mb-6 text-4xl font-display font-black gradient-text-primary">
            Ready to Secure Your Documents?
          </h2>
          <p className="mb-8 text-xl font-medium text-muted-foreground">
            Join Chain File today and experience the future of document
            management.
          </p>
          <Button
            size="lg"
            onClick={handleLogin}
            disabled={loginStatus === "logging-in"}
            className="gap-2 text-lg px-8 py-6 neon-glow-accent hover:scale-105 transition-all duration-300 font-bold elevation-3"
          >
            <Shield className="h-6 w-6" />
            {loginStatus === "logging-in"
              ? "Connecting..."
              : "Start Now - It's Free"}
          </Button>
        </section>
      )}

      {unlockedDoc && (
        <DocumentPreviewModal
          isOpen={showPreview}
          onClose={handleClosePreview}
          filename={unlockedDoc.filename}
          mimeType={unlockedDoc.mimeType}
          blobUrl={previewBlobUrl}
          isLoading={getDocumentPreview.isPending}
          error={previewError}
        />
      )}
    </div>
  );
}
