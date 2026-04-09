import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Files,
  HardDrive,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useGetGlobalAnalytics } from "../hooks/useQueries";

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / k ** i).toFixed(2)} ${sizes[i]}`;
}

export default function Analytics() {
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useGetGlobalAnalytics();

  if (error) {
    return (
      <Card
        className="card-elevated border-destructive/40 max-w-xl mx-auto"
        data-ocid="analytics-error"
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
                Unable to fetch analytics from the backend
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
                : "Failed to connect to the backend canister. Please try again."}
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
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-ocid="analytics-section">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-display font-bold text-foreground">
            Platform Analytics
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time metrics for all documents stored on Chain File
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="card-elevated border-border"
          data-ocid="total-files-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Files
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
                  {Number(analytics?.totalFiles || 0n).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Documents uploaded to the system
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card
          className="card-elevated border-border"
          data-ocid="total-storage-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Storage
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
                <p className="text-3xl font-display font-bold text-accent tracking-tight">
                  {formatBytes(analytics?.totalStorage || 0n)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cumulative size of all documents
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
