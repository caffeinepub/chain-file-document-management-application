import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import Runtime "mo:core/Runtime";
import DocTypes "../types/documents";
import Common "../types/common";
import DocumentsLib "../lib/documents";

// Public API mixin for folder/tag document operations
mixin (
  documents : Map.Map<Text, DocTypes.DocumentMetadata>,
  accessControlState : AccessControl.State,
) {
  // Return distinct folder names used by the calling user
  public query ({ caller }) func listUserFolders() : async [Text] {
    Runtime.trap("not implemented");
  };

  // Return distinct tag names used by the calling user
  public query ({ caller }) func listUserTags() : async [Text] {
    Runtime.trap("not implemented");
  };

  // Update folders and tags on a document owned by the caller
  public shared ({ caller }) func updateDocumentFoldersTags(
    id : Text,
    folders : [Text],
    tags : [Text],
  ) : async Common.Result<DocTypes.DocumentMetadata> {
    Runtime.trap("not implemented");
  };
};
