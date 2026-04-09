import Map "mo:core/Map";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Types "../types/documents";
import Common "../types/common";

// Domain logic for folder/tag operations on documents
module {
  // Collect distinct folder names owned by a given principal
  public func listUserFolders(
    docs : Map.Map<Text, Types.DocumentMetadata>,
    owner : Common.UserId,
  ) : [Text] {
    Runtime.trap("not implemented");
  };

  // Collect distinct tag names owned by a given principal
  public func listUserTags(
    docs : Map.Map<Text, Types.DocumentMetadata>,
    owner : Common.UserId,
  ) : [Text] {
    Runtime.trap("not implemented");
  };

  // Update folders and tags on an existing document; returns updated metadata or error
  public func updateDocumentFoldersTags(
    docs : Map.Map<Text, Types.DocumentMetadata>,
    caller : Common.UserId,
    id : Text,
    folders : [Text],
    tags : [Text],
  ) : Common.Result<Types.DocumentMetadata> {
    Runtime.trap("not implemented");
  };
};
