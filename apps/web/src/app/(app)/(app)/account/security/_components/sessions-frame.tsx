"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { Button } from "@/components/ui/button";
import { UAParser } from "ua-parser-js";
import { Frame, FramePanel, FrameFooter } from "@/components/ui/frame";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "sonner";
import { Loader2, Laptop, AlertCircle } from "lucide-react";
import { Chrome } from "@/components/ui/icons/browser/chrome";
import { Edge } from "@/components/ui/icons/browser/edge";
import { Firefox } from "@/components/ui/icons/browser/firefox";
import { Safari } from "@/components/ui/icons/browser/safari";
import { cn } from "@/lib/utils";
import type { Route } from "next";
import { Arc } from "@/components/ui/icons/browser/arc";
import { ZenBrowser } from "@/components/ui/icons/browser/zen";
import { Opera } from "@/components/ui/icons/browser/opera";
import { BraveBrowser } from "@/components/ui/icons/browser/brave";
import { useQuery } from "@tanstack/react-query";
import { APIError } from "@repo/auth/client";
import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { Trash2 } from "@/components/animate-ui/icons/trash-2";

type RawSession = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
  token?: string | null;
};

type Session = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
  token: string | null;
};

export function SessionsFrame({
  currentSessionId: initialSessionId,
}: {
  currentSessionId: string;
}) {
  const router = useRouter();
  const [currentSessionId, setCurrentSessionId] =
    useState<string>(initialSessionId);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [includeCurrentDevice, setIncludeCurrentDevice] = useState(false);

  const {
    data: sessions = [],
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sessions", currentSessionId],
    retry: 1,
    queryFn: async () => {
      const listRes = await authClient.listSessions();
      if (listRes?.error) {
        throw new Error(listRes.error.message || "Failed to load sessions");
      }
      const raw = (listRes?.data ?? []) as RawSession[];
      return raw.map(normalizeSession);
    },
  });

  const toDate = (v: string | Date | undefined | null): Date | null => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const normalizeSession = (s: RawSession): Session => ({
    id: s.id,
    userAgent: s.userAgent ?? null,
    ipAddress: s.ipAddress ?? null,
    createdAt: toDate(s.createdAt) ?? new Date(0),
    updatedAt: toDate(s.updatedAt ?? null),
    token: s.token ?? null,
  });

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aIsCurrent = currentSessionId === a.id;
      const bIsCurrent = currentSessionId === b.id;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (bIsCurrent && !aIsCurrent) return 1;
      return (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0);
    });
  }, [sessions, currentSessionId]);

  const handleRevokeSession = useCallback(
    async (session: Session) => {
      try {
        const { error } = await authClient.revokeSessionById({
          sessionId: session.id
        });
        if (error) {
          if (error instanceof APIError) {
            toast.error(error.message)
          } else {
            toast.error("Something went wrong");
          }
          return;
        }
        toast.success("Session revoked!");
        await refetch();
      } catch {
        toast.error("Something went wrong");
      }
    },
    [refetch],
  );

  const handleRevokeAllSessions = useCallback(async () => {
    setIsRevokingAll(true);
    try {
      if (includeCurrentDevice) {
        await authClient.revokeSessions({
          fetchOptions: {
            onSuccess: () => {
              toast.success("All sessions revoked. Signing out...");
              router.push("/sign-in" as Route);
            },
            onError: () => {
              toast.error("Failed to revoke sessions");
            },
          },
        });
      } else {
        await authClient.revokeOtherSessions({
          fetchOptions: {
            onSuccess: () => {
              toast.success("All other sessions revoked successfully");
              refetch();
            },
            onError: () => {
              toast.error("Failed to revoke sessions");
            },
          },
        });
      }
    } catch {
      toast.error("Failed to revoke sessions");
    } finally {
      if (!includeCurrentDevice) setIsRevokingAll(false);
      setIncludeCurrentDevice(false);
    }
  }, [includeCurrentDevice, refetch, router]);

  const getBrowserIcon = (userAgent: string | null) => {
    if (!userAgent) return <Laptop className="size-6" />;
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name?.toLowerCase() || "";

    if (browser.includes("edg")) {
      return <Edge className="size-6" />;
    }
    if (browser.includes("firefox")) {
      return <Firefox className="size-6" />;
    }
    if (browser.includes("chrome") || browser.includes("chromium")) {
      return <Chrome className="size-6" />;
    }
    if (browser.includes("safari")) {
      return <Safari className="size-6" />;
    }
    if (browser.includes("opera")) {
      return <Opera className="size-6" />;
    }
    if (browser.includes("arc")) {
      return <Arc className="size-6" />;
    }
    if (browser.includes("brave")) {
      return <BraveBrowser className="size-6" />;
    }
    if (browser.includes("zen")) {
      return <ZenBrowser className="size-6" />;
    }
    return <Laptop className="size-6" />;
  };

  if (isPending) {
    return (
      <Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
        <FramePanel>
          <h2 className="font-heading text-xl mb-2 text-foreground">
            Active Sessions
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your active sessions across different devices. Revoke access
            from any device.
          </p>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </FramePanel>
      </Frame>
    );
  }

  if (error) {
    return (
      <Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
        <FramePanel>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle />
              </EmptyMedia>
              <EmptyTitle>Failed to load sessions</EmptyTitle>
              <EmptyDescription>
                {error instanceof Error
                  ? error.message
                  : "Something went wrong. Please try again."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => refetch()}>Erneut versuchen</Button>
            </EmptyContent>
          </Empty>
        </FramePanel>
      </Frame>
    );
  }

  return (
    <Frame className="after:-inset-[5px] after:-z-1 relative flex min-w-0 flex-1 flex-col bg-muted/50 bg-clip-padding shadow-black/5 shadow-sm after:pointer-events-none after:absolute after:rounded-[calc(var(--radius-2xl)+4px)] after:border after:border-border/50 after:bg-clip-padding lg:rounded-2xl lg:border dark:after:bg-background/72">
      <FramePanel>
        <h2 className="font-heading text-xl mb-2 text-foreground">
          Active Sessions
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your active sessions across different devices. Revoke access
          from any device.
        </p>

        <div className="space-y-2">
          {sortedSessions.map((sessionItem) => {
            const isCurrent = currentSessionId === sessionItem.id;
            const parser = new UAParser(sessionItem.userAgent || "");
            const browserInfo = parser.getBrowser();
            const osInfo = parser.getOS();
            const browser = browserInfo.name || "Unknown Browser";
            const browserVersion = browserInfo.version
              ? ` ${browserInfo.version}`
              : "";
            const os = osInfo.name || "Unknown OS";
            const osVersion = osInfo.version ? ` ${osInfo.version}` : "";
            const ipDisplay = sessionItem.ipAddress || "Unknown IP";
            const lastActiveDate =
              sessionItem.updatedAt ?? sessionItem.createdAt ?? new Date(0);

            return (
              <div key={sessionItem.id}>
                <div
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    isCurrent ? "border-primary bg-primary/5 shadow-sm" : "",
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            "p-2.5 rounded-lg cursor-help",
                            isCurrent ? "bg-primary/10" : "bg-secondary",
                          )}
                        >
                          {getBrowserIcon(sessionItem.userAgent)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm">
                        <div className="space-y-2 text-xs">
                          <div>
                            <p className="font-semibold mb-1">
                              Session Details
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div>
                              <p className="text-muted-foreground">Browser</p>
                              <p className="font-medium">
                                {browser}
                                {browserVersion}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Operating System
                              </p>
                              <p className="font-medium">
                                {os}
                                {osVersion}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                IP Address
                              </p>
                              <p className="font-medium">
                                {sessionItem.ipAddress || "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created</p>
                              <p className="font-medium">
                                {sessionItem.createdAt
                                  ? new Date(
                                    sessionItem.createdAt,
                                  ).toLocaleString()
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {browser} on {os}
                        </p>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            This Device
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ipDisplay} •{" "}
                        {isCurrent ? (
                          <span className="font-medium">Active now</span>
                        ) : (
                          <>
                            Last active{" "}
                            {lastActiveDate
                              ? new Date(lastActiveDate).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                              : "Unknown"}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {!isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="sm" />}
                      >
                        Revoke
                      </AlertDialogTrigger>
                      <AlertDialogPopup>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to revoke this session? This
                            device will need to sign in again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogClose render={<Button variant="ghost" />}>
                            Cancel
                          </AlertDialogClose>
                          <AlertDialogClose
                            render={<Button variant="destructive" />}
                            onClick={() => handleRevokeSession(sessionItem)}
                          >
                            Revoke Session
                          </AlertDialogClose>
                        </AlertDialogFooter>
                      </AlertDialogPopup>
                    </AlertDialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </FramePanel>

      <FrameFooter className="flex-row justify-end items-center gap-2">
        <AlertDialog>
        <AnimateIcon animateOnHover>
          <AlertDialogTrigger
            render={<Button variant="destructive" size="sm" />}
            disabled={isRevokingAll}
          >
            {isRevokingAll ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            Revoke All Sessions
          </AlertDialogTrigger>
          </AnimateIcon>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke All Sessions</AlertDialogTitle>
              <AlertDialogDescription>
                Choose whether to sign out from all devices or only other
                devices.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="px-6 py-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={includeCurrentDevice}
                  onCheckedChange={(checked) =>
                    setIncludeCurrentDevice(!!checked)
                  }
                  id="include-current"
                />
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="include-current"
                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include this device
                  </label>
                  <p className="text-xs text-muted-foreground">
                    If checked, you will be signed out from this device as well.
                  </p>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="ghost" />}>
                Cancel
              </AlertDialogClose>
              <AlertDialogClose
                render={<Button variant="destructive" />}
                onClick={handleRevokeAllSessions}
              >
                {includeCurrentDevice
                  ? "Revoke All & Sign Out"
                  : "Revoke Other Sessions"}
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      </FrameFooter>
    </Frame>
  );
}
