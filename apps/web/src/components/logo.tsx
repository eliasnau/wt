import type React from "react";

export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    fill="currentColor"
    viewBox="0 0 246 246"
    fillRule="evenodd"
    clipRule="evenodd"
    strokeLinejoin="round"
    strokeMiterlimit={2}
    {...props}
  >
    <path d="M122.88,91.109l34.221,34.871l-34.221,34.871l-34.221,-34.871l34.221,-34.871Z" />
    <path d="M199.168,125.98l-54.588,-54.588l24.238,-24.238c0,-0 51.967,51.966 71.512,71.511c4.04,4.04 4.04,10.59 0,14.63c-19.545,19.545 -71.512,71.511 -71.512,71.511l-24.238,-24.238l54.588,-54.588Z" />
    <path d="M46.592,125.98l54.588,54.588l-24.238,24.238c-0,0 -51.967,-51.966 -71.512,-71.511c-4.04,-4.04 -4.04,-10.59 -0,-14.63c19.545,-19.545 71.512,-71.511 71.512,-71.511l24.238,24.238l-54.588,54.588Z" />
  </svg>
);

export const Logo = (props: React.ComponentProps<"svg">) => (
  <LogoIcon {...props} />
);
