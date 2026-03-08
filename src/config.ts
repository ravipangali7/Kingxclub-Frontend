/**
 * Home page variant: which layout and content to show at "/".
 * Override with VITE_HOME_PAGE=first | second in .env
 */
// export const HOME_PAGE_VARIANT =
//   (import.meta.env.VITE_HOME_PAGE as string)?.trim()?.toLowerCase() === "second"
//     ? "second"
//     : "first";
export const HOME_PAGE_VARIANT = "second";
// export const HOME_PAGE_VARIANT = "first";

export type HomePageVariant = "first" | "second";

/**
 * Play mode: how the game is launched when user clicks "Play".
 * Override with VITE_PLAY_MODE=new_tab | iframe | in_same_tab in .env
 */
export type PlayMode = "new_tab" | "iframe" | "in_same_tab";

const rawPlayMode = (import.meta.env.VITE_PLAY_MODE as string)?.trim()?.toLowerCase() ?? "in_same_tab";
const validModes: PlayMode[] = ["new_tab", "iframe", "in_same_tab"];
export const PLAY_MODE: PlayMode = validModes.includes(rawPlayMode as PlayMode) ? (rawPlayMode as PlayMode) : "in_same_tab";
