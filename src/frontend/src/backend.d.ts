import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface FileEvent {
    user: Principal;
    fileName: string;
    fileId: string;
    timestamp: Time;
    eventType: FileEventType;
}
export interface DocumentMetadata {
    id: string;
    owner: Principal;
    blob: ExternalBlob;
    accessCode: string;
    mimeType: string;
    fileSize: bigint;
    uploadTimestamp: Time;
    filename: string;
    encryptionKey: string;
}
export interface PaymentTransaction {
    verified: boolean;
    timestamp: Time;
    amount: bigint;
    transactionId: string;
}
export interface UserProfile {
    name: string;
}
export enum FileEventType {
    publicAccess = "publicAccess",
    preview = "preview",
    upload = "upload",
    download = "download"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkStorageLimit(fileSize: bigint): Promise<{
        paymentRequired: boolean;
        remainingStorage: bigint;
        canUpload: boolean;
    }>;
    confirmPayment(transactionId: string, amount: bigint): Promise<void>;
    deleteDocument(id: string): Promise<void>;
    downloadDocument(id: string): Promise<{
        blob: ExternalBlob;
        mimeType: string;
        filename: string;
    } | null>;
    downloadDocumentWithCode(code: string): Promise<{
        blob: ExternalBlob;
        mimeType: string;
        filename: string;
    } | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDocumentEncryptionKeyWithCode(code: string): Promise<string | null>;
    getDocumentMetadata(id: string): Promise<DocumentMetadata | null>;
    getDocumentMetadataWithCode(code: string): Promise<DocumentMetadata | null>;
    getDocumentPreview(id: string): Promise<{
        blob: ExternalBlob;
        mimeType: string;
    } | null>;
    getDocumentPreviewWithCode(code: string): Promise<{
        blob: ExternalBlob;
        mimeType: string;
    } | null>;
    getFileHistory(): Promise<Array<FileEvent>>;
    getFileHistoryByFileId(fileId: string): Promise<Array<FileEvent>>;
    getFileHistoryByType(eventType: FileEventType): Promise<Array<FileEvent>>;
    getGlobalAnalytics(): Promise<{
        totalFiles: bigint;
        totalStorage: bigint;
    }>;
    getPaymentHistory(): Promise<Array<PaymentTransaction>>;
    getUserAnalytics(): Promise<{
        userStorage: bigint;
        userFiles: bigint;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listUserDocuments(): Promise<Array<DocumentMetadata>>;
    recordDocumentDownload(id: string): Promise<void>;
    recordDocumentPreview(id: string): Promise<void>;
    recordPublicDownload(code: string): Promise<void>;
    recordPublicPreview(code: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadDocument(filename: string, fileSize: bigint, accessCode: string, encryptionKey: string, blob: ExternalBlob, mimeType: string): Promise<string>;
    validateAccessCode(code: string): Promise<boolean>;
}
