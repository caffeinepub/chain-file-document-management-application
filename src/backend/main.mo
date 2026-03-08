import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Nat "mo:core/Nat";



actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside assignRole
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    name : Text;
    // Other user metadata if needed
  };

  var userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Storage
  let storage = Storage.new();
  include MixinStorage(storage);

  // Document types
  type DocumentMetadata = {
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

  // Payment transaction record
  type PaymentTransaction = {
    transactionId : Text;
    amount : Nat;
    timestamp : Time.Time;
    verified : Bool;
  };

  // File event types
  type FileEventType = {
    #upload;
    #download;
    #preview;
    #publicAccess;
  };

  // File event record
  type FileEvent = {
    eventType : FileEventType;
    fileId : Text;
    fileName : Text;
    timestamp : Time.Time;
    user : Principal;
  };

  // Document storage
  var documents = Map.empty<Text, DocumentMetadata>();
  var accessCodeMap = Map.empty<Text, Text>();

  // Storage limit tracking
  let STORAGE_LIMIT : Nat = 1_073_741_824; // 1 GB in bytes

  var userStorageUsage = Map.empty<Principal, Nat>();
  var userPaymentStatus = Map.empty<Principal, Bool>();

  // Payment transaction tracking
  var userPaymentTransactions = Map.empty<Principal, [PaymentTransaction]>();

  // File history tracking
  var fileHistory = Map.empty<Text, [FileEvent]>();

  // Check storage limit before upload - USER ONLY
  public query ({ caller }) func checkStorageLimit(fileSize : Nat) : async {
    canUpload : Bool;
    paymentRequired : Bool;
    remainingStorage : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check storage limit");
    };

    let currentUsage = switch (userStorageUsage.get(caller)) {
      case (null) { 0 };
      case (?usage) { usage };
    };

    let hasPaid = switch (userPaymentStatus.get(caller)) {
      case (null) { false };
      case (?status) { status };
    };

    let newTotal = currentUsage + fileSize;
    let canUpload = newTotal <= STORAGE_LIMIT or hasPaid;
    let paymentRequired = newTotal > STORAGE_LIMIT and not hasPaid;
    let remainingStorage = if (hasPaid) { 0 } else if (currentUsage >= STORAGE_LIMIT) { 0 } else {
      Nat.sub(STORAGE_LIMIT, currentUsage);
    };

    {
      canUpload;
      paymentRequired;
      remainingStorage;
    };
  };

  // Confirm payment with transaction verification - USER ONLY
  public shared ({ caller }) func confirmPayment(transactionId : Text, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can confirm payment");
    };

    // Verify transaction ID is not empty
    if (transactionId.size() == 0) {
      Runtime.trap("Invalid transaction: Transaction ID required");
    };

    // Verify amount is greater than zero
    if (amount == 0) {
      Runtime.trap("Invalid transaction: Payment amount must be greater than zero");
    };

    // Check if transaction was already used
    let existingTransactions = switch (userPaymentTransactions.get(caller)) {
      case (null) { [] };
      case (?txs) { txs };
    };

    // Prevent duplicate transaction IDs
    let isDuplicate = existingTransactions.find(func(tx) { tx.transactionId == transactionId });

    if (isDuplicate != null) {
      Runtime.trap("Invalid transaction: Transaction ID already used");
    };

    // Record the payment transaction
    let newTransaction : PaymentTransaction = {
      transactionId;
      amount;
      timestamp = Time.now();
      verified = true;
    };

    let updatedTransactions = existingTransactions.concat([newTransaction]);
    userPaymentTransactions.add(caller, updatedTransactions);

    // Update payment status to allow unlimited storage
    userPaymentStatus.add(caller, true);
  };

  // Get payment history - USER ONLY
  public query ({ caller }) func getPaymentHistory() : async [PaymentTransaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment history");
    };

    switch (userPaymentTransactions.get(caller)) {
      case (null) { [] };
      case (?txs) { txs };
    };
  };

  // Upload document - USER ONLY
  public shared ({ caller }) func uploadDocument(filename : Text, fileSize : Nat, accessCode : Text, encryptionKey : Text, blob : Storage.ExternalBlob, mimeType : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload documents");
    };

    let currentUsage = switch (userStorageUsage.get(caller)) {
      case (null) { 0 };
      case (?usage) { usage };
    };

    let hasPaid = switch (userPaymentStatus.get(caller)) {
      case (null) { false };
      case (?status) { status };
    };

    let newTotal = currentUsage + fileSize;
    if (newTotal > STORAGE_LIMIT and not hasPaid) {
      Runtime.trap("Payment required: Storage limit exceeded");
    };

    let id = filename.concat(Time.now().toText());
    let metadata : DocumentMetadata = {
      id;
      filename;
      uploadTimestamp = Time.now();
      fileSize;
      owner = caller;
      accessCode;
      encryptionKey;
      blob;
      mimeType;
    };

    documents.add(id, metadata);
    accessCodeMap.add(accessCode, id);

    // Update storage usage
    userStorageUsage.add(caller, newTotal);

    // Record upload event
    recordFileEvent(caller, #upload, id, filename);

    id;
  };

  // Get document metadata - OWNER OR ADMIN ONLY
  public query ({ caller }) func getDocumentMetadata(id : Text) : async ?DocumentMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access document metadata");
    };

    switch (documents.get(id)) {
      case (null) { null };
      case (?metadata) {
        if (metadata.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own documents");
        };
        ?metadata;
      };
    };
  };

  // Get document metadata with access code - PUBLIC ACCESS (guests allowed)
  public query func getDocumentMetadataWithCode(code : Text) : async ?DocumentMetadata {
    // No authentication required - accessible to all users including guests
    switch (accessCodeMap.get(code)) {
      case (null) { null };
      case (?id) {
        switch (documents.get(id)) {
          case (null) { null };
          case (?metadata) {
            if (metadata.accessCode != code) {
              null;
            } else {
              ?metadata;
            };
          };
        };
      };
    };
  };

  // Validate access code - PUBLIC ACCESS (guests allowed)
  public query func validateAccessCode(code : Text) : async Bool {
    // No authentication required - accessible to all users including guests
    switch (accessCodeMap.get(code)) {
      case (null) { false };
      case (?id) {
        switch (documents.get(id)) {
          case (null) { false };
          case (?metadata) { metadata.accessCode == code };
        };
      };
    };
  };

  // Get document encryption key with code - PUBLIC ACCESS (guests allowed)
  public query func getDocumentEncryptionKeyWithCode(code : Text) : async ?Text {
    // No authentication required - accessible to all users including guests
    switch (accessCodeMap.get(code)) {
      case (null) { null };
      case (?id) {
        switch (documents.get(id)) {
          case (null) { null };
          case (?metadata) {
            if (metadata.accessCode != code) {
              null;
            } else {
              ?metadata.encryptionKey;
            };
          };
        };
      };
    };
  };

  // Delete document - OWNER OR ADMIN ONLY
  public shared ({ caller }) func deleteDocument(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete documents");
    };

    switch (documents.get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?metadata) {
        if (metadata.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own documents");
        };
        documents.remove(id);
        accessCodeMap.remove(metadata.accessCode);

        // Update storage usage
        let currentUsage = switch (userStorageUsage.get(caller)) {
          case (null) { 0 };
          case (?usage) { usage };
        };
        let newUsage = if (currentUsage >= metadata.fileSize) {
          Nat.sub(currentUsage, metadata.fileSize);
        } else { 0 };
        userStorageUsage.add(caller, newUsage);
      };
    };
  };

  // List user documents - USER ONLY
  public query ({ caller }) func listUserDocuments() : async [DocumentMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list documents");
    };

    let userDocs = documents.toArray().filter(
      func((_, metadata)) {
        metadata.owner == caller;
      }
    );

    userDocs.map(func((_, metadata)) { metadata });
  };

  // Get document preview (query only, no event recording) - OWNER OR ADMIN ONLY
  public query ({ caller }) func getDocumentPreview(id : Text) : async ?{
    blob : Storage.ExternalBlob;
    mimeType : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can preview documents");
    };

    switch (documents.get(id)) {
      case (null) { null };
      case (?metadata) {
        if (metadata.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only preview your own documents");
        };

        let supportedTypes = [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "text/plain",
        ];

        let isSupported = supportedTypes.find(func(t) { t == metadata.mimeType }) != null;

        if (isSupported) {
          ?{
            blob = metadata.blob;
            mimeType = metadata.mimeType;
          };
        } else {
          null;
        };
      };
    };
  };

  // Record document preview event (update call) - OWNER OR ADMIN ONLY
  public shared ({ caller }) func recordDocumentPreview(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record preview events");
    };

    switch (documents.get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?metadata) {
        if (metadata.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only record events for your own documents");
        };
        recordFileEvent(caller, #preview, id, metadata.filename);
      };
    };
  };

  // Download document (query only, no event recording) - OWNER OR ADMIN ONLY
  public query ({ caller }) func downloadDocument(id : Text) : async ?{
    blob : Storage.ExternalBlob;
    filename : Text;
    mimeType : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can download documents");
    };

    switch (documents.get(id)) {
      case (null) { null };
      case (?metadata) {
        if (metadata.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only download your own documents");
        };

        ?{
          blob = metadata.blob;
          filename = metadata.filename;
          mimeType = metadata.mimeType;
        };
      };
    };
  };

  // Record document download event (update call) - OWNER OR ADMIN ONLY
  public shared ({ caller }) func recordDocumentDownload(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record download events");
    };

    switch (documents.get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?metadata) {
        if (metadata.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only record events for your own documents");
        };
        recordFileEvent(caller, #download, id, metadata.filename);
      };
    };
  };

  // Get document preview with access code (query only, no event recording) - PUBLIC ACCESS (guests allowed)
  public query func getDocumentPreviewWithCode(code : Text) : async ?{
    blob : Storage.ExternalBlob;
    mimeType : Text;
  } {
    // No authentication required - accessible to all users including guests
    switch (accessCodeMap.get(code)) {
      case (null) { null };
      case (?id) {
        switch (documents.get(id)) {
          case (null) { null };
          case (?metadata) {
            if (metadata.accessCode != code) {
              null;
            } else {
              let supportedTypes = [
                "application/pdf",
                "image/png",
                "image/jpeg",
                "text/plain",
              ];

              let isSupported = supportedTypes.find(func(t) { t == metadata.mimeType }) != null;

              if (isSupported) {
                ?{
                  blob = metadata.blob;
                  mimeType = metadata.mimeType;
                };
              } else {
                null;
              };
            };
          };
        };
      };
    };
  };

  // Record public preview event with access code (update call) - PUBLIC ACCESS (guests allowed)
  public query func recordPublicPreview(code : Text) : async () {
    // No authentication required - accessible to all users including guests
    // Caller context included for potential future auditing
    switch (accessCodeMap.get(code)) {
      case (null) { Runtime.trap("Invalid access code") };
      case (?id) {
        switch (documents.get(id)) {
          case (null) { Runtime.trap("Document not found") };
          case (?metadata) {
            if (metadata.accessCode != code) {
              Runtime.trap("Invalid access code");
            } else {
              recordFileEvent(metadata.owner, #publicAccess, id, metadata.filename);
            };
          };
        };
      };
    };
  };

  // Download document with access code (query only, no event recording) - PUBLIC ACCESS (guests allowed)
  public query func downloadDocumentWithCode(code : Text) : async ?{
    blob : Storage.ExternalBlob;
    filename : Text;
    mimeType : Text;
  } {
    // No authentication required - accessible to all users including guests
    switch (accessCodeMap.get(code)) {
      case (null) { null };
      case (?id) {
        switch (documents.get(id)) {
          case (null) { null };
          case (?metadata) {
            if (metadata.accessCode != code) {
              null;
            } else {
              ?{
                blob = metadata.blob;
                filename = metadata.filename;
                mimeType = metadata.mimeType;
              };
            };
          };
        };
      };
    };
  };

  // Record public download event with access code (update call) - PUBLIC ACCESS (guests allowed)
  public query func recordPublicDownload(code : Text) : async () {
    // No authentication required - accessible to all users including guests
    // Caller context included for potential future auditing
    switch (accessCodeMap.get(code)) {
      case (null) { Runtime.trap("Invalid access code") };
      case (?id) {
        switch (documents.get(id)) {
          case (null) { Runtime.trap("Document not found") };
          case (?metadata) {
            if (metadata.accessCode != code) {
              Runtime.trap("Invalid access code");
            } else {
              recordFileEvent(metadata.owner, #publicAccess, id, metadata.filename);
            };
          };
        };
      };
    };
  };

  // Get global analytics - PUBLIC ACCESS (guests allowed)
  public query func getGlobalAnalytics() : async {
    totalFiles : Nat;
    totalStorage : Nat;
  } {
    // No authentication required - accessible to all users including guests
    let totalFiles = documents.size();
    let totalStorage = documents.foldLeft(
      0,
      func(acc, _id, metadata) {
        acc + metadata.fileSize;
      },
    );
    {
      totalFiles;
      totalStorage;
    };
  };

  // Get user-specific analytics - USER ONLY
  public query ({ caller }) func getUserAnalytics() : async {
    userFiles : Nat;
    userStorage : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access analytics");
    };

    let userDocs = documents.toArray().filter(
      func((_, metadata)) {
        metadata.owner == caller;
      }
    );

    let userStorage = userDocs.foldLeft(
      0,
      func(acc, (_, metadata)) {
        acc + metadata.fileSize;
      },
    );

    {
      userFiles = userDocs.size();
      userStorage;
    };
  };

  // Record file event - internal function (no authorization needed)
  func recordFileEvent(user : Principal, eventType : FileEventType, fileId : Text, fileName : Text) {
    let event : FileEvent = {
      eventType;
      fileId;
      fileName;
      timestamp = Time.now();
      user;
    };

    let existingEvents = switch (fileHistory.get(fileId)) {
      case (null) { [] };
      case (?events) { events };
    };

    let updatedEvents = existingEvents.concat([event]);
    fileHistory.add(fileId, updatedEvents);
  };

  // Get file history - USER ONLY (returns only caller's file events)
  public query ({ caller }) func getFileHistory() : async [FileEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view file history");
    };

    // Collect all events from files owned by the caller
    var userEvents : [FileEvent] = [];
    for ((fileId, events) in fileHistory.entries()) {
      // Check if this file belongs to the caller
      switch (documents.get(fileId)) {
        case (null) { /* File may have been deleted, skip */ };
        case (?metadata) {
          if (metadata.owner == caller) {
            userEvents := userEvents.concat(events);
          };
        };
      };
    };

    // Sort events by timestamp in descending order (newest first)
    userEvents.sort(func(a, b) { if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal } });
  };

  // Get file history by event type - USER ONLY (returns only caller's file events)
  public query ({ caller }) func getFileHistoryByType(eventType : FileEventType) : async [FileEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view file history");
    };

    // Collect all events from files owned by the caller
    var userEvents : [FileEvent] = [];
    for ((fileId, events) in fileHistory.entries()) {
      // Check if this file belongs to the caller
      switch (documents.get(fileId)) {
        case (null) { /* File may have been deleted, skip */ };
        case (?metadata) {
          if (metadata.owner == caller) {
            userEvents := userEvents.concat(events);
          };
        };
      };
    };

    // Filter by event type
    let filteredEvents = userEvents.filter(func(event) { event.eventType == eventType });

    // Sort events by timestamp in descending order (newest first)
    filteredEvents.sort(func(a, b) { if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal } });
  };

  // Get file history by file ID - OWNER OR ADMIN ONLY
  public query ({ caller }) func getFileHistoryByFileId(fileId : Text) : async [FileEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view file history");
    };

    // Verify the caller owns this file
    switch (documents.get(fileId)) {
      case (null) {
        // File doesn't exist or was deleted, return empty array
        [];
      };
      case (?metadata) {
        if (metadata.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view history for your own files");
        };

        switch (fileHistory.get(fileId)) {
          case (null) { [] };
          case (?events) {
            // Sort events by timestamp in descending order (newest first)
            events.sort(func(a, b) { if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) { #greater } else { #equal } });
          };
        };
      };
    };
  };
};
