/** Country code options for Login and Signup (977 Nepal, 91 India). */
export const COUNTRY_CODES = [
  { value: "977", label: "Nepal (+977)" },
  { value: "91", label: "India (+91)" },
] as const;

export type CountryCodeValue = (typeof COUNTRY_CODES)[number]["value"];
