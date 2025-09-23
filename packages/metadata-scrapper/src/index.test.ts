import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

import { scrapeMetadata } from "./index";

describe("metadata-scrapper", () => {
  it("should work for article from ppe", async () => {
    const articleFromPpe = await readFile(resolve(__dirname, "./fixtures/article-from-ppe.html"), "utf-8");

    const document = new JSDOM(articleFromPpe).window.document;
    const metadata = scrapeMetadata({
      document,
      url: "https://www.ppe.pl/publicystyka/362618/ninja-gaiden-ii-black-tecmo-wrocilo-do-starych-nawykow.html",
    });

    expect(metadata).toEqual({
      author: "Krzysztof",
      date: "2025-02-02T17:42:19.000Z",
      description:
        "W pozytywnym sensie. Tęsknota za Ryu Hayabusą ciągnęła się wśród graczy latami. Powrót serii Ninja Gaiden to bardzo dobry znak dla fanów gier akcji. Dawniej to przygodowe slashery wyznaczały kierunki i ustalały poziom wyzwania. Potem przysz�...",
      faviconUrl: "https://www.ppe.pl/build/client/images/icons/apple-touch-icon.4bcbd398.png",
      imageUrl: "https://pliki.ppe.pl/storage/1c147774e5f7e127de7e/1c147774e5f7e127de7e.jpg",
      lang: undefined,
      logoUrl: undefined,
      publisher: "ppe.pl",
      title: "Ninja Gaiden II: Black - Tecmo wróciło do starych nawyków",
      url: "https://www.ppe.pl/publicystyka/362618/ninja-gaiden-ii-black-tecmo-wrocilo-do-starych-nawykow.html",
    });
  });

  it("should work for a blogpost from dev.to", async () => {
    const blogpost = await readFile(resolve(__dirname, "./fixtures/blogpost.html"), "utf-8");

    const document = new JSDOM(blogpost).window.document;
    const metadata = scrapeMetadata({
      document,
      url: "https://aicyberinsights.com/hacker-wins-47000-by-outsmarting-an-ai-chatbot-designed-never-to-transfer-money",
    });

    expect(metadata).toEqual({
      author: "Isu Abdulrauf",
      date: "2024-12-04T12:34:24.000Z",
      description:
        'A hacker known as "p0pular.eth" has claimed a $47,000 prize by outsmarting an AI chatbot named Freysa, designed to resist any attempts to',
      faviconUrl: "https://aicyberinsights.com/wp-content/uploads/2024/04/cropped-Logo-ACI-32x32.png",
      imageUrl: "https://aicyberinsights.com/wp-content/uploads/2024/12/freysa_ai.jpg",
      lang: "en",
      logoUrl: undefined,
      publisher: "AI Cyber Insights",
      title: "Hacker Wins $47,000 by Outsmarting an AI Chatbot Designed Never to Transfer Money - AI Cyber Insights",
      url: "https://aicyberinsights.com/?p=4288",
    });
  });
});
