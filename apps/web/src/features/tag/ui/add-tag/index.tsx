"use client";

import { type FC, useCallback, useState } from "react";
import type { FieldValues } from "react-hook-form";

import { api } from "@/trpc/react";

import { AddTagForm, type Size } from "./add-tag-form";

type AddTagProps = {
  onTagAdd: () => void;
  size?: Size;
};

export const AddTag: FC<AddTagProps> = ({ onTagAdd, size = "default" }) => {
  const [errorResponse, setErrorResponse] = useState("");

  const {
    mutate: addTag,
    isPending,
    isSuccess,
  } = api.tags.createTag.useMutation({
    onSuccess: () => {
      setErrorResponse("");
      onTagAdd();
    },
    onError: (error) => {
      setErrorResponse(error.message);
    },
  });

  const onSubmit = useCallback(
    (values: FieldValues) => {
      const name = values.name as string;

      addTag({ name });
    },
    [addTag],
  );

  const onBlur = useCallback(() => {
    setErrorResponse("");
  }, []);

  return (
    <AddTagForm
      onSubmit={onSubmit}
      onBlur={onBlur}
      isSubmitting={isPending}
      size={size}
      errorResponse={errorResponse}
      resetForm={isSuccess}
    />
  );
};
