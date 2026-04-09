// Cross-cutting types shared across domains
module {
  public type UserId = Principal;
  public type Timestamp = Int; // Time.Time is Int (nanoseconds)

  public type Result<T> = {
    #ok : T;
    #err : Text;
  };
};
