"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Separator } from "@repo/ui/components/separator";
import { cn } from "@repo/ui/lib/utils";
import { generateApiKey } from "@repo/user/api-key/generate-api-key";
import debounce from "debounce";
import { AtSign, Info, KeyRound, RefreshCcw, UserCheck2, UserX2 } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { A } from "@/components/a";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { REPOSITORY_URL, WEB_APP_DOMAIN } from "@/lib/constants";
import { api } from "@/trpc/react";

import { type CreateUserProfileSchema, createUserProfileSchema } from "../router/procedures/create-user-profile";
import { usernameCheckSchema } from "../router/procedures/username-check";

interface FormValues {
  username: string;
  apiKey: string;
}

const usernameExamples = ["ThomasAnderson", "__I_AM_ROBOT__", "JeanneDArc"];

export const NewUserProfileForm = () => {
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
  const [usernamePlaceholder, setUsernamePlaceholder] = useState("");
  const [generatedApiKey, setGeneratedApiKey] = useState(apiKey);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<null | boolean>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: usernameCheck } = api.userProfiles.usernameCheck.useMutation({
    onSuccess: (data) => {
      setIsUsernameAvailable(data.usernameAvailable);
    },
  });

  useEffect(() => {
    setUsernamePlaceholder(usernameExamples.sort(() => Math.random() - 0.5)[0] as string);
  }, []);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 1_500);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

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
    "text-green-700": usernameIsValid === true,
    "text-red-600": usernameIsValid === false,
  });

  if (isSuccess) {
    return (
      <section className="flex flex-col gap-4 sm:gap-10">
        <div>
          <h3 className="text-4xl font-medium leading-6 text-gray-900">Profile setting is complete 🎉</h3>
          <Link href="/" passHref>
            <Button>Start using URLSHARE</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 sm:gap-10">
      <div>
        <h3 className="text-4xl font-medium leading-6 text-gray-900">
          Welcome to <strong>{WEB_APP_DOMAIN}</strong> 🤩
        </h3>
        <p className="mt-3 max-w-2xl text-sm text-gray-500">
          Before you continue, make sure you fill out the form below.
        </p>
        <Separator className="mt-5" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-10">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <div className="relative mt-1 flex rounded-md shadow-sm">
                  <span className="absolute inline-flex h-full items-center rounded-l-md px-3 text-sm text-gray-500">
                    <AtSign size={14} />
                  </span>
                  <FormControl className="block w-full flex-1">
                    <Input
                      {...field}
                      placeholder={usernamePlaceholder}
                      className="pl-7"
                      onChange={async (e) => {
                        field.onChange(e);
                        await delayedCheckUsernameAvailability(e);
                      }}
                    />
                  </FormControl>
                  {isUsernameAvailable === false && (
                    <UserX2 size={18} className="absolute right-3.5 top-2.5 text-lg text-red-600" />
                  )}
                  {isUsernameAvailable && (
                    <UserCheck2 size={18} className="absolute right-3.5 top-2.5 text-lg text-green-700" />
                  )}
                </div>
                <FormDescription className={usernameDescriptionClassNames}>
                  Choose a username. 4 to 15 characters long, a-z, A-Z, 0-9 and _ only.
                </FormDescription>
                {isUsernameAvailable === false && (
                  <FormDescription className="text-red-600">Username taken, pick a different one.</FormDescription>
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
                  <span className="absolute inline-flex h-full items-center rounded-l-md px-3 text-sm text-gray-500">
                    <KeyRound size={14} />
                  </span>
                  <FormControl className="block w-full flex-1">
                    <Input {...field} value={generatedApiKey} disabled className="bg-gray-100 pl-10" />
                  </FormControl>
                  <RefreshCcw
                    size={14}
                    onClick={() => setGeneratedApiKey(generateApiKey())}
                    className="absolute right-10 top-3.5 text-lg text-gray-400 hover:text-gray-700"
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
            <Button type="submit" disabled={isUsernameAvailable === false || isSuccess}>
              Save and finish
            </Button>
            <div>
              {isPending && <span className="mr-5 text-sm font-light text-gray-500">Saving...</span>}
              {error?.message && <span className="mr-5 text-sm font-light text-red-600">{error.message}</span>}
            </div>
          </div>
        </form>
      </Form>
    </section>
  );
};
