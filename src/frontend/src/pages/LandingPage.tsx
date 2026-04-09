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
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Analytics from "../components/Analytics";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDownloadDocumentWithCode,
  useGetDocumentPreviewWithCode,
} from "../hooks/useQueries";
import type { DocumentMetadata } from "../types";

interface LandingPageProps {
  onNavigateToDashboard?: () => void;
}

const FEATURES = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    desc: "Documents are encrypted before upload. Only you hold the decryption keys.",
  },
  {
    icon: FileCheck,
    title: "Access Control",
    desc: "Generate unique 6-digit codes per document. Share access securely with anyone.",
  },
  {
    icon: Cloud,
    title: "Cross-Device Access",
    desc: "Access your documents from any device, anywhere in the world.",
  },
  {
    icon: Shield,
    title: "Blockchain Security",
    desc: "Built on the Internet Computer for unmatched security and reliability.",
  },
];

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
      setPreviewBlobUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Preview error:", error);
      setPreviewError("Failed to load preview");
      toast.error("Failed to load preview");
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
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
    } catch (error) {
      toast.error("Failed to download document");
      console.error(error);
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

  return (
    <div className="animate-fade-in">
      {/* ── Hero ── */}
      <section className="relative bg-card border-b border-border">
        <div className="container px-4 md:px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex justify-center mb-8">
              <img
                src="/assets/uploads/grok_image_xcsys9y-1.jpg"
                alt="Chain File"
                className="h-20 w-20 md:h-24 md:w-24 rounded-2xl object-cover shadow-prominent"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/8 mb-6">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-medium text-accent tracking-wide uppercase">
                Decentralized · Encrypted · Yours
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-foreground mb-6 leading-[0.95]">
              Chain File
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed mb-10">
              Upload, encrypt, and share documents with confidence. Access your
              files from any device with{" "}
              <span className="text-foreground font-semibold">
                top cryptographic security
              </span>{" "}
              powered by the Internet Computer.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthenticated && onNavigateToDashboard ? (
                <Button
                  size="lg"
                  onClick={onNavigateToDashboard}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 shadow-prominent transition-all"
                  data-ocid="hero-dashboard-cta"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleLogin}
                  disabled={loginStatus === "logging-in"}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 shadow-prominent transition-all"
                  data-ocid="hero-login-cta"
                >
                  <Shield className="h-5 w-5" />
                  {loginStatus === "logging-in"
                    ? "Connecting…"
                    : "Get Started Free"}
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                1 GB free · No credit card
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Analytics ── */}
      <section className="bg-background border-b border-border">
        <div className="container px-4 md:px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <Analytics />
          </div>
        </div>
      </section>

      {/* ── Access Document ── */}
      <section className="bg-muted/30 border-b border-border">
        <div className="container px-4 md:px-6 py-16">
          <div className="mx-auto max-w-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Access a Document
              </h2>
              <p className="text-muted-foreground text-sm">
                Have an access code? Enter the 6-digit code to view or download.
              </p>
            </div>

            <Card
              className="card-elevated border-border"
              data-ocid="access-code-card"
            >
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="access-code"
                    className="text-sm font-semibold text-foreground"
                  >
                    6-Digit Access Code
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={accessCode}
                      onChange={(value) => setAccessCode(value)}
                      disabled={isUnlocking}
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="h-12 w-10 border-border bg-input text-foreground text-lg font-bold font-mono rounded-md focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button
                  onClick={handleUnlock}
                  disabled={accessCode.length !== 6 || isUnlocking}
                  className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-elevated"
                  data-ocid="unlock-btn"
                >
                  <Unlock className="h-4 w-4" />
                  {isUnlocking ? "Unlocking…" : "Unlock Document"}
                </Button>
              </CardContent>
            </Card>

            {unlockedDoc && (
              <Card
                className="mt-4 card-elevated border-accent/25 bg-accent/5 animate-slide-up"
                data-ocid="unlocked-doc-card"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-display font-semibold text-foreground">
                    <FileText className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="truncate">{unlockedDoc.filename}</span>
                  </CardTitle>
                  <CardDescription className="text-sm space-y-1 mt-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      Uploaded: {formatDate(unlockedDoc.uploadTimestamp)}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="h-3.5 w-3.5 flex-shrink-0" />
                      Size: {formatFileSize(unlockedDoc.fileSize)}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 grid gap-2 grid-cols-2">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    className="gap-2 border-border bg-card hover:bg-muted font-medium transition-colors"
                    disabled={getDocumentPreview.isPending}
                    data-ocid="preview-btn"
                  >
                    <Eye className="h-4 w-4" />
                    {getDocumentPreview.isPending ? "Loading…" : "Preview"}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-elevated"
                    disabled={downloadDocument.isPending}
                    data-ocid="download-btn"
                  >
                    <Download className="h-4 w-4" />
                    {downloadDocument.isPending ? "Downloading…" : "Download"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-background border-b border-border">
        <div className="container px-4 md:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              Why Choose Chain File?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built with privacy-first architecture on the Internet Computer
              blockchain.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="card-elevated border-border group">
                <CardHeader className="pb-3">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 group-hover:bg-accent/15 transition-colors">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-base font-display font-semibold text-foreground">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm leading-relaxed">
                    {desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      {!isAuthenticated && (
        <section className="bg-card border-b border-border">
          <div className="container px-4 md:px-6 py-16 text-center">
            <div className="mx-auto max-w-xl">
              <div className="flex justify-center mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/25">
                  <Shield className="h-7 w-7 text-accent" />
                </div>
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Ready to Secure Your Documents?
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Join Chain File today and experience the future of decentralized
                document management. Start free with 1 GB.
              </p>
              <Button
                size="lg"
                onClick={handleLogin}
                disabled={loginStatus === "logging-in"}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-8 shadow-prominent"
                data-ocid="bottom-cta-btn"
              >
                <Shield className="h-5 w-5" />
                {loginStatus === "logging-in"
                  ? "Connecting…"
                  : "Start Now — It's Free"}
              </Button>
            </div>
          </div>
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
