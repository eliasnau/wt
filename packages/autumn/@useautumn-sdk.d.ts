declare module '@useautumn/sdk' {
  export const members: Feature;
  export const users: Feature;
  export const ai_messages: Feature;

  export const free: Plan;
  export const pro: Plan;
  export const enterprise: Plan;
  export const ai_credits: Plan;
  export const basic: Plan;

  export type Feature = import('./autumn.config').Feature;
  export type Plan = import('./autumn.config').Plan;
}
