import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Files,
  HardDrive,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useGetUserAnalytics } from "../hooks/useQueries";

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

export default function UserAnalytics() {
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useGetUserAnalytics();

  const FREE_LIMIT_BYTES = 1073741824;
  const usedBytes = Number(analytics?.userStorage || 0n);
  const usagePercentage = Math.min((usedBytes / FREE_LIMIT_BYTES) * 100, 100);
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

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
                  Unable to fetch your analytics data from the backend
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
          Your Storage Analytics
          <TrendingUp className="h-8 w-8 text-accent" />
        </h2>
        <p className="text-lg font-medium text-muted-foreground mt-2">
          Real-time metrics for your uploaded documents
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-strong border-2 border-primary/20 hover-lift neon-glow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold uppercase tracking-wide">
              Your Uploaded Files
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
                  {formatNumber(analytics?.userFiles || 0n)}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  Documents you have uploaded
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-strong border-2 border-accent/20 hover-lift neon-glow-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-bold uppercase tracking-wide">
              Your Total Storage Usage
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
                  {formatBytes(analytics?.userStorage || 0n)}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  Total size of your documents
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        className={`glass-strong border-3 ${isOverLimit ? "border-destructive/50 neon-glow-primary" : isNearLimit ? "border-warning/50" : "border-primary/20 neon-glow-primary"}`}
      >
        <CardHeader>
          <CardTitle className="text-xl font-display font-bold flex items-center gap-3">
            Storage Limit Tracker
            {isNearLimit && <AlertCircle className="h-6 w-6 text-warning" />}
            {isOverLimit && (
              <AlertCircle className="h-6 w-6 text-destructive" />
            )}
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Your usage against the 1 GB free storage limit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <Skeleton className="h-4 w-full glass" />
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="font-bold">
                    {formatBytes(analytics?.userStorage || 0n)} / 1.00 GB
                  </span>
                  <span
                    className={`font-black text-lg ${isOverLimit ? "text-destructive" : isNearLimit ? "text-warning" : "gradient-text-primary"}`}
                  >
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={usagePercentage}
                  className={`h-4 glass border border-primary/20 ${isOverLimit ? "[&>div]:bg-gradient-to-r [&>div]:from-destructive [&>div]:to-destructive/70" : isNearLimit ? "[&>div]:bg-gradient-to-r [&>div]:from-warning [&>div]:to-warning/70" : "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:via-accent [&>div]:to-secondary"}`}
                />
              </div>

              {isOverLimit && (
                <Alert
                  variant="destructive"
                  className="glass-strong border-2 border-destructive/50"
                >
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-base font-bold">
                    You have exceeded your free storage limit. Additional
                    uploads will require payment.
                  </AlertDescription>
                </Alert>
              )}

              {isNearLimit && !isOverLimit && (
                <Alert className="glass-strong border-2 border-warning/50">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <AlertDescription className="text-base font-bold text-warning-foreground">
                    You are approaching your free storage limit.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-3 border-t border-border/50">
                <div className="flex items-start gap-3 glass rounded-xl p-4 border border-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-base font-medium text-muted-foreground">
                    <strong className="gradient-text-accent">
                      Additional Storage:
                    </strong>{" "}
                    Available through ICP payments at $2 per GB. Secure
                    blockchain transactions ensure your data remains accessible.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="glass-strong border-2 border-muted/20">
        <CardHeader>
          <CardTitle className="text-xl font-display font-bold">
            About Your Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium text-muted-foreground space-y-3">
          <p>
            These metrics show your personal storage usage on Chain File. The
            data is updated in real-time and reflects only the documents you
            have uploaded.
          </p>
          <p>
            All your documents are securely encrypted and stored on the Internet
            Computer blockchain, ensuring data integrity and availability across
            all your devices.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
