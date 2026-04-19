"use client";

import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type EditableAttribute,
  createEmptyAttribute,
  createUiId,
} from "./types";

export function AttributeEditor({
  attributes,
  onChange,
  disabled,
  idPrefix,
}: {
  attributes: EditableAttribute[];
  onChange: (next: EditableAttribute[]) => void;
  disabled: boolean;
  idPrefix: string;
}) {
  function updateAt(index: number, next: EditableAttribute) {
    const updated = [...attributes];
    updated[index] = next;
    onChange(updated);
  }

  function removeAt(index: number) {
    onChange(attributes.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Attribute</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...attributes, createEmptyAttribute()])}
        >
          <Plus className="size-4" />
          Attribut
        </Button>
      </div>

      {attributes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-muted-foreground text-sm">
          Keine Attribute — es wird eine Standard-Variante erstellt.
        </p>
      ) : (
        <div className="space-y-3">
          {attributes.map((attribute, attributeIndex) => (
            <div
              key={attribute.id}
              className="space-y-3 rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  id={`${idPrefix}-attribute-${attribute.id}`}
                  value={attribute.name}
                  onChange={(e) =>
                    updateAt(attributeIndex, {
                      ...attribute,
                      name: e.target.value,
                    })
                  }
                  disabled={disabled}
                  placeholder="Attributname, z. B. Größe"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => removeAt(attributeIndex)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs">Werte</p>
                {attribute.values.map((value, valueIndex) => (
                  <div key={value.id} className="flex items-center gap-2">
                    <Input
                      id={`${idPrefix}-value-${attribute.id}-${value.id}`}
                      value={value.value}
                      onChange={(e) => {
                        const nextValues = [...attribute.values];
                        nextValues[valueIndex] = {
                          ...value,
                          value: e.target.value,
                        };
                        updateAt(attributeIndex, {
                          ...attribute,
                          values: nextValues,
                        });
                      }}
                      disabled={disabled}
                      placeholder="z. B. M"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      onClick={() => {
                        const nextValues = attribute.values.filter(
                          (item) => item.id !== value.id,
                        );
                        updateAt(attributeIndex, {
                          ...attribute,
                          values:
                            nextValues.length > 0
                              ? nextValues
                              : [{ id: createUiId(), value: "" }],
                        });
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() =>
                    updateAt(attributeIndex, {
                      ...attribute,
                      values: [
                        ...attribute.values,
                        { id: createUiId(), value: "" },
                      ],
                    })
                  }
                >
                  <Plus className="size-4" />
                  Wert
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
