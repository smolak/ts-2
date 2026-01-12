import copyToClipboard from "copy-to-clipboard";
import { Check, Copy } from "lucide-react";
import { type FC, useEffect, useState } from "react";

type CopyToClipboardProps = {
  string: string;
};

export const CopyToClipboard: FC<CopyToClipboardProps> = ({ string }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 1_500);

      return () => clearTimeout(timeout);
    }
  }, [copied]);

  return copied ? (
    <Check size={14} strokeWidth={4} className="absolute top-3.5 right-3.5 cursor-copy text-green-700 text-lg" />
  ) : (
    <Copy
      size={14}
      onClick={() => {
        copyToClipboard(string);
        setCopied(true);
      }}
      className="absolute top-3.5 right-3.5 cursor-copy text-gray-400 text-lg hover:text-gray-700"
    />
  );
};
