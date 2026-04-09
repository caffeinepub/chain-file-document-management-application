import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Files,
  HardDrive,
  Info,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useGetUserAnalytics } from "../hooks/useQueries";

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / k ** i).toFixed(2)} ${sizes[i]}`;
}

export default function UserAnalytics() {
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useGetUserAnalytics();

  const FREE_LIMIT = 1_073_741_824;
  const usedBytes = Number(analytics?.userStorage || 0n);
  const pct = Math.min((usedBytes / FREE_LIMIT) * 100, 100);
  const isNear = pct >= 80;
  const isOver = pct >= 100;

  if (error) {
    return (
      <div className="max-w-xl mx-auto">
        <Card
          className="card-elevated border-destructive/40"
          data-ocid="user-analytics-error"
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/25">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive text-base font-display font-semibold">
                  Error Loading Analytics
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unable to fetch your analytics data
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert variant="destructive" className="border-destructive/40">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-semibold text-sm">
                Connection Error
              </AlertTitle>
              <AlertDescription className="text-xs">
                {error instanceof Error
                  ? error.message
                  : "Failed to connect. Please check your connection."}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              size="sm"
              className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 font-medium"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              {isRefetching ? "Retrying…" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 animate-fade-in"
      data-ocid="user-analytics-section"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-display font-bold text-foreground">
            Your Storage Analytics
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time metrics for your uploaded documents
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="card-elevated border-border"
          data-ocid="user-files-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Files
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <Files className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <Skeleton className="h-9 w-28 bg-muted" />
            ) : (
              <>
                <p className="text-3xl font-display font-bold text-foreground tracking-tight">
                  {Number(analytics?.userFiles || 0n).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Documents you have uploaded
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card
          className="card-elevated border-border"
          data-ocid="user-storage-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Storage Used
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
              <HardDrive className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {isLoading ? (
              <Skeleton className="h-9 w-28 bg-muted" />
            ) : (
              <>
                <p
                  className={`text-3xl font-display font-bold tracking-tight ${isOver ? "text-destructive" : isNear ? "text-yellow-500" : "text-accent"}`}
                >
                  {formatBytes(analytics?.userStorage || 0n)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total size of your documents
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Storage limit tracker */}
      <Card
        className={`card-elevated ${isOver ? "border-destructive/40" : isNear ? "border-yellow-500/40" : "border-border"}`}
        data-ocid="storage-limit-card"
      >
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground font-display">
              Storage Limit
            </CardTitle>
            {(isNear || isOver) && (
              <AlertCircle
                className={`h-4 w-4 ${isOver ? "text-destructive" : "text-yellow-500"}`}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">Free tier: 1 GB</p>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {isLoading ? (
            <Skeleton className="h-3 w-full bg-muted" />
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {formatBytes(analytics?.userStorage || 0n)} / 1.00 GB
                  </span>
                  <span
                    className={`font-bold ${isOver ? "text-destructive" : isNear ? "text-yellow-500" : "text-accent"}`}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={`h-2 bg-muted ${isOver ? "[&>div]:bg-destructive" : isNear ? "[&>div]:bg-yellow-500" : "[&>div]:bg-accent"}`}
                />
              </div>

              {isOver && (
                <Alert
                  variant="destructive"
                  className="border-destructive/40 py-3"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    Storage limit exceeded. Additional uploads require payment.
                  </AlertDescription>
                </Alert>
              )}
              {isNear && !isOver && (
                <Alert className="border-yellow-500/40 bg-yellow-500/5 py-3">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-xs font-medium text-yellow-500">
                    Approaching your free storage limit.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Info className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Additional Storage:
                  </span>{" "}
                  Available via ICP payments at $2 per GB. Secure blockchain
                  transactions ensure your data remains accessible.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card className="card-elevated border-border">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-foreground font-display">
            About Your Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
            These metrics show your personal storage usage on Chain File. Data
            updates in real-time and reflects only your uploaded documents.
          </p>
          <p>
            All documents are securely encrypted and stored on the Internet
            Computer blockchain, ensuring data integrity across all devices.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
