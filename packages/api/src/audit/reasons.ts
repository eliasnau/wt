import type { AuditDenialReasonDefinition } from "./types";

export const auditDenialReasons = {
  NOT_AUTHENTICATED: {
    code: "NOT_AUTHENTICATED",
    name: "Nicht angemeldet",
    description: "Der Actor hatte keine gueltige Session.",
    category: "auth",
  },
  NOT_PLATFORM_ADMIN: {
    code: "NOT_PLATFORM_ADMIN",
    name: "Kein Platform Admin",
    description: "Der Actor ist kein Platform Admin.",
    category: "admin",
  },
  PERMISSION_DENIED: {
    code: "PERMISSION_DENIED",
    name: "Berechtigung fehlt",
    description: "Der Actor hatte nicht die benoetigte Organisationsberechtigung.",
  },
  USER_BANNED: {
    code: "USER_BANNED",
    name: "Benutzer gesperrt",
    description: "Der betroffene Benutzer ist gesperrt.",
    category: "auth",
  },
  TWO_FACTOR_REQUIRED: {
    code: "TWO_FACTOR_REQUIRED",
    name: "2FA erforderlich",
    description: "Die Aktion erfordert eine abgeschlossene Zwei-Faktor-Pruefung.",
    category: "auth",
  },
  INVALID_CREDENTIALS: {
    code: "INVALID_CREDENTIALS",
    name: "Ungueltige Zugangsdaten",
    description: "Die angegebenen Zugangsdaten waren falsch.",
    category: "auth",
  },
  ORG_NOT_FOUND: {
    code: "ORG_NOT_FOUND",
    name: "Organisation nicht gefunden",
    description: "Die Organisation existiert nicht oder ist nicht sichtbar.",
    category: "organization",
  },
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    name: "Benutzer nicht gefunden",
    description: "Der Zielbenutzer existiert nicht.",
    category: "admin",
  },
  ALREADY_EXISTS: {
    code: "ALREADY_EXISTS",
    name: "Existiert bereits",
    description: "Die Zielressource existiert bereits.",
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    name: "Nicht gefunden",
    description: "Die Zielressource wurde nicht gefunden.",
  },
  INVALID_STATE: {
    code: "INVALID_STATE",
    name: "Ungueltiger Zustand",
    description: "Die Ressource befindet sich nicht im erwarteten Zustand.",
  },
  VALIDATION_FAILED: {
    code: "VALIDATION_FAILED",
    name: "Validierung fehlgeschlagen",
    description: "Die Eingabe war ungueltig oder unvollstaendig.",
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    name: "Rate Limit erreicht",
    description: "Die Aktion wurde wegen zu vieler Anfragen abgelehnt.",
  },
  BACKEND_UNAVAILABLE: {
    code: "BACKEND_UNAVAILABLE",
    name: "Backend nicht verfuegbar",
    description: "Die Aktion konnte wegen eines Backend-Problems nicht ausgefuehrt werden.",
  },
} satisfies Record<string, AuditDenialReasonDefinition>;

export type AuditDenialReasonCode = keyof typeof auditDenialReasons;

export function getAuditDenialReason(code: AuditDenialReasonCode) {
  return auditDenialReasons[code];
}
