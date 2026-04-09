import { BarChart3, Files, History, Upload } from "lucide-react";
import { useState } from "react";
import DocumentList from "../components/DocumentList";
import FileHistory from "../components/FileHistory";
import UploadDocument from "../components/UploadDocument";
import UserAnalytics from "../components/UserAnalytics";
import { useListUserDocuments } from "../hooks/useQueries";

const TABS = [
  { id: "documents", label: "My Documents", icon: Files },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", label: "History", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Dashboard() {
  const { data: documents, isLoading } = useListUserDocuments();
  const [activeTab, setActiveTab] = useState<TabId>("documents");

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="bg-card border-b border-border">
        <div className="container px-4 md:px-6 py-6">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Document Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Manage your secure documents
          </p>
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
            <DocumentList documents={documents || []} isLoading={isLoading} />
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
