"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/utils";
import { apiKeySchema } from "@repo/user/api-key/api-key.schema";
import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { usernameSchema } from "@repo/user-profile/username/schemas/username.schema";
import debounce from "debounce";
import { ExternalLink, Info, KeyRound, RefreshCcw, UserCheck2, UserX2 } from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { A } from "@/components/a";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { REPOSITORY_URL } from "@/lib/constants";
import { api } from "@/trpc/react";
import type { CreateUserProfileSchema } from "../router/procedures/create-user-profile";

const NOT_ALLOWED_NORMALIZED_USERNAMES = ["admin", "urlshare", "contact", "accounting", "security"];

const restrictedUsernameSchema = usernameSchema.refine(
  (username) => {
    return (
      !NOT_ALLOWED_NORMALIZED_USERNAMES.includes(username.toLowerCase()) ||
      username.toLocaleLowerCase().startsWith("urlshare")
    );
  },
  {
    message: "Username not allowed.",
  },
);

const createUserProfileSchema = z.object({
  apiKey: apiKeySchema,
  username: restrictedUsernameSchema,
});

const usernameCheckSchema = z.object({
  username: usernameSchema,
});

interface FormValues {
  username: string;
  apiKey: string;
}

export const NewUserProfileForm = ({ className }: { className?: string }) => {
  const { mutate: saveUserProfileData, isPending, isSuccess, error } = api.userProfiles.createUserProfile.useMutation();
  const apiKey = generateApiKey();

  const form = useForm<CreateUserProfileSchema>({
    resolver: zodResolver(createUserProfileSchema),
    defaultValues: {
      username: "",
      apiKey,
    },
    criteriaMode: "all",
  });

  const [usernameIsValid, setUsernameIsValid] = useState<null | boolean>(null);
  const [generatedApiKey, setGeneratedApiKey] = useState(apiKey);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<null | boolean>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: usernameCheck } = api.userProfiles.usernameCheck.useMutation({
    onSuccess: (data) => {
      setIsUsernameAvailable(data.usernameAvailable);
    },
  });

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 1_500);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

  useEffect(() => {
    console.log({ isSuccess });

    if (isSuccess) {
      window.location.reload();
    }
  }, [isSuccess]);

  const onSubmit = async (userProfileData: FormValues) => {
    saveUserProfileData(userProfileData);
  };

  const checkUsernameAvailability = async (username: string) => {
    const validationResult = usernameCheckSchema.safeParse({ username });

    if (validationResult.success) {
      form.clearErrors("username");
      setUsernameIsValid(true);

      usernameCheck({ username });
    } else {
      setUsernameIsValid(false);

      await form.trigger("username");
    }
  };

  const delayedCheckUsernameAvailability = debounce(async (e: ChangeEvent<HTMLInputElement>) => {
    await checkUsernameAvailability(e.target.value);
  }, 500);

  const usernameDescriptionClassNames = cn({
    "text-lead": usernameIsValid === true,
    "text-red-800": usernameIsValid === false,
  });

  return (
    <section className={cn(className, "flex flex-col gap-4 sm:gap-10")}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-10">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <div className="relative mt-1 flex rounded-md shadow-sm">
                  <FormControl className="block w-full flex-1">
                    <Input
                      {...field}
                      onChange={async (e) => {
                        field.onChange(e);
                        await delayedCheckUsernameAvailability(e);
                      }}
                    />
                  </FormControl>
                  {isUsernameAvailable === false && (
                    <UserX2 size={18} className="absolute top-2.5 right-3.5 text-lg text-red-800" />
                  )}
                  {isUsernameAvailable && (
                    <UserCheck2 size={18} className="absolute top-2.5 right-3.5 text-lead text-lg" />
                  )}
                </div>
                <FormDescription className={usernameDescriptionClassNames}>
                  Choose a username. 4 to 15 characters long, a-z, A-Z, 0-9 and _ only.
                </FormDescription>
                {isUsernameAvailable === false && (
                  <FormDescription className="text-red-800">Username taken, pick a different one.</FormDescription>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API key</FormLabel>
                <div className="relative mt-1 flex rounded-md shadow-sm">
                  <span className="absolute inline-flex h-full items-center rounded-l-md px-3 text-gray-500 text-sm">
                    <KeyRound size={14} />
                  </span>
                  <FormControl className="block w-full flex-1">
                    <Input {...field} value={generatedApiKey} disabled className="bg-gray-100 pl-10" />
                  </FormControl>
                  <RefreshCcw
                    size={14}
                    onClick={() => setGeneratedApiKey(generateApiKey())}
                    className="absolute top-3.5 right-10 text-gray-400 text-lg hover:text-gray-700"
                  />
                  <CopyToClipboard string={generatedApiKey} />
                </div>
                <FormDescription className="flex items-center gap-2">
                  <Info size={14} strokeWidth={2.5} />{" "}
                  <span className="flex flex-row">
                    <span>Can only be generated. If you&apos;re wondering how it&apos;s done, checkout the</span>
                    <A href={REPOSITORY_URL} target="_blank" className="ml-1 flex">
                      source code <ExternalLink className="h-3 w-3" />
                    </A>
                    .
                  </span>
                </FormDescription>
              </FormItem>
            )}
          />

          <div className="flex items-center gap-10">
            <Button type="submit" disabled={isUsernameAvailable === false || isSuccess}>
              Save and start using the platform
            </Button>
            <div>
              {isPending && <span className="mr-5 font-light text-gray-500 text-sm">Saving...</span>}
              {error?.message && <span className="mr-5 font-light text-red-600 text-sm">{error.message}</span>}
            </div>
          </div>
        </form>
      </Form>
    </section>
  );
};
