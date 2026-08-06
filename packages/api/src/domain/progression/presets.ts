function rank(name: string, color: string | null): readonly [string, string | null] {
  return [name, color];
}

export const progressionPresets = {
  judo_djb: {
    name: "Judo (DJB)",
    unitLabel: "Graduierung",
    mode: "sequential" as const,
    source: "Deutscher Judo-Bund, Graduierungsordnung 2023",
    ranks: [
      ["8. Kyu (Weiß-Gelb)", "#facc15"],
      ["7. Kyu (Gelb)", "#facc15"],
      ["6. Kyu (Gelb-Orange)", "#f97316"],
      ["5. Kyu (Orange)", "#f97316"],
      ["4. Kyu (Orange-Grün)", "#22c55e"],
      ["3. Kyu (Grün)", "#22c55e"],
      ["2. Kyu (Blau)", "#3b82f6"],
      ["1. Kyu (Braun)", "#92400e"],
      ...Array.from({ length: 9 }, (_, index) => rank(`${index + 1}. Dan (Schwarz)`, "#111827")),
    ],
  },
  taekwondo_dtu: {
    name: "Taekwondo (DTU)",
    unitLabel: "Graduierung",
    mode: "sequential" as const,
    source: "Deutsche Taekwondo Union, Prüfungsordnung 2024",
    ranks: [
      ["10. Kup (Weiß)", "#f8fafc"],
      ["9. Kup (Weiß mit gelbem Streifen)", "#facc15"],
      ["8. Kup (Gelb)", "#facc15"],
      ["7. Kup (Gelb mit grünem Streifen)", "#22c55e"],
      ["6. Kup (Grün)", "#22c55e"],
      ["5. Kup (Grün mit blauem Streifen)", "#3b82f6"],
      ["4. Kup (Blau)", "#3b82f6"],
      ["3. Kup (Blau mit rotem Streifen)", "#ef4444"],
      ["2. Kup (Rot oder Braun)", "#ef4444"],
      ["1. Kup (Rot/Braun mit schwarzem Streifen)", "#991b1b"],
      ...Array.from({ length: 9 }, (_, index) => rank(`${index + 1}. Dan (Schwarz)`, "#111827")),
    ],
  },
  wing_tzun_wtfb: {
    name: "Wing Tzun / Wing Tzung (WTFB)",
    unitLabel: "Graduierung",
    mode: "sequential" as const,
    source: "Wing Tzun Fachschulenbund, Schüler-, Lehrer- und Meistergrade",
    ranks: [
      ...Array.from({ length: 12 }, (_, index) => rank(`${index + 1}. Schülergrad`, null)),
      ...Array.from({ length: 4 }, (_, index) => rank(`${index + 1}. Lehrergrad`, null)),
      ...Array.from({ length: 4 }, (_, index) => rank(`${index + 5}. Meistergrad`, null)),
    ],
  },
} satisfies Record<
  string,
  {
    name: string;
    unitLabel: string;
    mode: "sequential" | "collection";
    source: string;
    ranks: Array<readonly [string, string | null]>;
  }
>;

export type ProgressionPresetId = keyof typeof progressionPresets;
