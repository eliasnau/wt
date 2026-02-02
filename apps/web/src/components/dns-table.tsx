"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { type ComponentProps } from "react";
import { CopyButton } from "./animate-ui/components/buttons/copy";

export type DNSRecord = {
  type:
  | "A" // Maps a domain name or subdomain to an IPv4 address.
  | "AAAA" // Maps a domain name or subdomain to an IPv6 address.
  | "CNAME" // Creates an alias, forwarding a domain name to another domain name.
  | "MX" // Specifies the mail servers responsible for accepting email on behalf of a domain.
  | "NS" // Identifies the authoritative name servers for a domain.
  | "SOA" // Contains administrative information about the zone, such as the primary name server and contact details for the domain's administrator.
  | "PTR" // Performs a reverse lookup, mapping an IP address to a domain name.
  | "SRV" // Specifies the location (host and port) of specific services, such as instant messaging or VoIP.
  | "TXT" // Allows administrators to store arbitrary text information, often used for email sender policies (like SPF) or domain ownership verification.
  | "CAA"; // Specifies which Certificate Authorities (CAs) are allowed to issue SSL/TLS certificates for a domain.
  name: string;
  value: string;
  ttl?: string;
};

export type DNSTableProps = ComponentProps<typeof Table> & {
  records: DNSRecord[];
};

export const DNSTable = ({ records, className, ...props }: DNSTableProps) => {
  if (records.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No DNS records to display
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background",
        className
      )}
    >
      <Table {...props}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-20">TTL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record, index) => (
            <TableRow key={`${record.type}-${record.name}-${index}`}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="break-all">{record.type}</span>
                  <CopyButton content={record.type} variant={"ghost"} />
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="break-all">{record.name}</span>
                  <CopyButton content={record.name} variant={"ghost"} />

                </div>
              </TableCell>
              <TableCell className="truncate font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="max-w-md truncate break-all">
                    {record.value}
                  </span>
                  <CopyButton content={record.value} variant={"ghost"} />
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  {record.ttl || "Auto"}
                  <CopyButton content={record.ttl || "Auto"} variant={"ghost"} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
