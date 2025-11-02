import { zodResolver } from "@hookform/resolvers/zod";
import type { TagDto } from "@repo/tag/dto/tag.dto";
import { Input } from "@repo/ui/components/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { Info, Trash } from "lucide-react";
import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/trpc/react";
import { type DeleteTagSchema, deleteTagSchema } from "../../schemas/delete-tag.schema";
import { ActionPending } from "./action-pending";
import { CancelAction } from "./cancel-action";
import { StickyErrorMessage } from "./sticky-error-message";
import { SubmitButton } from "./submit-button";

type EditTagProps = {
  tag: TagDto;
  onDelete: () => void;
  onCancel: () => void;
};

export const DeleteTag: FC<EditTagProps> = ({ tag, onDelete, onCancel }) => {
  const [errorResponse, setErrorResponse] = useState("");
  const { register, handleSubmit } = useForm<DeleteTagSchema>({
    resolver: zodResolver(deleteTagSchema),
    mode: "onChange",
    defaultValues: {
      id: tag.id,
    },
  });

  const { mutate: deleteTag, isPending } = api.tags.deleteTag.useMutation({
    onSuccess: () => {
      onDelete();
    },
    onError: () => {
      setErrorResponse("Could not delete, try again.");
    },
  });

  const abort = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    },
    [onCancel],
  );

  useEffect(() => {
    document.addEventListener("keyup", abort);

    return () => {
      document.removeEventListener("keyup", abort);
    };
  }, [abort]);

  const onSubmit = (data: DeleteTagSchema) => {
    setErrorResponse("");
    deleteTag(data);
  };

  return (
    <form className="relative" onSubmit={handleSubmit(onSubmit)}>
      <p className="-top-8 absolute rounded-md border-sky-600 border-l-4 bg-sky-50 px-2 py-1 text-sky-600 text-sm">
        <span className="flex items-center gap-2">
          <Info size={13} strokeWidth={2.5} />
          <span className="font-light">No URLs will be removed with this operation.</span>
        </span>
      </p>
      <div
        className={cn(
          "space-between flex h-[42px] items-center justify-between rounded-md border border-red-100 px-1 text-accent-foreground shadow-sm transition-all",
          { "rounded-bl-none border-red-50": Boolean(errorResponse) },
        )}
      >
        <span className="w-full p-2">{tag.name}</span>

        <div className="flex text-gray-600">
          {isPending ? (
            <ActionPending />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <SubmitButton isSubmitting={isPending} className="group hover:bg-green-100">
                    <Trash size={14} className="group-hover:text-green-600" />
                  </SubmitButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Yes, delete!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger onClick={onCancel} disabled={isPending}>
                <CancelAction />
              </TooltipTrigger>
              <TooltipContent>
                <p>No, I changed my mind.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Input {...register("id")} type="hidden" />
      </div>
      {errorResponse !== "" ? <StickyErrorMessage>{errorResponse}</StickyErrorMessage> : null}
    </form>
  );
};
