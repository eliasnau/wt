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
  title: "Nutzungsbedingungen",
  description: "Nutzungsbedingungen fur die Nutzung von Matdesk.",
};

const sections = [
  {
    id: "geltungsbereich",
    title: "1. Geltungsbereich",
    body: [
      "Diese Nutzungsbedingungen gelten fur alle Besucherinnen und Besucher sowie registrierte Nutzerinnen und Nutzer von Matdesk. Mit dem Zugriff auf die Website oder der Nutzung der Plattform akzeptieren Sie diese Bedingungen in der jeweils aktuellen Fassung.",
      "Wenn Sie im Namen einer Organisation handeln, bestatigen Sie, dass Sie berechtigt sind, diese Organisation rechtsverbindlich zu vertreten.",
    ],
  },
  {
    id: "konto",
    title: "2. Konto und Zugang",
    body: [
      "Fur bestimmte Funktionen ist ein Benutzerkonto erforderlich. Sie sind verantwortlich fur die Vertraulichkeit Ihrer Zugangsdaten sowie fur alle Aktivitaten, die uber Ihr Konto erfolgen.",
      "Sie verpflichten sich, korrekte und aktuelle Angaben zu machen und Ihr Passwort sicher aufzubewahren.",
    ],
  },
  {
    id: "nutzung",
    title: "3. Zulassige Nutzung",
    body: [
      "Die Nutzung von Matdesk ist nur im Rahmen geltender Gesetze zulassig. Untersagt sind insbesondere missbrauchliche, storende oder schadigende Handlungen gegenuber der Plattform, anderen Nutzerinnen und Nutzern oder Dritten.",
    ],
    bullets: [
      "kein unbefugter Zugriff auf Systeme, Daten oder Konten",
      "keine Verbreitung rechtswidriger, schadlicher oder irrefuhrender Inhalte",
      "keine Umgehung technischer Schutzmassnahmen",
      "kein Reverse Engineering, soweit gesetzlich nicht zwingend erlaubt",
    ],
  },
  {
    id: "preise",
    title: "4. Preise und Leistungen",
    body: [
      "Leistungsumfang, Preise und Abrechnungsintervalle ergeben sich aus dem jeweils gebuchten Tarif. Wir konnen Funktionen weiterentwickeln, anpassen oder einstellen, sofern dadurch keine zwingenden gesetzlichen Rechte eingeschrankt werden.",
      "Preisanderungen fur laufende Abonnements werden rechtzeitig vor Inkrafttreten kommuniziert.",
    ],
  },
  {
    id: "haftung",
    title: "5. Haftung",
    body: [
      "Wir haften unbeschrankt bei Vorsatz und grober Fahrlassigkeit sowie bei Verletzung von Leben, Korper oder Gesundheit. Bei leicht fahrlassiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.",
      "Im Ubrigen ist die Haftung ausgeschlossen, soweit gesetzlich zulassig.",
    ],
  },
  {
    id: "beendigung",
    title: "6. Laufzeit und Beendigung",
    body: [
      "Sie konnen Ihr Konto jederzeit im Rahmen der vertraglichen Vereinbarungen kundigen. Wir konnen Konten bei schwerwiegenden oder wiederholten Verstoessen gegen diese Bedingungen sperren oder beenden.",
      "Gesetzliche Aufbewahrungspflichten und offene Zahlungsanspruche bleiben davon unberuhrt.",
    ],
  },
  {
    id: "recht",
    title: "7. Anwendbares Recht",
    body: [
      "Es gilt das anwendbare Recht am Sitz des Anbieters, soweit keine zwingenden Verbraucherschutzvorschriften entgegenstehen. Gerichtsstand ist, soweit zulassig, der Sitz des Anbieters.",
    ],
  },
];

export default async function TermsPage() {
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
              Rechtliches
            </p>
            <h1 className="max-w-3xl text-balance font-medium text-4xl leading-tight tracking-tight md:text-5xl">
              Nutzungsbedingungen
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground text-sm md:text-base">
              Diese Bedingungen regeln die Nutzung von Matdesk und beschreiben
              die Rechte und Pflichten zwischen Ihnen und uns.
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
