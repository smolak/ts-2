"use client";

import { cn } from "@repo/ui/lib/utils";
import { Paintbrush, X } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#78716c", // stone
];

type ColorPickerProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
};

const ColorPicker = forwardRef<HTMLButtonElement, ColorPickerProps>(
  ({ value, onChange, disabled, label = "Color", className }, ref) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");
    const inputId = useId();

    const handleColorChange = (color: string) => {
      setInputValue(color);
      onChange(color);
    };

    const handleClear = () => {
      setInputValue("");
      onChange(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Only update if valid hex color or empty
      if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
        onChange(newValue);
      } else if (newValue === "") {
        onChange(null);
      }
    };

    const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const color = e.target.value.toUpperCase();
      setInputValue(color);
      onChange(color);
    };

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Label htmlFor={inputId} className="font-medium text-sm">
          {label}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              disabled={disabled}
              className={cn("h-9 w-full justify-start gap-2 px-3 font-normal", !value && "text-muted-foreground")}
              type="button"
            >
              {value ? (
                <div className="size-5 shrink-0 rounded border" style={{ backgroundColor: value }} />
              ) : (
                <Paintbrush size={16} className="shrink-0" />
              )}
              <span className="truncate">{value || "Pick a color"}</span>
              {value ? (
                <X
                  size={14}
                  className="ml-auto shrink-0 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                />
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "size-7 rounded-md border-2 transition-all hover:scale-110",
                      value?.toUpperCase() === color.toUpperCase() ? "border-foreground" : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color.toUpperCase())}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id={inputId}
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="#FF5733"
                    className="h-8 pr-8 font-mono text-xs uppercase"
                    maxLength={7}
                  />
                  <input
                    type="color"
                    value={value || "#000000"}
                    onChange={handleNativeColorChange}
                    className="absolute top-1/2 right-1.5 size-5 -translate-y-1/2 cursor-pointer border-none bg-transparent p-0 opacity-0"
                    style={{ opacity: 1 }}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);

ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
