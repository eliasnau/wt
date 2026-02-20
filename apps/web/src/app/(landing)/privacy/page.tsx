import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { LandingHotkeys } from "@/components/hotkeys/landing-hotkeys";
import { getServerSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { GridPattern } from "@/components/ui/grid-pattern";

const LAYOUT_CLASSNAME = "mx-auto max-w-5xl px-6 lg:px-8 xl:px-0";
const LAST_UPDATED = "20. Februar 2026";

export const metadata: Metadata = {
  title: "Datenschutzerklarung",
  description:
    "Datenschutzinformationen zur Verarbeitung personenbezogener Daten bei Matdesk.",
};

const sections = [
  {
    id: "einleitung",
    title: "1. Einleitung",
    body: [
      "Diese Datenschutzerklarung informiert Sie daruber, wie Matdesk personenbezogene Daten verarbeitet, wenn Sie unsere Website und Dienste nutzen.",
      "Wir behandeln Ihre Daten vertraulich und entsprechend den geltenden Datenschutzvorschriften.",
    ],
  },
  {
    id: "datenarten",
    title: "2. Welche Daten wir verarbeiten",
    body: [
      "Abhangig von der Nutzung konnen wir unterschiedliche Kategorien personenbezogener Daten verarbeiten.",
    ],
    bullets: [
      "Kontaktdaten, z. B. Name und E-Mail-Adresse",
      "Account- und Nutzungsdaten, z. B. Login-Zeitpunkte und Einstellungen",
      "Technische Daten, z. B. IP-Adresse, Browsertyp, Endgerat und Betriebssystem",
      "Kommunikationsdaten bei Anfragen an unseren Support",
    ],
  },
  {
    id: "zwecke",
    title: "3. Zwecke und Rechtsgrundlagen",
    body: [
      "Wir verarbeiten personenbezogene Daten nur, wenn eine Rechtsgrundlage besteht. Die Verarbeitung erfolgt insbesondere zur Vertragserfullung, zur Erfullung rechtlicher Pflichten oder auf Basis berechtigter Interessen.",
      "Soweit erforderlich, holen wir Ihre Einwilligung ein. Eine erteilte Einwilligung kann jederzeit mit Wirkung fur die Zukunft widerrufen werden.",
    ],
  },
  {
    id: "weitergabe",
    title: "4. Empfanger und Weitergabe",
    body: [
      "Wir geben personenbezogene Daten nur weiter, wenn dies fur die Leistungserbringung erforderlich ist, eine rechtliche Verpflichtung besteht oder Sie eingewilligt haben.",
      "Dienstleister werden von uns sorgfaltig ausgewahlt und vertraglich auf Datenschutz und Vertraulichkeit verpflichtet.",
    ],
  },
  {
    id: "speicherung",
    title: "5. Speicherdauer",
    body: [
      "Wir speichern personenbezogene Daten nur so lange, wie es fur die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.",
      "Nach Wegfall des Verarbeitungszwecks oder Ablauf gesetzlicher Fristen werden Daten geloscht oder anonymisiert.",
    ],
  },
  {
    id: "rechte",
    title: "6. Ihre Rechte",
    body: [
      "Sie haben im Rahmen der gesetzlichen Vorgaben insbesondere das Recht auf Auskunft, Berichtigung, Loschung, Einschrankung der Verarbeitung, Datenubertragbarkeit und Widerspruch.",
      "Ausserdem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehorde.",
    ],
  },
  {
    id: "kontakt",
    title: "7. Kontakt",
    body: [
      "Bei Fragen zum Datenschutz oder zur Ausubung Ihrer Rechte erreichen Sie uns unter support@matdesk.de.",
    ],
  },
];

export default async function PrivacyPage() {
  const session = await getServerSession();

  return (
    <div className="relative min-h-screen bg-background">
      <LandingHotkeys />
      <Header className={LAYOUT_CLASSNAME} session={session} />

      <main className="relative isolate overflow-hidden pb-16 md:pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_-10%,theme(--color-foreground/.1),transparent)]" />
          <GridPattern
            className="absolute inset-0 size-full stroke-foreground/10 mask-[radial-gradient(ellipse_at_center,white,transparent_75%)]"
            height={44}
            width={44}
            x={-1}
            y={-1}
          />
        </div>

        <section className={cn(LAYOUT_CLASSNAME, "pt-16 md:pt-24")}>
          <div className="fade-in slide-in-from-bottom-8 animate-in fill-mode-backwards rounded-2xl border bg-background/80 p-6 shadow-sm backdrop-blur-sm duration-500 md:p-10">
            <p className="mb-4 inline-flex rounded-full border px-3 py-1 font-medium text-muted-foreground text-xs tracking-wide uppercase">
              Datenschutz
            </p>
            <h1 className="max-w-3xl text-balance font-medium text-4xl leading-tight tracking-tight md:text-5xl">
              Datenschutzerklarung
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground text-sm md:text-base">
              Wir respektieren Ihre Privatsphare und informieren transparent
              uber Art, Umfang und Zweck der Verarbeitung personenbezogener
              Daten.
            </p>
            <div className="mt-6 grid gap-2 text-muted-foreground text-sm md:grid-cols-2">
              <p>Zuletzt aktualisiert: {LAST_UPDATED}</p>
              <p>Kontakt: support@matdesk.de</p>
            </div>
          </div>
        </section>

        <section className={cn(LAYOUT_CLASSNAME, "mt-8 md:mt-10")}>
          <div className="grid gap-4 md:grid-cols-3">
            {sections.map((section) => (
              <a
                className="rounded-lg border bg-background/60 px-4 py-3 text-muted-foreground text-sm transition-colors hover:text-foreground"
                href={`#${section.id}`}
                key={section.id}
              >
                {section.title}
              </a>
            ))}
          </div>
        </section>

        <section className={cn(LAYOUT_CLASSNAME, "mt-8 md:mt-10")}>
          <div className="space-y-4">
            {sections.map((section, index) => (
              <article
                className="fade-in slide-in-from-bottom-6 animate-in rounded-2xl border bg-background/90 p-6 duration-500 md:p-8"
                id={section.id}
                key={section.id}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <h2 className="text-balance font-medium text-2xl tracking-tight">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      className="leading-7 text-muted-foreground"
                      key={paragraph}
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer className={LAYOUT_CLASSNAME} />
    </div>
  );
}
