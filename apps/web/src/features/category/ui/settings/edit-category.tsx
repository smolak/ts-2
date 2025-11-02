import { zodResolver } from "@hookform/resolvers/zod";
import type { CategoryDto } from "@repo/category/dto/category.dto";
import { Input } from "@repo/ui/components/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { Save } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/trpc/react";
import { type UpdateCategorySchema, updateCategorySchema } from "../../schemas/update-category.schema";
import { ActionPending } from "./action-pending";
import { CancelAction } from "./cancel-action";
import { StickyErrorMessage } from "./sticky-error-message";
import { SubmitButton } from "./submit-button";

type EditCategoryProps = {
  category: CategoryDto;
  onSave: (newName: CategoryDto["name"]) => void;
  onCancel: () => void;
};

export const EditCategory: FC<EditCategoryProps> = ({ category, onSave, onCancel }) => {
  const [errorResponse, setErrorResponse] = useState("");
  const {
    register,
    setFocus,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<UpdateCategorySchema>({
    resolver: zodResolver(updateCategorySchema),
    mode: "onChange",
    defaultValues: {
      id: category.id,
      name: category.name,
    },
  });

  const { mutate: updateCategory, isPending } = api.categories.updateCategory.useMutation({
    onSuccess: (data) => {
      resetField("name");
      onSave(data.name);
    },
    onError: (error) => {
      setErrorResponse(error.message);
    },
  });

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  useEffect(() => {
    if (errorResponse !== "") {
      setFocus("name");
    }
  }, [setFocus, errorResponse]);

  const onSubmit = (data: UpdateCategorySchema) => {
    setErrorResponse("");
    updateCategory(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className={cn(
          "space-between flex h-[42px] items-center justify-between rounded-md border px-1 text-accent-foreground shadow-sm transition-all",
          { "rounded-bl-none border-red-50": Boolean(errors?.name?.message || errorResponse) },
        )}
      >
        <input
          {...register("name")}
          className="w-full border-0 p-2 outline-none"
          type="text"
          inputMode="text"
          disabled={isPending}
          onKeyUp={({ key }) => {
            if (key === "Escape") {
              onCancel();
            }
          }}
        />
        <div className="flex text-gray-600">
          {isPending ? (
            <ActionPending />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <SubmitButton isSubmitting={isPending} className="group hover:bg-green-100">
                    <Save size={14} className="group-hover:text-green-600" />
                  </SubmitButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save changes.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <CancelAction actionPending={isPending} onCancelAction={onCancel} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Discard changes.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Input {...register("id")} type="hidden" />
      </div>
      {errors?.name?.message || errorResponse !== "" ? (
        <StickyErrorMessage>{errors?.name?.message || errorResponse}</StickyErrorMessage>
      ) : null}
    </form>
  );
};
