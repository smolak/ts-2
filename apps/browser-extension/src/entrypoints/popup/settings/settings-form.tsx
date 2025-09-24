import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { apiKeySchema } from "@repo/user/api-key/api-key.schema";
import { KeyRound } from "lucide-react";
import { type FC, useState } from "react";

export type SettingsFormValues = {
  apiKey: string;
};

export type OnFormSubmit = (formData: SettingsFormValues) => void;

type SettingsFormProps = {
  values: SettingsFormValues;
  onSubmit: OnFormSubmit;
};

export const SettingsForm: FC<SettingsFormProps> = ({ onSubmit, values }) => {
  const [apiKey, setApiKey] = useState(values.apiKey);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3 p-2"
      id="settings"
      onSubmit={(e) => {
        e.preventDefault();
        setValidationMessage(null);

        const target = e.target as typeof e.target & {
          apiKey: { value: string };
        };
        const formValues: SettingsFormValues = {
          apiKey: target.apiKey.value,
        };

        const { error, data, success } = apiKeySchema.safeParse(formValues.apiKey);

        if (error) {
          setValidationMessage("Invalid API key.");
        }

        if (success) {
          onSubmit({ apiKey: data });
        }
      }}
    >
      <div>
        <label
          htmlFor="apiKey"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          API key
        </label>
        <div className="relative mt-1 flex rounded-md shadow-sm">
          <span className="absolute inline-flex h-full items-center rounded-l-md px-3 text-sm text-gray-500">
            <KeyRound size={14} />
          </span>
          <Input
            className="bg-gray-100 pl-10 w-full"
            name="apiKey"
            type="password"
            value={apiKey}
            id="apiKey"
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        {validationMessage !== null && <p>{validationMessage}</p>}
      </div>

      <aside className="rounded bg-sky-400/10 px-3 py-1 text-sky-600">
        API key is used to add URLs through this plugin.
        <br /> You can find it in your{" "}
        <a className="underline" href={`http://localhost:3000/settings/profile`} target="_blank" rel="noreferrer">
          profile settings
        </a>
        .
      </aside>

      <div>
        <Button type="submit">Save key</Button>
      </div>
    </form>
  );
};
