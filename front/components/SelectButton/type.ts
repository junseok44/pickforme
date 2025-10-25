import type { ISelectOption } from "@types";

export interface ISelectButtonProps {
  value?: string;
  items?: ISelectOption[];
  onChange?(value: string): void;
}
