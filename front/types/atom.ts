export type TVision = "none" | "low" | "blind";

export interface ISetting {
  name?: string;
  vision?: TVision;
  theme?: "light" | "dark" | "default";
  isReady?: boolean;
}

export interface IModal {
  loginModal?: boolean;
  onBoardingModal?: boolean;
  lackPointModal?: boolean;
  greetingModal?: boolean;
  versionUpdateAlarmModal?: boolean;
}
