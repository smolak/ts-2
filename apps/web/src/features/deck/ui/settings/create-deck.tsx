"use client";

import { type FC, useState } from "react";

import { api } from "@/trpc/react";

import { CreateDeckForm } from "./create-deck-form";

type CreateDeckProps = {
  onDeckCreated: () => void;
};

export const CreateDeck: FC<CreateDeckProps> = ({ onDeckCreated }) => {
  const [errorResponse, setErrorResponse] = useState("");

  const {
    mutate: createDeck,
    isPending,
    isSuccess,
  } = api.decks.createDeck.useMutation({
    onSuccess: () => {
      setErrorResponse("");
      onDeckCreated();
    },
    onError: (error) => {
      setErrorResponse(error.message);
    },
  });

  const onSubmit = (data: { name: string; slug: string; isPublic: boolean }) => {
    createDeck(data);
  };

  const onBlur = () => {
    setErrorResponse("");
  };

  return (
    <CreateDeckForm
      onSubmit={onSubmit}
      onBlur={onBlur}
      isSubmitting={isPending}
      errorResponse={errorResponse}
      resetForm={isSuccess}
    />
  );
};
