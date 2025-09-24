import { type FC, useCallback } from "react"
import type { FieldValues } from "react-hook-form"

import { useAddCategory } from "../hooks/use-add-category"
import { AddCategoryForm } from "./add-category-form"

type AddCategoryProps = {
  apiKey: string
  onSuccess: () => void
}

export const AddCategory: FC<AddCategoryProps> = ({ apiKey, onSuccess }) => {
  const { mutate, isPending, isSuccess, isError, reset } = useAddCategory(apiKey, onSuccess)

  const addCategory = useCallback(
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
    <AddCategoryForm
      onSubmit={addCategory}
      onBlur={onBlur}
      isSubmitting={isPending}
      size="small"
      resetForm={isSuccess}
      errorResponse={isError ? "Could not add category, try again." : undefined}
    />
  )
}
