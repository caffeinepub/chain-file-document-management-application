import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  Download,
  Eye,
  Globe,
  History,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { FileEventType } from "../backend";
import { useGetFileHistory } from "../hooks/useQueries";

export default function FileHistory() {
  const { data: history, isLoading } = useGetFileHistory();
  const [sortBy, setSortBy] = useState<"date" | "type" | "filename">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<string>("all");

  const getEventIcon = (eventType: FileEventType) => {
    switch (eventType) {
      case FileEventType.upload:
        return <Upload className="h-4 w-4 text-white" />;
      case FileEventType.download:
        return <Download className="h-4 w-4 text-white" />;
      case FileEventType.preview:
        return <Eye className="h-4 w-4 text-white" />;
      case FileEventType.publicAccess:
        return <Globe className="h-4 w-4 text-white" />;
      default:
        return <History className="h-4 w-4 text-white" />;
    }
  };

  const getEventLabel = (eventType: FileEventType) => {
    switch (eventType) {
      case FileEventType.upload:
        return "Upload";
      case FileEventType.download:
        return "Download";
      case FileEventType.preview:
        return "Preview";
      case FileEventType.publicAccess:
        return "Code Access";
      default:
        return "Unknown";
    }
  };

  const getEventBadgeVariant = (
    eventType: FileEventType,
  ): "default" | "secondary" | "outline" | "destructive" => {
    switch (eventType) {
      case FileEventType.upload:
        return "default";
      case FileEventType.download:
        return "secondary";
      case FileEventType.preview:
        return "outline";
      case FileEventType.publicAccess:
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDateTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  };

  const sortedAndFilteredHistory = useMemo(() => {
    if (!history) return [];

    let filtered = [...history];

    // Filter by event type
    if (filterType !== "all") {
      filtered = filtered.filter((event) => event.eventType === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison = Number(a.timestamp - b.timestamp);
          break;
        case "type":
          comparison = a.eventType.localeCompare(b.eventType);
          break;
        case "filename":
          comparison = a.fileName.localeCompare(b.fileName);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [history, sortBy, sortOrder, filterType]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  if (isLoading) {
    return (
      <Card className="glass-strong border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-display font-bold gradient-text-primary">
            <History className="h-7 w-7 text-primary" />
            File History
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Loading your file activity...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((skKey) => (
              <div
                key={skKey}
                className="h-16 rounded-lg glass animate-pulse shimmer"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="glass-strong border-2 border-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-display font-bold gradient-text-primary">
            <History className="h-7 w-7 text-primary" />
            File History
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Track all your file interactions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <History className="mb-6 h-20 w-20 text-muted-foreground/50" />
          <h3 className="mb-3 text-2xl font-display font-bold gradient-text-primary">
            No history yet
          </h3>
          <p className="text-center text-base font-medium text-muted-foreground max-w-md">
            Your file activity will appear here once you start uploading and
            interacting with documents.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-strong border-2 border-primary/20 neon-glow-primary">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl font-display font-bold gradient-text-primary">
              <History className="h-7 w-7 text-primary" />
              File History
            </CardTitle>
            <CardDescription className="text-base font-medium mt-2">
              {sortedAndFilteredHistory.length} event
              {sortedAndFilteredHistory.length !== 1 ? "s" : ""} recorded
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] glass border-primary/30 font-bold">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-primary/30">
                <SelectItem value="all" className="font-bold">
                  All Events
                </SelectItem>
                <SelectItem value={FileEventType.upload} className="font-bold">
                  Uploads
                </SelectItem>
                <SelectItem
                  value={FileEventType.download}
                  className="font-bold"
                >
                  Downloads
                </SelectItem>
                <SelectItem value={FileEventType.preview} className="font-bold">
                  Previews
                </SelectItem>
                <SelectItem
                  value={FileEventType.publicAccess}
                  className="font-bold"
                >
                  Code Access
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "date" | "type" | "filename")
              }
            >
              <SelectTrigger className="w-[180px] glass border-secondary/30 font-bold">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-secondary/30">
                <SelectItem value="date" className="font-bold">
                  Date & Time
                </SelectItem>
                <SelectItem value="type" className="font-bold">
                  Event Type
                </SelectItem>
                <SelectItem value="filename" className="font-bold">
                  File Name
                </SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={toggleSortOrder}
              className="px-4 py-2 rounded-lg glass border-2 border-accent/30 hover:neon-glow-accent transition-all duration-300 font-bold flex items-center gap-2"
              title={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg glass border border-primary/15 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="glass-strong border-b border-primary/20 hover:bg-transparent">
                <TableHead className="font-display font-bold text-base text-foreground">
                  Event Type
                </TableHead>
                <TableHead className="font-display font-bold text-base text-foreground">
                  File Name
                </TableHead>
                <TableHead className="font-display font-bold text-base text-foreground">
                  Date
                </TableHead>
                <TableHead className="font-display font-bold text-base text-foreground">
                  Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredHistory.map((event, index) => {
                const { date, time } = formatDateTime(event.timestamp);
                return (
                  <TableRow
                    key={`${event.fileId}-${event.timestamp}-${index}`}
                    className="glass hover:glass-strong border-b border-muted/15 transition-all duration-300"
                  >
                    <TableCell>
                      <Badge
                        variant={getEventBadgeVariant(event.eventType)}
                        className="gap-2 glass border-2 font-bold text-sm px-3 py-1 text-white [&>svg]:text-white"
                      >
                        {getEventIcon(event.eventType)}
                        <span className="text-white">
                          {getEventLabel(event.eventType)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {event.fileName}
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {date}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-medium text-muted-foreground">
                      {time}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
