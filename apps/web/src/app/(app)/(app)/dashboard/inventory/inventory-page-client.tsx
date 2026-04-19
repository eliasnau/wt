"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle, Package, Search, X } from "lucide-react";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CardFrame } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Frame, FramePanel } from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";
import {
  Header,
  HeaderActions,
  HeaderContent,
  HeaderDescription,
  HeaderTitle,
} from "../_components/page-header";
import { NewProductSheet } from "./_components/new-product-sheet";
import { ProductStockSheet } from "./_components/product-stock-sheet";
import type { Product } from "./_components/types";

export function InventoryPageClient() {
  const [{ page, limit, search }, setQueryState] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(20),
    search: parseAsString.withDefault(""),
  });

  const {
    data: response,
    isPending,
    isPlaceholderData,
    error,
    refetch,
  } = useQuery({
    ...orpc.inventory.listProducts.queryOptions({
      input: {
        page,
        limit,
        search: search.trim() || undefined,
      },
    }),
    placeholderData: (prev) => prev,
  });

  const products = useMemo(
    () => (response?.data as Product[] | undefined) ?? [],
    [response?.data],
  );
  const pagination = response?.pagination;

  return (
    <div className="flex flex-col gap-6">
      <Header>
        <HeaderContent>
          <HeaderTitle>Inventar</HeaderTitle>
          <HeaderDescription>
            Produkte, Varianten und Lagerbestand verwalten.
          </HeaderDescription>
        </HeaderContent>
        <HeaderActions>
          <NewProductSheet />
        </HeaderActions>
      </Header>

      {error ? (
        <Frame>
          <FramePanel>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertCircle />
                </EmptyMedia>
                <EmptyTitle>Inventar konnte nicht geladen werden</EmptyTitle>
                <EmptyDescription>
                  {error instanceof Error
                    ? error.message
                    : "Etwas ist schiefgelaufen. Bitte versuche es erneut."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => refetch()}>Erneut versuchen</Button>
              </EmptyContent>
            </Empty>
          </FramePanel>
        </Frame>
      ) : !isPending && products.length === 0 && !search.trim() ? (
        <Frame>
          <FramePanel>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>Noch kein Inventar vorhanden</EmptyTitle>
                <EmptyDescription>
                  Lege dein erstes Produkt an, um Varianten und Bestand zu
                  verwalten.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <NewProductSheet />
              </EmptyContent>
            </Empty>
          </FramePanel>
        </Frame>
      ) : (
        <>
          <InputGroup>
            <InputGroupAddon>
              {isPlaceholderData ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Search aria-hidden="true" />
              )}
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Produkte durchsuchen"
              placeholder="Produkte durchsuchen..."
              value={search}
              onChange={(e) =>
                setQueryState({ search: e.target.value, page: 1 })
              }
            />
            {search && (
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setQueryState({ search: "", page: 1 })}
                >
                  <X aria-hidden="true" />
                  <span className="sr-only">Suche löschen</span>
                </button>
              </InputGroupAddon>
            )}
          </InputGroup>

          <CardFrame>
            <Table variant="card">
              <TableHeader>
                <TableRow>
                  <TableHead>Produkt</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Attribute
                  </TableHead>
                  <TableHead className="text-right">Bestand</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: limit }).map((_, i) => (
                          <TableRow key={`skeleton-${i}`}>
                            <TableCell>
                              <Skeleton className="h-3.5 w-28" />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center gap-1.5">
                                <Skeleton className="h-4 w-12 rounded-full" />
                                <Skeleton className="h-4 w-14 rounded-full" />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Skeleton className="ml-auto h-3.5 w-6" />
                            </TableCell>
                            <TableCell className="w-8 pr-4">
                              <Skeleton className="size-4" />
                            </TableCell>
                          </TableRow>
                    ))
                ) : !isPlaceholderData && products.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4}>
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Search />
                          </EmptyMedia>
                          <EmptyTitle>Keine Ergebnisse</EmptyTitle>
                          <EmptyDescription>
                            Kein Produkt passt zu &ldquo;{search}&rdquo;.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <ProductStockSheet
                      key={product.id}
                      product={product}
                    />
                  ))
                )}
              </TableBody>
              {pagination && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="!py-2 px-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                          <p className="hidden text-muted-foreground text-sm sm:inline">
                            Zeige
                          </p>
                          <Select
                            items={[
                              { label: "10", value: 10 },
                              { label: "20", value: 20 },
                              { label: "30", value: 30 },
                              { label: "50", value: 50 },
                            ]}
                            onValueChange={(value) => {
                              setQueryState({
                                limit: value as number,
                                page: 1,
                              });
                            }}
                            value={pagination.limit}
                          >
                            <SelectTrigger
                              aria-label="Einträge pro Seite"
                              className="w-fit min-w-none"
                              size="sm"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectPopup>
                              <SelectItem value={10}>10</SelectItem>
                              <SelectItem value={20}>20</SelectItem>
                              <SelectItem value={30}>30</SelectItem>
                              <SelectItem value={50}>50</SelectItem>
                            </SelectPopup>
                          </Select>
                          <span className="text-muted-foreground text-sm">
                            von{" "}
                            <strong className="font-medium text-foreground">
                              {pagination.totalCount}
                            </strong>{" "}
                            <span className="hidden sm:inline">
                              {pagination.totalCount === 1
                                ? "Produkt"
                                : "Produkten"}
                            </span>
                          </span>
                        </div>
                        <Pagination className="justify-end">
                          <PaginationContent>
                            <PaginationItem>
                              <span className="text-muted-foreground text-sm">
                                Seite {pagination.page} von{" "}
                                {pagination.totalPages}
                              </span>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationPrevious
                                render={
                                  <Button
                                    disabled={!pagination.hasPreviousPage}
                                    onClick={() =>
                                      setQueryState({
                                        page: pagination.page - 1,
                                      })
                                    }
                                    size="sm"
                                    variant="outline"
                                  />
                                }
                              />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext
                                render={
                                  <Button
                                    disabled={!pagination.hasNextPage}
                                    onClick={() =>
                                      setQueryState({
                                        page: pagination.page + 1,
                                      })
                                    }
                                    size="sm"
                                    variant="outline"
                                  />
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardFrame>
        </>
      )}
    </div>
  );
}
