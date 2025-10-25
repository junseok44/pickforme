import type { ISetting } from "@types";

export interface IInfoForm {
  value?: ISetting;
  onChange?(value: ISetting): void;
}
