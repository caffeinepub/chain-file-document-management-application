import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";

module {

  // ── Old types (from previous version, defined inline) ──────────────────────

  type OldDocumentMetadata = {
    id : Text;
    filename : Text;
    uploadTimestamp : Time.Time;
    fileSize : Nat;
    owner : Principal;
    accessCode : Text;
    encryptionKey : Text;
    blob : Storage.ExternalBlob;
    mimeType : Text;
  };

  type OldFileEventType = {
    #upload;
    #download;
    #preview;
    #publicAccess;
    #delete;
  };

  type OldFileEvent = {
    eventType : OldFileEventType;
    fileId : Text;
    fileName : Text;
    timestamp : Time.Time;
    user : Principal;
    hash : Text;
  };

  // ── New types (matching main.mo) ─────────────────────────────────────────────

  type NewDocumentMetadata = {
    id : Text;
    filename : Text;
    uploadTimestamp : Time.Time;
    fileSize : Nat;
    owner : Principal;
    accessCode : Text;
    encryptionKey : Text;
    blob : Storage.ExternalBlob;
    mimeType : Text;
    folders : [Text];
    tags : [Text];
  };

  type NewFileEventType = {
    #upload;
    #download;
    #preview;
    #publicAccess;
    #delete;
    #folderTagUpdate;
  };

  type NewFileEvent = {
    eventType : NewFileEventType;
    fileId : Text;
    fileName : Text;
    timestamp : Time.Time;
    user : Principal;
    hash : Text;
  };

  // ── Migration state types ────────────────────────────────────────────────────

  type PaymentTransaction = {
    transactionId : Text;
    amount : Nat;
    timestamp : Time.Time;
    verified : Bool;
  };

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    documents : Map.Map<Text, OldDocumentMetadata>;
    fileHistory : Map.Map<Text, [OldFileEvent]>;
  };

  type NewActor = {
    documents : Map.Map<Text, NewDocumentMetadata>;
    fileHistory : Map.Map<Text, [NewFileEvent]>;
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  func migrateDoc(id : Text, old : OldDocumentMetadata) : NewDocumentMetadata {
    { old with folders = []; tags = [] }
  };

  func migrateEventType(old : OldFileEventType) : NewFileEventType {
    switch old {
      case (#upload) #upload;
      case (#download) #download;
      case (#preview) #preview;
      case (#publicAccess) #publicAccess;
      case (#delete) #delete;
    }
  };

  func migrateEvent(old : OldFileEvent) : NewFileEvent {
    { old with eventType = migrateEventType(old.eventType) }
  };

  // ── Migration entry point ────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    let documents = old.documents.map<Text, OldDocumentMetadata, NewDocumentMetadata>(migrateDoc);
    let fileHistory = old.fileHistory.map<Text, [OldFileEvent], [NewFileEvent]>(
      func(_id, events) {
        events.map<OldFileEvent, NewFileEvent>(migrateEvent)
      }
    );
    { documents; fileHistory }
  };
};
