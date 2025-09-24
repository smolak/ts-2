import { scrapeMetadata } from "@repo/metadata-scrapper/scrape-metadata";
import type { ScrappedMetadata } from "@repo/metadata-scrapper/types";
import axios from "axios";
import { useEffect, useState } from "react";

import { AddUrl } from "./add-url";
import { API_KEY_STORAGE_KEY } from "./constants/storage";
import { useLocalStorage } from "./hooks/use-local-storage";
import { Settings } from "./settings";
import { SettingsButton } from "./settings/settings-button";
import { getImageDimensions } from "./utils/get-image-dimensions";
import { isUrl } from "./utils/is-url";
import { isHtml, isImage, isText } from "./utils/mime-type-detection";
import { takeNCharacters } from "./utils/take-n-characters";

// TODO: unify this in metadata, metadata-scrapper and browser-extension and wherevere else it's used
// To have one definition of Metadata
type Metadata = ScrappedMetadata & { contentType: string };

const fetchHtml = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) return;

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return document.documentElement.outerHTML;
    },
  });

  return result;
};

const PopupComponent = () => {
  const [canAddUrls, setCanAddUrls] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [currentUrl, setCurrentUrl] = useState("");
  const [textContent, setTextContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [apiKey, setApiKey] = useLocalStorage<string>(API_KEY_STORAGE_KEY, "");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentUrl = tabs[0].url || "";

      if (currentUrl) {
        setCurrentUrl(currentUrl);
        setTextContent(null);
        setContentType(null);
        setMetadata(null);
      }
    });
  }, []);

  useEffect(() => {
    if (apiKey.trim() !== "") {
      const canAddUrls = apiKey !== "";

      setCanAddUrls(canAddUrls);
      setShowSettings(!canAddUrls);
    }
  }, [apiKey]);

  useEffect(() => {
    if (canAddUrls && currentUrl && isUrl(currentUrl)) {
      setTextContent(null);
      setContentType(null);
      setMetadata(null);
      setMetadata(null);

      axios.get(currentUrl).then((response) => {
        const contentType: string = response.headers["content-type"].split(";")[0];

        setContentType(contentType);

        if (isText(contentType) && response.status === 200) {
          setTextContent(response.data);
        }
      });
    }
  }, [canAddUrls, currentUrl]);

  useEffect(() => {
    if (contentType) {
      if (isHtml(contentType)) {
        fetchHtml().then((html) => {
          if (html) {
            const document = new DOMParser().parseFromString(html, "text/html");
            const metadata = scrapeMetadata({
              document,
              url: currentUrl,
            });

            setMetadata({ ...metadata, contentType });
          }
        });
      } else if (isText(contentType)) {
        setMetadata({
          title: currentUrl,
          url: currentUrl,
          // TODO: move this characters number to some config or data based on max accepted characters in the DB
          description: takeNCharacters(200, textContent || ""),
          contentType,
        });
      } else if (isImage(contentType)) {
        getImageDimensions(currentUrl).then(console.log);

        setMetadata({
          title: currentUrl,
          url: currentUrl,
          imageUrl: currentUrl,
          contentType,
        });
      }
    }
  }, [textContent, contentType, currentUrl]);

  const saveApiKey = (apiKey: string) => {
    setCanAddUrls(apiKey !== "");
    setApiKey(apiKey);
  };

  return (
    <div className="w-96 p-2">
      {showSettings && (
        <Settings
          values={{ apiKey }}
          onClose={() => setShowSettings(false)}
          onSubmit={(formData) => {
            saveApiKey(formData.apiKey);
            setShowSettings(false);
          }}
        />
      )}
      {!showSettings && canAddUrls && currentUrl && (
        <>
          <SettingsButton className="absolute right-2" onClick={() => setShowSettings(true)} />
          <AddUrl apiKey={apiKey} url={currentUrl} metadata={metadata} />
        </>
      )}
    </div>
  );
};

export default PopupComponent;
