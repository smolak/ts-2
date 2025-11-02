import { zodResolver } from "@hookform/resolvers/zod";
import { type AddTagBody, addTagBodySchema } from "@repo/tag/api/v1/add-tag.schema";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/utils";
import { Plus } from "lucide-react";
import { type FC, useEffect } from "react";
import { type FieldValues, useForm } from "react-hook-form";

export type Size = "default" | "small";

type AddTagFormProps = {
  onSubmit: (values: FieldValues) => void;
  onBlur: () => void;
  isSubmitting?: boolean;
  size?: Size;
  errorResponse?: string;
  defaultValues?: AddTagBody;
  resetForm?: boolean;
};

export const AddTagForm: FC<AddTagFormProps> = ({
  defaultValues,
  errorResponse,
  isSubmitting,
  onBlur,
  onSubmit,
  resetForm,
  size,
}) => {
  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    resetField,
    setFocus,
  } = useForm<AddTagBody>({
    resolver: zodResolver(addTagBodySchema),
    mode: "onChange",
    defaultValues,
  });

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="tags">
      <div className="flex items-center gap-2">
        <Input
          {...register("name")}
          type="text"
          inputMode="text"
          disabled={isSubmitting}
          placeholder="Tag name..."
          onBlur={() => {
            onBlur();

            const { name } = getValues();

            if (name === "") {
              resetField("name");
            }
          }}
          className={cn({
            "h-8": size === "small",
            "placeholder:font-light": size === "small",
          })}
        />
        <Button
          type="submit"
          form="tags"
          disabled={isSubmitting}
          className={cn("h-9 gap-1", { loading: isSubmitting, "h-8": size === "small" })}
        >
          <Plus size={18} />
          <span>Add</span>
        </Button>
      </div>
      {errors?.name?.message || errorResponse !== "" ? (
        <p className="absolute mt-1 rounded-md bg-red-50 px-2 py-1 text-sm text-red-600">
          {errors?.name?.message || errorResponse}
        </p>
      ) : null}
    </form>
  );
};
