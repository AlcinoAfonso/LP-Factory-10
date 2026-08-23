export type OnboardingConfigurationActionIntent =
  | "save"
  | "next"
  | "back"
  | "exit";

export type OnboardingConfigurationActionState = Readonly<{
  status: "idle" | "success" | "error";
  intent?: OnboardingConfigurationActionIntent;
  revision?: number;
  sharedRevision?: number | null;
  fieldErrors?: Readonly<Record<string, string>>;
  formError?: string;
}>;

export const initialOnboardingConfigurationActionState: OnboardingConfigurationActionState =
  { status: "idle" };

export type OnboardingCompletionActionState = Readonly<{
  status: "idle" | "success" | "error";
  landingPageId?: string;
  formError?: string;
}>;

export const initialOnboardingCompletionActionState: OnboardingCompletionActionState =
  { status: "idle" };
