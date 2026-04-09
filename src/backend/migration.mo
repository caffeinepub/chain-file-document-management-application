module {
  // Old storage state type (from .old/src/backend/dist/backend.most)
  type OldStorageState = {
    var authorizedPrincipals : [Principal];
    var blobTodeletete : [Blob];
  };

  // OldActor contains the `storage` field that was removed in the new version.
  // All other fields are stable-compatible and do not need explicit migration.
  type OldActor = {
    storage : OldStorageState;
  };

  // NewActor is empty — we only need to consume the dropped `storage` field.
  // All remaining fields are either inherited (compatible) or re-initialized.
  type NewActor = {};

  // Consume the old `storage` field and discard it intentionally.
  public func run(old : OldActor) : NewActor {
    ignore old.storage;
    {};
  };
};
