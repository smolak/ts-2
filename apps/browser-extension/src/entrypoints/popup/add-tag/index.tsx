import { type FC, useCallback } from "react"
import type { FieldValues } from "react-hook-form"

import { useAddTag } from "../hooks/use-add-tag"
import { AddTagForm } from "./add-tag-form"

type AddTagProps = {
  apiKey: string
  onSuccess: () => void
}

export const AddTag: FC<AddTagProps> = ({ apiKey, onSuccess }) => {
  const { mutate, isPending, isSuccess, isError, reset } = useAddTag(apiKey, onSuccess)

  const addTag = useCallback(
    (values: FieldValues) => {
      const name = values.name as string

      mutate({ name })
    },
    [mutate]
  )

  const onBlur = useCallback(() => {
    reset()
  }, [reset])

  return (
    <AddTagForm
      onSubmit={addTag}
      onBlur={onBlur}
      isSubmitting={isPending}
      size="small"
      resetForm={isSuccess}
      errorResponse={isError ? "Could not add tag, try again." : undefined}
    />
  )
}
