import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type {
  DocumentFile,
  DocumentMetadata,
  FileEvent,
  FileEventType,
  GlobalAnalytics,
  StorageLimitCheck,
  UserAnalytics,
  UserProfile,
} from "../types";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      if (!isAuthenticated) return null;

      try {
        const profile = await actor.getCallerUserProfile();
        return profile;
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        // If unauthorized, return null (user needs to create profile)
        if (error.message?.includes("Unauthorized")) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: 1,
    staleTime: 30000,
  });

  return {
    ...query,
    isLoading: (actorFetching || query.isLoading) && isAuthenticated,
    isFetched: !!actor && !actorFetching && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      try {
        await actor.saveCallerUserProfile(profile);
      } catch (error: any) {
        console.error("Error saving user profile:", error);
        throw new Error("Failed to save profile. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["currentUserProfile", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useListUserDocuments() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<DocumentMetadata[]>({
    queryKey: ["userDocuments", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      if (!isAuthenticated) return [];

      try {
        const documents = await actor.listUserDocuments();
        return documents;
      } catch (error: any) {
        console.error("Error listing documents:", error);
        if (error.message?.includes("Unauthorized")) {
          return [];
        }
        throw new Error("Failed to load documents. Please try again.");
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: 2,
    staleTime: 10000,
  });
}

export function useCheckStorageLimit() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (fileSize: bigint) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.checkStorageLimit(fileSize);
      } catch (error: any) {
        console.error("Error checking storage limit:", error);
        throw new Error("Failed to check storage limit. Please try again.");
      }
    },
  });
}

export function useConfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      transactionId,
      amount,
    }: { transactionId: string; amount: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.confirmPayment(transactionId, amount);
      } catch (error: any) {
        console.error("Error confirming payment:", error);
        throw new Error("Failed to confirm payment. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userAnalytics", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentHistory", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useGetPaymentHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery({
    queryKey: ["paymentHistory", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getPaymentHistory();
      } catch (error: any) {
        console.error("Error fetching payment history:", error);
        throw new Error("Failed to load payment history. Please try again.");
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
  });
}

export function useUploadDocument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      filename,
      fileSize,
      accessCode,
      encryptionKey,
      blob,
      mimeType,
      folders = [],
      tags = [],
    }: {
      filename: string;
      fileSize: bigint;
      accessCode: string;
      encryptionKey: string;
      blob: ExternalBlob;
      mimeType: string;
      folders?: string[];
      tags?: string[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.uploadDocument(
          filename,
          fileSize,
          accessCode,
          encryptionKey,
          blob,
          mimeType,
          folders,
          tags,
        );
      } catch (error: any) {
        console.error("Error uploading document:", error);
        if (
          error.message?.includes("Payment required") ||
          error.message?.includes("Storage limit exceeded")
        ) {
          throw error;
        }
        throw new Error("Failed to upload document. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userDocuments", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["userAnalytics", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["globalAnalytics"] });
      queryClient.invalidateQueries({
        queryKey: ["fileHistory", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useValidateAccessCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.validateAccessCode(code);
      } catch (error: any) {
        console.error("Error validating access code:", error);
        throw new Error("Failed to validate access code. Please try again.");
      }
    },
  });
}

export function useGetDocumentMetadata() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getDocumentMetadata(id);
      } catch (error: any) {
        console.error("Error fetching document metadata:", error);
        throw new Error("Failed to load document metadata. Please try again.");
      }
    },
  });
}

export function useDeleteDocument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.deleteDocument(id);
      } catch (error: any) {
        console.error("Error deleting document:", error);
        throw new Error("Failed to delete document. Please try again.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userDocuments", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["userAnalytics", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["globalAnalytics"] });
      queryClient.invalidateQueries({
        queryKey: ["fileHistory", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useGetDocumentPreview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        const result = await actor.getDocumentPreview(id);

        if (result) {
          try {
            await actor.recordDocumentPreview(id);
            queryClient.invalidateQueries({
              queryKey: ["fileHistory", identity?.getPrincipal().toString()],
            });
          } catch (recordError) {
            console.error("Failed to record preview event:", recordError);
          }
        }

        return result;
      } catch (error: any) {
        console.error("Error fetching document preview:", error);
        throw new Error("Failed to load document preview. Please try again.");
      }
    },
  });
}

