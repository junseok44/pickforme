import { atomWithStorage } from "./utils";

import type { IUser } from "@types";

export const userAtom = atomWithStorage<IUser>("user", {});
