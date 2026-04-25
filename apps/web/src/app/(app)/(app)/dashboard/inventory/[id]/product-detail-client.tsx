"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardPanel } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";
import { type Product, getTotalStock } from "../_components/types";
import { DeleteProductDialog } from "./_components/delete-product-dialog";
import { EditProductAttributesSheet } from "./_components/edit-product-attributes-sheet";
import { EditProductDetailsSheet } from "./_components/edit-product-details-sheet";
import { StockEditor } from "./_components/stock-editor";

export function ProductDetailClient() {
  const params = useParams();
  const productId = params.id as string;

  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [attributesSheetOpen, setAttributesSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: product,
    isPending,
    error,
    refetch,
  } = useQuery(
    orpc.inventory.getProduct.queryOptions({
      input: { productId },
    }),
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col gap-6">
        <Button
          variant="ghost"
          className="gap-2 self-start"
          render={<Link href="/dashboard/inventory" />}
        >
          <ArrowLeft className="size-4" />
          Zurück zum Inventar
        </Button>

        <Card>
          <CardPanel>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertCircle />
                </EmptyMedia>
                <EmptyTitle>Produkt konnte nicht geladen werden</EmptyTitle>
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
          </CardPanel>
        </Card>
      </div>
    );
  }

  const typedProduct = product as Product;
  const totalStock = getTotalStock(typedProduct);
  const variantCount = typedProduct.variants.length;
  const attributeCount = typedProduct.attributes.length;

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        className="gap-2 self-start"
        render={<Link href="/dashboard/inventory" />}
      >
        <ArrowLeft className="size-4" />
        Zurück zum Inventar
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-2">
          <h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
            {typedProduct.name}
          </h1>
          {typedProduct.description ? (
            <p className="text-muted-foreground text-sm sm:text-base">
              {typedProduct.description}
            </p>
          ) : (
            <p className="text-muted-foreground/70 text-sm italic">
              Keine Beschreibung
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-muted-foreground text-sm">
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {totalStock}
              </span>{" "}
              Stück gesamt
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <span className="font-semibold text-foreground tabular-nums">
                {variantCount}
              </span>{" "}
              {variantCount === 1 ? "Variante" : "Varianten"}
            </span>
            {attributeCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {attributeCount}
                  </span>{" "}
                  {attributeCount === 1 ? "Attribut" : "Attribute"}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/dashboard/inventory/${typedProduct.id}/inventur`} />
            }
          >
            <ClipboardList className="size-4" />
            Inventur
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAttributesSheetOpen(true)}
          >
            <Sparkles className="size-4" />
            {attributeCount === 0 ? "Attribute hinzufügen" : "Attribute"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailsSheetOpen(true)}
          >
            <Pencil className="size-4" />
            Details
          </Button>
          <Button
            variant="destructive-outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4" />
            Löschen
          </Button>
        </div>
      </div>

      <StockEditor product={typedProduct} />

      <EditProductDetailsSheet
        product={typedProduct}
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
      />
      <EditProductAttributesSheet
        product={typedProduct}
        open={attributesSheetOpen}
        onOpenChange={setAttributesSheetOpen}
      />
      <DeleteProductDialog
        productId={typedProduct.id}
        productName={typedProduct.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
