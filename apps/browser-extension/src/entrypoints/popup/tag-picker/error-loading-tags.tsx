import { Button } from "@repo/ui/components/button";
import type { FC } from "react";

type ErrorLoadingTagsProps = {
  onLoadTagsClick: () => void;
};

export const ErrorLoadingTags: FC<ErrorLoadingTagsProps> = ({ onLoadTagsClick }) => {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="font-bold text-gray-900 tracking-tight">
        <span className="inline">We couldncouldn&apos;t load your tags, sorry 😞</span>
      </h1>
      <p>
        We log those things and are aware of the problem.
        <br />
        In the meantime, try loading the tags again:
      </p>
      <p>
        <Button onClick={onLoadTagsClick}>Load tags</Button>
      </p>
    </section>
  );
};
