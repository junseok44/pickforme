import { atom } from "jotai";

import { atomWithStorage } from "./utils";

import type { ISetting, IModal } from "@types";

export const isLoadedAtom = atomWithStorage<"true" | "false">(
  "isLoaded",
  "false"
);

export const settingAtom = atomWithStorage<ISetting>("setting", {
  isReady: false,
});

export const modalAtom = atom<IModal>({});
