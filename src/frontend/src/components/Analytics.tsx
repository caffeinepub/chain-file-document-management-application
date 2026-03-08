import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const numBytes = Number(bytes);
  if (numBytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));

  return `${(numBytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

function formatNumber(num: bigint): string {
  return Number(num).toLocaleString();
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
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-2xl glass-strong border-2 border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-destructive text-xl font-display font-bold">
                  Error Loading Analytics
                </CardTitle>
                <CardDescription className="text-base font-medium mt-1">
                  Unable to fetch analytics data from the backend
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="glass-strong">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Connection Error</AlertTitle>
              <AlertDescription className="text-sm font-medium">
                {error instanceof Error
                  ? error.message
                  : "Failed to connect to the backend canister. Please check your connection and try again."}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="w-full gap-2 neon-glow-primary font-bold"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              {isRefetching ? "Retrying..." : "Retry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-display font-black tracking-tight gradient-text-primary flex items-center justify-center gap-3">
          Storage Analytics
          <TrendingUp className="h-8 w-8 text-accent" />
        </h2>
        <p className="text-lg font-medium text-muted-foreground mt-2">
          Real-time metrics for all documents stored on Chain File
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-strong border-2 border-primary/20 hover-lift neon-glow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold uppercase tracking-wide">
              Total Files
            </CardTitle>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl glass border-2 border-primary/30 neon-glow-primary">
              <Files className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-40 glass" />
            ) : (
              <>
                <div className="text-4xl font-display font-black tracking-tight gradient-text-primary">
                  {formatNumber(analytics?.totalFiles || 0n)}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  Documents uploaded to the system
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-strong border-2 border-accent/20 hover-lift neon-glow-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold uppercase tracking-wide">
              Total Storage Used
            </CardTitle>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl glass border-2 border-accent/30 neon-glow-accent">
              <HardDrive className="h-6 w-6 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-40 glass" />
            ) : (
              <>
                <div className="text-4xl font-display font-black tracking-tight gradient-text-accent">
                  {formatBytes(analytics?.totalStorage || 0n)}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  Cumulative size of all documents
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-strong border-2 border-muted/20">
        <CardHeader>
          <CardTitle className="text-xl font-display font-bold">
            About Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium text-muted-foreground space-y-3">
          <p>
            These metrics represent the total storage usage across all users on
            Chain File. The data is updated in real-time and reflects the
            current state of the system.
          </p>
          <p>
            All documents are securely encrypted and stored on the Internet
            Computer blockchain, ensuring data integrity and availability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
