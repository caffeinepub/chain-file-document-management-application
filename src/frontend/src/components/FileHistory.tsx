import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ExternalLink,
  Eye,
  Globe,
  History,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGetFileHistory } from "../hooks/useQueries";

// String constants matching backend FileEventType enum
const EVENT = {
  upload: "upload",
  download: "download",
  preview: "preview",
  publicAccess: "publicAccess",
  delete_: "delete_",
} as const;

type EventBadge = { cls: string; label: string; icon: React.ReactNode };

function getEventBadge(eventType: string): EventBadge {
  switch (eventType) {
    case EVENT.upload:
      return {
        cls: "badge-upload",
        label: "Upload",
        icon: <Upload className="h-3 w-3" />,
      };
    case EVENT.download:
      return {
        cls: "badge-download",
        label: "Download",
        icon: <Download className="h-3 w-3" />,
      };
    case EVENT.preview:
      return {
        cls: "badge-preview",
        label: "Preview",
        icon: <Eye className="h-3 w-3" />,
      };
    case EVENT.publicAccess:
      return {
        cls: "badge-access",
        label: "Code Access",
        icon: <Globe className="h-3 w-3" />,
      };
    case EVENT.delete_:
      return {
        cls: "badge-delete",
        label: "Delete",
        icon: <Trash2 className="h-3 w-3" />,
      };
    default:
      return {
        cls: "",
        label: "Unknown",
        icon: <History className="h-3 w-3" />,
      };
  }
}

export default function FileHistory() {
  const { data: history, isLoading } = useGetFileHistory();
  const [sortBy, setSortBy] = useState<"date" | "type" | "filename">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<string>("all");

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

  const sortedAndFiltered = useMemo(() => {
    if (!history) return [];
    let filtered = [...history];
    if (filterType !== "all")
      filtered = filtered.filter((e) => e.eventType === filterType);
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = Number(a.timestamp - b.timestamp);
      else if (sortBy === "type")
        cmp = String(a.eventType).localeCompare(String(b.eventType));
      else if (sortBy === "filename")
        cmp = a.filename.localeCompare(b.filename);
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [history, sortBy, sortOrder, filterType]);

  if (isLoading) {
    return (
      <Card className="card-elevated border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display font-semibold text-foreground">
            <History className="h-5 w-5 text-accent" /> File History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {["s1", "s2", "s3", "s4"].map((k) => (
              <div key={k} className="h-12 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="card-elevated border-border" data-ocid="history-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display font-semibold text-foreground">
            <History className="h-5 w-5 text-accent" /> File History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border mb-5">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">
            No history yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your file activity will appear here once you start uploading and
            interacting with documents.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated border-border" data-ocid="history-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-display font-semibold text-foreground">
              <History className="h-5 w-5 text-accent" /> File History
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {sortedAndFiltered.length} event
              {sortedAndFiltered.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger
                className="w-[160px] h-8 text-xs border-border bg-card"
                data-ocid="history-filter"
              >
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-prominent">
                <SelectItem value="all" className="text-xs">
                  All Events
                </SelectItem>
                <SelectItem value={EVENT.upload} className="text-xs">
                  Uploads
                </SelectItem>
                <SelectItem value={EVENT.download} className="text-xs">
                  Downloads
                </SelectItem>
                <SelectItem value={EVENT.preview} className="text-xs">
                  Previews
                </SelectItem>
                <SelectItem value={EVENT.publicAccess} className="text-xs">
                  Code Access
                </SelectItem>
                <SelectItem value={EVENT.delete_} className="text-xs">
                  Deletes
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v) =>
                setSortBy(v as "date" | "type" | "filename")
              }
            >
              <SelectTrigger
                className="w-[140px] h-8 text-xs border-border bg-card"
                data-ocid="history-sort"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-prominent">
                <SelectItem value="date" className="text-xs">
                  Date & Time
                </SelectItem>
                <SelectItem value="type" className="text-xs">
                  Event Type
                </SelectItem>
                <SelectItem value="filename" className="text-xs">
                  File Name
                </SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() =>
                setSortOrder((p) => (p === "asc" ? "desc" : "asc"))
              }
              className="h-8 px-3 flex items-center gap-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors"
              title={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`}
              data-ocid="sort-order-btn"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-b-lg overflow-hidden border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 pl-4">
                  Event
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                  File Name
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3">
                  Time
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 pr-4">
                  Hash
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFiltered.map((event, index) => {
                const { date, time } = formatDateTime(event.timestamp);
                const badge = getEventBadge(String(event.eventType));
                return (
                  <TableRow
                    key={`${event.fileId}-${String(event.timestamp)}-${index}`}
                    className="border-b border-border/60 hover:bg-muted/20 transition-colors"
                    data-ocid={`history-row-${index}`}
                  >
                    <TableCell className="py-3 pl-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-foreground font-medium max-w-[160px]">
                      <span className="truncate block" title={event.filename}>
                        {event.filename}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {date}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {time}
                    </TableCell>
                    <TableCell className="py-3 pr-4">
                      {event.hash ? (
                        <a
                          href={`https://dashboard.internetcomputer.org/transaction/${event.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={event.hash}
                          className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline underline-offset-2"
                          data-ocid={`hash-link-${index}`}
                        >
                          {event.hash.slice(0, 10)}…
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
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
