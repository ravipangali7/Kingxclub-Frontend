/** Country code → flag emoji for register/login dropdown (Flag +code display). */
export const COUNTRY_CODE_TO_FLAG: Record<string, string> = {
  "977": "🇳🇵",
  "91": "🇮🇳",
  "880": "🇧🇩",
  "95": "🇲🇲",
  "971": "🇦🇪",
  "61": "🇦🇺",
};

/** Allowed country codes for registration (Nepal, India, Bangladesh, Myanmar, UAE, Australia). */
export const REGISTER_COUNTRY_CODES = ["977", "91", "880", "95", "971", "61"] as const;

/** Country options for Register (and optionally Login): label is "Flag (+code)" only, restricted to 6 countries. */
export const REGISTER_COUNTRY_OPTIONS = [
  { value: "977", label: "🇳🇵 (+977)" },
  { value: "91", label: "🇮🇳 (+91)" },
  { value: "880", label: "🇧🇩 (+880)" },
  { value: "95", label: "🇲🇲 (+95)" },
  { value: "971", label: "🇦🇪 (+971)" },
  { value: "61", label: "🇦🇺 (+61)" },
] as const;

/** @deprecated Use REGISTER_COUNTRY_OPTIONS for register page. Kept for backwards compatibility. */
export const COUNTRY_CODES = REGISTER_COUNTRY_OPTIONS;

export type CountryCodeValue = (typeof REGISTER_COUNTRY_OPTIONS)[number]["value"];
