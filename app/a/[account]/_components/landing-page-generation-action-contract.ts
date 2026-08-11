export type LandingPageGenerationActionState = Readonly<{
  status: "idle" | "success" | "error";
  landingPageId?: string;
  formError?: string;
}>;

export const initialLandingPageGenerationActionState: LandingPageGenerationActionState = {
  status: "idle",
};
