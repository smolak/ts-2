"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { cn } from "@repo/ui/lib/utils";
import { Eye, EyeOff, Plus } from "lucide-react";
import { type FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { type CreateDeckSchema, createDeckSchema } from "../../schemas/create-deck.schema";
import { generateSlug } from "../../utils/generate-slug";

type CreateDeckFormProps = {
  onSubmit: (values: CreateDeckSchema) => void;
  onBlur: () => void;
  isSubmitting?: boolean;
  errorResponse?: string;
  resetForm?: boolean;
};

export const CreateDeckForm: FC<CreateDeckFormProps> = ({
  errorResponse,
  isSubmitting,
  onBlur,
  onSubmit,
  resetForm,
}) => {
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    resetField,
    setFocus,
    setValue,
    watch,
  } = useForm<CreateDeckSchema>({
    resolver: zodResolver(createDeckSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
      isPublic: true,
    },
  });

  const isPublic = watch("isPublic");
  const name = watch("name");

  useEffect(() => {
    if (typeof errorResponse === "string" && errorResponse !== "") {
      setFocus("name");
    }
  }, [setFocus, errorResponse]);

  useEffect(() => {
    if (resetForm) {
      reset();
    }
  }, [resetForm, reset]);

  // Auto-generate slug from name
  useEffect(() => {
    const slug = generateSlug(name || "");
    setValue("slug", slug, { shouldValidate: name !== "" });
  }, [name, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="create-deck" className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-md border p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="font-medium text-sm">
            Deck Name
          </Label>
          <Input
            {...register("name")}
            id="name"
            type="text"
            inputMode="text"
            disabled={isSubmitting}
            placeholder="My awesome deck..."
            onBlur={() => {
              onBlur();
              const { name } = getValues();
              if (name === "") {
                resetField("name");
              }
            }}
          />
          {errors?.name?.message ? <p className="text-red-600 text-sm">{errors.name.message}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="slug" className="font-medium text-sm">
            URL Slug
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">/</span>
            <Input
              {...register("slug")}
              id="slug"
              type="text"
              inputMode="text"
              disabled={isSubmitting}
              placeholder="my-awesome-deck"
              className="font-mono"
            />
          </div>
          {errors?.slug?.message ? <p className="text-red-600 text-sm">{errors.slug.message}</p> : null}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                <Switch id="isPublic" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
              )}
            />
            <Label htmlFor="isPublic" className="flex cursor-pointer items-center gap-2 text-sm">
              {isPublic ? (
                <>
                  <Eye size={14} className="text-green-600" />
                  Public
                </>
              ) : (
                <>
                  <EyeOff size={14} className="text-slate-500" />
                  Private
                </>
              )}
            </Label>
          </div>
          <span className="text-slate-500 text-xs">
            {isPublic ? "Anyone can see and follow this deck" : "Only you can see this deck"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          form="create-deck"
          disabled={isSubmitting}
          className={cn("h-9 gap-1", { loading: isSubmitting })}
        >
          <Plus size={18} />
          <span>Create Deck</span>
        </Button>
      </div>

      {errorResponse !== "" ? (
        <p className="rounded-md bg-red-50 px-2 py-1 text-red-600 text-sm">{errorResponse}</p>
      ) : null}
    </form>
  );
};
