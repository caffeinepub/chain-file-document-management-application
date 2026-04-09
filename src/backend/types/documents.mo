import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

// Domain-specific types for document management (folders + tags)
module {
  // DocumentMetadata with folders and tags added (backward-compatible)
  public type DocumentMetadata = {
    id : Text;
    filename : Text;
    uploadTimestamp : Common.Timestamp;
    fileSize : Nat;
    owner : Common.UserId;
    accessCode : Text;
    encryptionKey : Text;
    blob : Storage.ExternalBlob;
    mimeType : Text;
    folders : [Text]; // NEW: folders this document belongs to (multiple allowed)
    tags : [Text];    // NEW: tags on this document (multiple allowed)
  };

  public type FileEventType = {
    #upload;
    #download;
    #preview;
    #publicAccess;
    #delete;
    #folderTagUpdate; // NEW: fired when folders/tags change
  };

  public type FileEvent = {
    eventType : FileEventType;
    fileId : Text;
    fileName : Text;
    timestamp : Common.Timestamp;
    user : Common.UserId;
    hash : Text;
  };
};
