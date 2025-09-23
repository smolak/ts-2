"use client";

import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useCharacterLimit } from "@repo/ui/hooks/use-character-limit";
import { useId } from "react";
import { USERNAME_MAX_LENGTH } from "../schemas/username.schema";

export const UsernameInput = () => {
  const id = useId();
  const maxLength = USERNAME_MAX_LENGTH;
  const { value, characterCount, handleChange, maxLength: limit } = useCharacterLimit({ maxLength });

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Username:</Label>
      <div className="relative">
        <Input
          id={id}
          className="peer pe-14"
          type="text"
          value={value}
          maxLength={maxLength}
          onChange={handleChange}
          aria-describedby={`${id}-description`}
        />
        <output
          id={`${id}-description`}
          htmlFor={id}
          className="text-muted-foreground pointer-events-none absolute inset-y-0 end-0 top-0 flex items-center justify-center pe-3 text-xs tabular-nums peer-disabled:opacity-50"
          aria-live="polite"
        >
          {characterCount}/{limit}
        </output>
      </div>
    </div>
  );
};
