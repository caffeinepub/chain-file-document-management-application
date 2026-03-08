import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Files, History, Upload } from "lucide-react";
import { useState } from "react";
import DocumentList from "../components/DocumentList";
import FileHistory from "../components/FileHistory";
import UploadDocument from "../components/UploadDocument";
import UserAnalytics from "../components/UserAnalytics";
import { useListUserDocuments } from "../hooks/useQueries";

export default function Dashboard() {
  const { data: documents, isLoading } = useListUserDocuments();
  const [activeTab, setActiveTab] = useState("documents");

  return (
    <div className="container py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-black tracking-tight gradient-text-primary">
          Document Dashboard
        </h1>
        <p className="text-lg font-medium text-muted-foreground mt-2">
          Manage your secure documents
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <div className="relative z-10">
          <TabsList className="inline-flex flex-wrap items-center justify-start gap-2 glass-strong border-2 border-primary/20 p-3 h-auto w-full sm:w-auto">
            <TabsTrigger
              value="documents"
              className="flex items-center gap-2 px-4 py-3 text-sm sm:text-base font-bold whitespace-nowrap data-[state=active]:glass data-[state=active]:neon-glow-primary transition-all duration-300"
            >
              <Files className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>My Documents</span>
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="flex items-center gap-2 px-4 py-3 text-sm sm:text-base font-bold whitespace-nowrap data-[state=active]:glass data-[state=active]:neon-glow-accent transition-all duration-300"
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 px-4 py-3 text-sm sm:text-base font-bold whitespace-nowrap data-[state=active]:glass data-[state=active]:neon-glow-secondary transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 px-4 py-3 text-sm sm:text-base font-bold whitespace-nowrap data-[state=active]:glass data-[state=active]:neon-glow-primary transition-all duration-300"
            >
              <History className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="relative z-0">
          <TabsContent value="documents" className="space-y-4 mt-0">
            <DocumentList documents={documents || []} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-0">
            <UploadDocument onSuccess={() => setActiveTab("documents")} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-0">
            <UserAnalytics />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-0">
            <FileHistory />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
