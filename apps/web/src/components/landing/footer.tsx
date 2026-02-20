import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GithubIcon } from "lucide-react";
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
    href: "#",
    label: "X",
    icon: <XIcon />,
  },
  {
    href: "https://github.com/eliasnau/wt",
    label: "Github",
    icon: <GithubIcon />,
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
          <div className="flex items-center gap-2">
            <Logo className="h-4.5" />
          </div>
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
