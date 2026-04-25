"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { client } from "@/utils/orpc";

export function DeleteProductDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => client.inventory.deleteProduct({ productId }),
    onSuccess: () => {
      toast.success("Produkt gelöscht");
      onOpenChange(false);
      queryClient.invalidateQueries();
      router.push("/dashboard/inventory");
    },
    onError: (error) => {
      toast.error(error.message || "Produkt konnte nicht gelöscht werden");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Produkt wirklich löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="font-medium text-foreground">
              {productName}
            </strong>{" "}
            und alle zugehörigen Varianten und Bestände werden unwiderruflich
            gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="ghost" />}
            disabled={mutation.isPending}
          >
            Abbrechen
          </AlertDialogClose>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Spinner /> : <Trash2 className="size-4" />}
            Endgültig löschen
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
