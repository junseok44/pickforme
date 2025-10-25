export interface ISearchInputProps {
  placeholder?: string;
  onChange?(value: string): void;
  onSubmit?(value: string): void;
}
