import { describe, expect, it } from "vitest";

import { progressionPresets } from "./presets";

describe("progression presets", () => {
  it("contains the DJB Judo sequence from 8th Kyu through 9th Dan", () => {
    const names = progressionPresets.judo_djb.ranks.map(([name]) => name);
    expect(names).toHaveLength(17);
    expect(names.slice(0, 8)).toEqual([
      "8. Kyu (Weiß-Gelb)",
      "7. Kyu (Gelb)",
      "6. Kyu (Gelb-Orange)",
      "5. Kyu (Orange)",
      "4. Kyu (Orange-Grün)",
      "3. Kyu (Grün)",
      "2. Kyu (Blau)",
      "1. Kyu (Braun)",
    ]);
    expect(names.at(-1)).toBe("9. Dan (Schwarz)");
  });

  it("contains the DTU Kup and Dan sequence", () => {
    const names = progressionPresets.taekwondo_dtu.ranks.map(([name]) => name);
    expect(names).toHaveLength(19);
    expect(names[0]).toBe("10. Kup (Weiß)");
    expect(names[9]).toBe("1. Kup (Rot/Braun mit schwarzem Streifen)");
    expect(names.at(-1)).toBe("9. Dan (Schwarz)");
  });

  it("contains the WTFB student, teacher, and master grades without invented belt colors", () => {
    const ranks = progressionPresets.wing_tzun_wtfb.ranks;
    expect(ranks).toHaveLength(20);
    expect(ranks[0]?.[0]).toBe("1. Schülergrad");
    expect(ranks[11]?.[0]).toBe("12. Schülergrad");
    expect(ranks[12]?.[0]).toBe("1. Lehrergrad");
    expect(ranks[15]?.[0]).toBe("4. Lehrergrad");
    expect(ranks[16]?.[0]).toBe("5. Meistergrad");
    expect(ranks.at(-1)?.[0]).toBe("8. Meistergrad");
    expect(ranks.every(([, color]) => color === null)).toBe(true);
  });
});
