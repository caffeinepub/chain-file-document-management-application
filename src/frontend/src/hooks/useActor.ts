import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { ActorInterface } from "../types";

export function useActor(): {
  actor: ActorInterface | null;
  isFetching: boolean;
} {
  const result = _useActor(createActor);
  return result as { actor: ActorInterface | null; isFetching: boolean };
}