export function useDownloadDocument() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        const result = await actor.downloadDocument(id);

        if (result) {
          try {
            await actor.recordDocumentDownload(id);
            queryClient.invalidateQueries({
              queryKey: ["fileHistory", identity?.getPrincipal().toString()],
            });
          } catch (recordError) {
            console.error("Failed to record download event:", recordError);
          }
        }

        return result;
      } catch (error: any) {
        console.error("Error downloading document:", error);
        throw new Error("Failed to download document. Please try again.");
      }
    },
  });
}

export function useGetDocumentPreviewWithCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        const result = await actor.getDocumentPreviewWithCode(code);

        if (result) {
          try {
            await actor.recordPublicPreview(code);
            queryClient.invalidateQueries({ queryKey: ["fileHistory"] });
          } catch (recordError) {
            console.error(
              "Failed to record public preview event:",
              recordError,
            );
          }
        }

        return result;
      } catch (error: any) {
        console.error("Error fetching document preview with code:", error);
        throw new Error("Failed to load document preview. Please try again.");
      }
    },
  });
}

export function useDownloadDocumentWithCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        const result = await actor.downloadDocumentWithCode(code);

        if (result) {
          try {
            await actor.recordPublicDownload(code);
            queryClient.invalidateQueries({ queryKey: ["fileHistory"] });
          } catch (recordError) {
            console.error(
              "Failed to record public download event:",
              recordError,
            );
          }
        }

        return result;
      } catch (error: any) {
        console.error("Error downloading document with code:", error);
        throw new Error("Failed to download document. Please try again.");
      }
    },
  });
}

export function useGetGlobalAnalytics() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<GlobalAnalytics>({
    queryKey: ["globalAnalytics"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        const result = await actor.getGlobalAnalytics();
        return result;
      } catch (error: any) {
        console.error("Error fetching global analytics:", error);
        throw new Error(
          "Failed to load analytics data. Please check your connection and try again.",
        );
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30000,
  });
}

export function useGetUserAnalytics() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<UserAnalytics>({
    queryKey: ["userAnalytics", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        const result = await actor.getUserAnalytics();
        return result;
      } catch (error: any) {
        console.error("Error fetching user analytics:", error);
        throw new Error(
          "Failed to load analytics data. Please check your connection and try again.",
        );
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30000,
  });
}

export function useGetFileHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<FileEvent[]>({
    queryKey: ["fileHistory", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      if (!isAuthenticated) return [];

      try {
        return await actor.getFileHistory();
      } catch (error: any) {
        console.error("Error fetching file history:", error);
        throw new Error("Failed to load file history. Please try again.");
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    refetchInterval: 5000,
  });
}

export function useGetFileHistoryByType() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (eventType: FileEventType) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getFileHistoryByType(eventType);
      } catch (error: any) {
        console.error("Error fetching file history by type:", error);
        throw new Error("Failed to load file history. Please try again.");
      }
    },
  });
}

export function useGetFileHistoryByFileId() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (fileId: string) => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.getFileHistoryByFileId(fileId);
      } catch (error: any) {
        console.error("Error fetching file history by file ID:", error);
        throw new Error("Failed to load file history. Please try again.");
      }
    },
  });
}

export function useListUserFolders() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<string[]>({
    queryKey: ["userFolders", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        return await actor.listUserFolders();
      } catch (error: any) {
        console.error("Error listing folders:", error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    staleTime: 15000,
  });
}

export function useListUserTags() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<string[]>({
    queryKey: ["userTags", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        return await actor.listUserTags();
      } catch (error: any) {
        console.error("Error listing tags:", error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    staleTime: 15000,
  });
}

export function useUpdateDocumentFoldersTags() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      id,
      folders,
      tags,
    }: { id: string; folders: string[]; tags: string[] }) => {
      if (!actor) throw new Error("Actor not available");
      try {
        const result = await actor.updateDocumentFoldersTags(id, folders, tags);
        if ("err" in result) throw new Error(result.err);
        return result;
      } catch (error: any) {
        console.error("Error updating folders/tags:", error);
        throw new Error(error.message || "Failed to update folders/tags.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["userDocuments", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["userFolders", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["userTags", identity?.getPrincipal().toString()],
      });
    },
  });
}
