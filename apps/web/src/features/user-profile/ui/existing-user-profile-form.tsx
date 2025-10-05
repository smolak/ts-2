"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import { AtSign, Info, KeyRound, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { A } from "@/components/a";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { REPOSITORY_URL } from "@/lib/constants";
import { api } from "@/trpc/react";
import { type UpdateUserProfileSchema, updateUserProfileSchema } from "../router/procedures/update-user-profile";
import type { CompleteUserProfileSchema } from "../schemas/complete-user-profile.schema";

export const ExistingUserProfileForm = ({ username, apiKey }: CompleteUserProfileSchema) => {
  const { mutate: saveUserProfile, isPending, isSuccess, error } = api.userProfiles.updateUserProfile.useMutation();

  const form = useForm<UpdateUserProfileSchema>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      apiKey,
    },
    criteriaMode: "all",
  });

  const [generatedApiKey, setGeneratedApiKey] = useState(apiKey);
  const onSubmit = (userProfile: UpdateUserProfileSchema) => saveUserProfile(userProfile);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 sm:gap-10">
        <FormItem>
          <FormLabel>Username</FormLabel>
          <div className="relative mt-1 flex rounded-md shadow-sm">
            <span className="absolute inline-flex h-full items-center rounded-l-md px-3 text-sm text-gray-500">
              <AtSign size={14} />
            </span>
            <FormControl className="block w-full flex-1">
              <Input value={username} disabled className="bg-gray-100 pl-10" />
            </FormControl>
          </div>
          <FormDescription>This is your public display name.</FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API key</FormLabel>
              <div className="relative mt-1 flex rounded-md shadow-sm">
                <span className="absolute inline-flex h-full items-center rounded-l-md px-3 text-sm text-gray-500">
                  <KeyRound size={14} />
                </span>
                <FormControl className="block w-full flex-1">
                  <Input {...field} value={generatedApiKey} disabled className="bg-gray-100 pl-10" />
                </FormControl>
                <RefreshCcw
                  size={14}
                  onClick={() => {
                    const newValue = generateApiKey();
                    form.setValue("apiKey", newValue);
                    setGeneratedApiKey(newValue);
                  }}
                  className="absolute right-10 top-3.5 cursor-copy text-lg text-gray-400 hover:text-gray-700"
                />
                <CopyToClipboard string={generatedApiKey} />
              </div>
              <FormDescription className="flex items-center gap-2">
                <Info size={14} strokeWidth={2.5} />{" "}
                <span>
                  Can only be generated. If you&apos;re wondering how it&apos;s done, checkout the{" "}
                  <A href={REPOSITORY_URL} target="_blank">
                    source code
                  </A>
                  .
                </span>
              </FormDescription>
            </FormItem>
          )}
        />
        <div className="flex items-center gap-10">
          <Button type="submit">Save</Button>
          <div>
            {isPending && <span className="mr-5 text-sm font-light text-gray-500">Saving...</span>}
            {isSuccess && <span className="mr-5 text-sm font-light text-green-700">Profile data saved</span>}
            {error?.message && <span className="mr-5 text-sm font-light text-red-600">{error.message}</span>}
          </div>
        </div>
      </form>
    </Form>
  );
};
