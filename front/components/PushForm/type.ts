import type { IPush } from "@types";

export interface IPushForm {
  value?: IPush;
  onChange?(value: IPush): void;
}
