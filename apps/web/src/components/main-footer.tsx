import { Button } from "@repo/ui/components/button";
import { Chrome, Github } from "lucide-react";

import { Logo } from "./logo";

export const MainFooter = () => {
  return (
    <footer className="container flex h-16 items-center justify-between border-t text-sm">
      <div className="flex items-center gap-2">
        <Logo />
        <p>Copyright © 2025 - All right reserved</p>
      </div>
      <div className="flex items-center">
        <Button variant="link">
          <a
            href="https://chrome.google.com/webstore/detail/urlshareapp/opfefpdpfmiojckgalgilommelcmfcin"
            target="_blank"
            rel="noreferrer"
          >
            <Chrome size={12} className="inline" /> Chrome extension
          </a>
        </Button>
        <a href="https://github.com/urlshare/monorepo" target="_blank" rel="noreferrer">
          <Github size={18} className="inline" /> Source code
        </a>
      </div>
    </footer>
  );
};
