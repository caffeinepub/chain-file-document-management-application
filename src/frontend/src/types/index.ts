import type { ExternalBlob } from "../backend";

export interface UserProfile {
  name: string;
  createdAt?: bigint;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  fileSize: bigint;
  mimeType: string;
  accessCode: string;
  encryptionKey: string;
  uploadTimestamp: bigint;
  hash?: string;
}

// String-based event type matching backend enum values
export type FileEventType =
  | "upload"
  | "download"
  | "preview"
  | "publicAccess"
  | "delete_";

export interface FileEvent {
  id: string;
  fileId: string;
  filename: string;
  eventType: FileEventType;
  timestamp: bigint;
  hash?: string;
}

export interface PaymentRecord {
  transactionId: string;
  amount: bigint;
  timestamp: bigint;
}

export interface DocumentFile {
  blob: ExternalBlob;
  mimeType: string;
  filename: string;
}

export interface StorageLimitCheck {
  paymentRequired: boolean;
  currentUsage?: bigint;
  limit?: bigint;
}

export interface GlobalAnalytics {
  totalFiles: bigint;
  totalStorage: bigint;
}

export interface UserAnalytics {
  userFiles: bigint;
  userStorage: bigint;
}

// Full actor interface describing all backend methods
export interface ActorInterface {
  getCallerUserProfile(): Promise<UserProfile>;
  saveCallerUserProfile(profile: UserProfile): Promise<void>;
  listUserDocuments(): Promise<DocumentMetadata[]>;
  checkStorageLimit(fileSize: bigint): Promise<StorageLimitCheck>;
  confirmPayment(transactionId: string, amount: bigint): Promise<boolean>;
  getPaymentHistory(): Promise<PaymentRecord[]>;
  uploadDocument(
    filename: string,
    fileSize: bigint,
    accessCode: string,
    encryptionKey: string,
    blob: ExternalBlob,
    mimeType: string,
  ): Promise<string>;
  validateAccessCode(code: string): Promise<boolean>;
  getDocumentMetadata(id: string): Promise<DocumentMetadata | null>;
  getDocumentMetadataWithCode(code: string): Promise<DocumentMetadata | null>;
  deleteDocument(id: string): Promise<void>;
  getDocumentPreview(id: string): Promise<DocumentFile | null>;
  recordDocumentPreview(id: string): Promise<void>;
  downloadDocument(id: string): Promise<DocumentFile | null>;
  recordDocumentDownload(id: string): Promise<void>;
  getDocumentPreviewWithCode(code: string): Promise<DocumentFile | null>;
  recordPublicPreview(code: string): Promise<void>;
  downloadDocumentWithCode(code: string): Promise<DocumentFile | null>;
  recordPublicDownload(code: string): Promise<void>;
  getGlobalAnalytics(): Promise<GlobalAnalytics>;
  getUserAnalytics(): Promise<UserAnalytics>;
  getFileHistory(): Promise<FileEvent[]>;
  getFileHistoryByType(eventType: FileEventType): Promise<FileEvent[]>;
  getFileHistoryByFileId(fileId: string): Promise<FileEvent[]>;
}
