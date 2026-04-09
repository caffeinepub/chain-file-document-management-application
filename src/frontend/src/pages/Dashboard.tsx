import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  ChevronDown,
  Files,
  FolderOpen,
  History,
  Search,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import DocumentList from "../components/DocumentList";
import FileHistory from "../components/FileHistory";
import UploadDocument from "../components/UploadDocument";
import UserAnalytics from "../components/UserAnalytics";
import {
  useListUserDocuments,
  useListUserFolders,
  useListUserTags,
} from "../hooks/useQueries";

const TABS = [
  { id: "documents", label: "My Documents", icon: Files },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", label: "History", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Dashboard() {
  const { data: documents, isLoading } = useListUserDocuments();
  const { data: allFolders = [] } = useListUserFolders();
  const { data: allTags = [] } = useListUserTags();
  const [activeTab, setActiveTab] = useState<TabId>("documents");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocuments = useMemo(() => {
    const docs = documents ?? [];
    const q = searchQuery.trim().toLowerCase();
    return docs.filter((doc) => {
      const folders = doc.folders ?? [];
      const tags = doc.tags ?? [];

      // Folder filter
      if (selectedFolder && !folders.includes(selectedFolder)) return false;

      // Tag filter (AND logic)
      if (
        selectedTags.length > 0 &&
        !selectedTags.every((t) => tags.includes(t))
      )
        return false;

      // Search filter — filename, folder names, tag names
      if (q) {
        const inFilename = doc.filename.toLowerCase().includes(q);
        const inFolders = folders.some((f) => f.toLowerCase().includes(q));
        const inTags = tags.some((t) => t.toLowerCase().includes(q));
        if (!inFilename && !inFolders && !inTags) return false;
      }

      return true;
    });
  }, [documents, selectedFolder, selectedTags, searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearFilters = () => {
    setSelectedFolder(null);
    setSelectedTags([]);
    setSearchQuery("");
  };

  const hasFilters =
    selectedFolder !== null ||
    selectedTags.length > 0 ||
    searchQuery.trim() !== "";

  const docCount = documents?.length ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="bg-card border-b border-border">
        <div className="container px-4 md:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
                Document Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 font-body">
                Manage your secure documents
              </p>
            </div>

            {/* Search bar — always visible in header */}
            <div className="relative w-full sm:w-72" data-ocid="search-bar">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search by name, folder, or tag…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-accent/30 focus-visible:border-accent text-sm"
                aria-label="Search documents"
                data-ocid="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                  data-ocid="search-clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="container px-4 md:px-6">
          <nav
            className="flex items-center gap-0 overflow-x-auto scrollbar-hide"
            role="tablist"
            aria-label="Dashboard sections"
            data-ocid="dashboard-tabs"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={[
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  activeTab === id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                ].join(" ")}
                data-ocid={`tab-${id}`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-background min-h-[calc(100vh-200px)]">
        <div className="container px-4 md:px-6 py-8">
          {activeTab === "documents" && (
            <div className="space-y-4">
              {/* Filter toolbar — always visible when user has any documents */}
              {docCount > 0 && (
                <div
                  className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-border bg-card"
                  data-ocid="filter-controls"
                >
                  {/* Folder filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`gap-1.5 border-border text-sm font-medium ${selectedFolder ? "border-accent/50 text-accent bg-accent/5" : ""}`}
                        data-ocid="folder-filter"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        {selectedFolder ?? "All Folders"}
                        <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="bg-card border-border shadow-deep"
                      align="start"
                    >
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Filter by folder
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuCheckboxItem
                        checked={selectedFolder === null}
                        onCheckedChange={() => setSelectedFolder(null)}
                        className="text-sm"
                      >
                        All Folders
                      </DropdownMenuCheckboxItem>
                      {allFolders.length > 0 ? (
                        allFolders.map((f) => (
                          <DropdownMenuCheckboxItem
                            key={f}
                            checked={selectedFolder === f}
                            onCheckedChange={() =>
                              setSelectedFolder(selectedFolder === f ? null : f)
                            }
                            className="text-sm"
                          >
                            {f}
                          </DropdownMenuCheckboxItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground italic">
                          No folders yet — add one via the pencil icon on a file
                          card
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Tag filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`gap-1.5 border-border text-sm font-medium ${selectedTags.length > 0 ? "border-accent/50 text-accent bg-accent/5" : ""}`}
                        data-ocid="tag-filter"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {selectedTags.length > 0
                          ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""}`
                          : "All Tags"}
                        <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="bg-card border-border shadow-deep"
                      align="start"
                    >
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Filter by tag
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />
                      {allTags.length > 0 ? (
                        allTags.map((tag) => (
                          <DropdownMenuCheckboxItem
                            key={tag}
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => toggleTag(tag)}
                            className="text-sm"
                          >
                            {tag}
                          </DropdownMenuCheckboxItem>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground italic">
                          No tags yet — add one via the pencil icon on a file
                          card
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Active filter pills */}
                  {selectedFolder && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-accent/40 bg-accent/5 text-accent text-xs font-medium pl-2 pr-1"
                    >
                      <FolderOpen className="h-3 w-3" />
                      {selectedFolder}
                      <button
                        type="button"
                        onClick={() => setSelectedFolder(null)}
                        className="ml-0.5 hover:opacity-70"
                        aria-label="Remove folder filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="gap-1 border-accent/40 bg-accent/5 text-accent text-xs font-medium pl-2 pr-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="ml-0.5 hover:opacity-70"
                        aria-label={`Remove tag filter ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}

                  {hasFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground hover:text-foreground text-xs gap-1 h-7 px-2"
                      data-ocid="clear-filters"
                    >
                      <X className="h-3 w-3" />
                      Clear all
                    </Button>
                  )}

                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {filteredDocuments.length} of {docCount}
                  </span>
                </div>
              )}

              <DocumentList
                documents={filteredDocuments}
                isLoading={isLoading}
                searchQuery={searchQuery}
              />
            </div>
          )}
          {activeTab === "upload" && (
            <UploadDocument onSuccess={() => setActiveTab("documents")} />
          )}
          {activeTab === "analytics" && <UserAnalytics />}
          {activeTab === "history" && <FileHistory />}
        </div>
      </div>
    </div>
  );
}
