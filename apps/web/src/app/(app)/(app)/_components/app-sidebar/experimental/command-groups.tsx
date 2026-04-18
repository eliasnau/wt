import {
  BarChart3Icon,
  BookOpenIcon,
  BriefcaseIcon,
  CreditCardIcon,
  HelpCircleIcon,
  LayoutGridIcon,
  PlugIcon,
  SettingsIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

export type CommandItemType = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: CommandItemType[];
};

export type CommandGroupType = {
  value: string;
  items: CommandItemType[];
};

export type IndexedCommandItem = CommandItemType & {
  breadcrumb?: string;
  isIndexedChild?: boolean;
  group: string;
};

const iconClassName = "mr-2 h-4 w-4 shrink-0 opacity-80";

export const commandGroups: CommandGroupType[] = [
  {
    value: "Produkt",
    items: [
      {
        value: "dashboard",
        label: "Dashboard",
        icon: <LayoutGridIcon className={iconClassName} />,
        path: "/dashboard",
      },
      {
        value: "members",
        label: "Mitglieder",
        icon: <UsersIcon className={iconClassName} />,
        path: "/dashboard/members",
      },
      {
        value: "groups",
        label: "Gruppen",
        icon: <BriefcaseIcon className={iconClassName} />,
        path: "/dashboard/groups",
      },
      {
        value: "ai-assistant",
        label: "KI-Assistent (Beta)",
        icon: <SparklesIcon className={iconClassName} />,
        path: "/dashboard/ai",
      },
      {
        value: "statistics",
        label: "Statistiken",
        icon: <BarChart3Icon className={iconClassName} />,
        path: "/dashboard/statistics",
        children: [
          {
            value: "statistics-overview",
            label: "Übersicht",
            icon: <BarChart3Icon className={iconClassName} />,
            path: "/dashboard/statistics/overview",
          },
          {
            value: "statistics-range",
            label: "Monate vergleichen",
            icon: <BarChart3Icon className={iconClassName} />,
            path: "/dashboard/statistics/range",
          },
          {
            value: "statistics-map",
            label: "Karte",
            icon: <BarChart3Icon className={iconClassName} />,
            path: "/dashboard/statistics/map",
          },
        ],
      },
    ],
  },
  {
    value: "Arbeitsbereich",
    items: [
      {
        value: "finance",
        label: "Finanzen",
        icon: <CreditCardIcon className={iconClassName} />,
        path: "/dashboard/finance",
        children: [
          {
            value: "finance-invoices",
            label: "Rechnungen",
            icon: <CreditCardIcon className={iconClassName} />,
            path: "/dashboard/finance/invoices",
          },
          {
            value: "finance-sepa-batches",
            label: "SEPA-Läufe",
            icon: <CreditCardIcon className={iconClassName} />,
            path: "/dashboard/finance/sepa-batches",
          },
          {
            value: "finance-credits",
            label: "Gutschriften",
            icon: <CreditCardIcon className={iconClassName} />,
            path: "/dashboard/finance/credits",
          },
        ],
      },
      {
        value: "self-service",
        label: "Selbstservice",
        icon: <PlugIcon className={iconClassName} />,
        path: "/dashboard/self-service",
        children: [
          {
            value: "self-service-registrations",
            label: "Anmeldungen",
            icon: <PlugIcon className={iconClassName} />,
            path: "/dashboard/self-service/registrations",
          },
        ],
      },
    ],
  },
  {
    value: "Verwaltung",
    items: [
      {
        value: "settings",
        label: "Einstellungen",
        icon: <SettingsIcon className={iconClassName} />,
        path: "/dashboard/settings",
        children: [
          {
            value: "settings-general",
            label: "Allgemein",
            icon: <SettingsIcon className={iconClassName} />,
            path: "/dashboard/settings/general",
          },
          {
            value: "settings-billing",
            label: "Abrechnung",
            icon: <SettingsIcon className={iconClassName} />,
            path: "/dashboard/settings/billing",
          },
          {
            value: "settings-users",
            label: "Benutzer",
            icon: <SettingsIcon className={iconClassName} />,
            path: "/dashboard/settings/users",
          },
          {
            value: "settings-sepa",
            label: "SEPA",
            icon: <SettingsIcon className={iconClassName} />,
            path: "/dashboard/settings/sepa",
          },
        ],
      },
    ],
  },
  {
    value: "Konto",
    items: [
      {
        value: "account",
        label: "Konto",
        icon: <UserIcon className={iconClassName} />,
        path: "/account",
        children: [
          {
            value: "account-general",
            label: "Allgemein",
            icon: <UserIcon className={iconClassName} />,
            path: "/account",
          },
          {
            value: "account-customization",
            label: "Anpassung",
            icon: <SlidersHorizontalIcon className={iconClassName} />,
            path: "/account/customization",
          },
          {
            value: "account-security",
            label: "Sicherheit",
            icon: <ShieldIcon className={iconClassName} />,
            path: "/account/security",
          },
        ],
      },
    ],
  },
  {
    value: "Ressourcen",
    items: [
      {
        value: "help-center",
        label: "Hilfezentrum",
        icon: <HelpCircleIcon className={iconClassName} />,
        path: "/account",
      },
      {
        value: "documentation",
        label: "Dokumentation",
        icon: <BookOpenIcon className={iconClassName} />,
        path: "/dashboard/ai",
      },
    ],
  },
];
