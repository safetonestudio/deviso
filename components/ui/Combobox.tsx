"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type OptionCombobox = { valeur: string; libelle: string };

type Props = {
  options: OptionCombobox[];
  valeur: string;
  onChange: (valeur: string) => void;
  placeholder?: string;
  recherche?: string;
  vide?: string;
  name?: string;
  className?: string;
};

/**
 * Liste deroulante avec recherche, accessible au clavier et aux lecteurs
 * d'ecran. Remplace un <select> natif quand la liste est longue (clients,
 * pays, produits). Si "name" est fourni, la valeur est aussi envoyee par les
 * formulaires classiques via un champ cache.
 */
export function Combobox({
  options,
  valeur,
  onChange,
  placeholder = "Choisir",
  recherche = "Rechercher",
  vide = "Aucun resultat",
  name,
  className,
}: Props) {
  const [ouvert, setOuvert] = React.useState(false);
  const courant = options.find((o) => o.valeur === valeur);

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={ouvert}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            !courant && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{courant ? courant.libelle : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={recherche} />
          <CommandList>
            <CommandEmpty>{vide}</CommandEmpty>
            {options.map((o) => (
              <CommandItem
                key={o.valeur}
                value={o.libelle}
                onSelect={() => {
                  onChange(o.valeur);
                  setOuvert(false);
                }}
              >
                <Check
                  className={cn("h-4 w-4", o.valeur === valeur ? "opacity-100" : "opacity-0")}
                  aria-hidden="true"
                />
                {o.libelle}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
      {name ? <input type="hidden" name={name} value={valeur} /> : null}
    </Popover>
  );
}
