import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";

const navLinks = [
  { href: "#", label: "Features" },
  { href: "#", label: "About" },
  { href: "#", label: "Docs" },
  { href: "#", label: "Contact" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy" },
];

const socialLinks = [
  {
    href: "https://github.com/eliasnau/wt",
    label: "Github",
    icon: <GitHubIcon />,
  },
];

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("mx-auto max-w-5xl px-6 lg:px-8 xl:px-0", className)}>
      <div className="flex flex-col gap-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Logo className="h-4.5" />
            </div>{" "}
          </Link>
          <ThemeToggle />
        </div>

        <nav>
          <ul className="flex flex-wrap gap-4 font-medium text-muted-foreground text-sm md:gap-6">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a className="hover:text-foreground" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex items-center justify-between gap-4 border-t py-4 text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Matdesk</p>

        <div className="flex items-center gap-3">
          {/*<p className="inline-flex items-center gap-1">
            <span>Built by</span>
            <a
              aria-label="x/twitter"
              className="inline-flex items-center gap-1 text-foreground/80 hover:text-foreground hover:underline"
              href="https://codity.app"
              rel="noreferrer"
              target="_blank"
            >
              <img
                alt="shaban"
                className="size-4 rounded-full"
                height="auto"
                src="https://codity.app/favicon.ico"
                width="auto"
              />
              Codity
            </a>
          </p>
          <span className="block h-4 border-l" />*/}
          <div className="flex items-center">
            {socialLinks.map(({ href, label, icon }) => (
              <Button
                key={label}
                size="icon-sm"
                variant="ghost"
                render={
                  <Link
                    aria-label={label}
                    href={href as Route}
                    target="_blank"
                  />
                }
              >
                {icon}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function XIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="m18.9,1.153h3.682l-8.042,9.189,9.46,12.506h-7.405l-5.804-7.583-6.634,7.583H.469l8.6-9.831L0,1.153h7.593l5.241,6.931,6.065-6.931Zm-1.293,19.494h2.039L6.482,3.239h-2.19l13.314,17.408Z" />
    </svg>
  );
}

function GitHubIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
