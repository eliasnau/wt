"use server";

import { z } from "zod";
import { projectId, teamId, vercel } from "./vercel";

function checkAuth() {
  return;
}
function checkAddRateLimit() {
  return;
}
function checkGetRateLimit() {
  return;
}

const ErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const addDomain = async (domain: string) => {
  checkAuth();
  checkAddRateLimit();

  await vercel.projects
    .addProjectDomain({
      idOrName: projectId,
      teamId,
      requestBody: {
        name: domain,
      },
    })
    .catch((error) => {
      if ("body" in error) {
        const errorBody =
          typeof error.body === "string" ? JSON.parse(error.body) : error.body;
        const parsedError = ErrorSchema.safeParse(errorBody);
        if (
          parsedError.success &&
          parsedError.data.error.code === "not_found"
        ) {
          return null;
        }
      }
      throw error;
    });

  const status = await getDomainStatus(domain);
  return status;
};

export type DNSRecord = {
  type: "CNAME" | "TXT" | "A";
  name: string;
  value: string;
  ttl?: string;
};

type DomainStatus =
  | {
      status: "Pending Verification" | "Invalid Configuration";
      dnsRecordsToSet: DNSRecord;
    }
  | {
      status: "Domain is not added" | "Valid Configuration";
      dnsRecordsToSet: null;
    };

export async function getDomainStatus(domain: string): Promise<DomainStatus> {
  checkAuth();
  checkGetRateLimit();
  const [projectDomain, config] = await Promise.allSettled([
    vercel.projects.getProjectDomain({
      idOrName: projectId,
      teamId,
      domain,
    }),
    vercel.domains.getDomainConfig({
      teamId,
      domain,
    }),
    vercel.projects.verifyProjectDomain({
      idOrName: projectId,
      teamId,
      domain,
    }),
  ]);

  if (projectDomain.status === "rejected") {
    return {
      status: "Domain is not added", // todo: handle this better
      dnsRecordsToSet: null,
    };
  }

  if (config.status === "rejected") {
    return {
      status: "Domain is not added", // todo: handle this better
      dnsRecordsToSet: null,
    };
  }

  const verificationTxt = projectDomain.value.verification?.at(0)?.value;

  if (verificationTxt) {
    return {
      status: "Pending Verification",
      dnsRecordsToSet: {
        name: "_vercel",
        type: "TXT",
        value: verificationTxt,
      },
    };
  }

  if (config.value.misconfigured) {
    const isApex = projectDomain.value.apexName === domain;
    const dnsRecord: DNSRecord = isApex
      ? {
          name: "@",
          type: "A",
          value: "76.76.21.21",
        }
      : {
          name: projectDomain.value.name.replace(
            projectDomain.value.apexName,
            ""
          ),
          type: "CNAME",
          value: "domain-connect.codity.app",
        };
    return {
      status: "Invalid Configuration",
      dnsRecordsToSet: dnsRecord,
    };
  }

  return {
    status: "Valid Configuration",
    dnsRecordsToSet: null,
  };
}
