import type { UserProfile } from "@repo/db/types";
import { cn } from "@repo/ui/lib/utils";
import { User } from "lucide-react";
import type { FC } from "react";

interface UserImageProps {
  username: UserProfile["username"];
  imageUrl?: UserProfile["imageUrl"];
  size?: "big" | "small";
  className?: string;
}

const imageClasses = new Map<UserImageProps["size"], string>();
imageClasses.set("big", "h-[70px] w-[70px]");
imageClasses.set("small", "h-11 w-11");

const placeholderClasses = new Map<UserImageProps["size"], string>();
placeholderClasses.set("big", "h-[60px] w-[60px]");
placeholderClasses.set("small", "h-10 w-10");

export const UserImage: FC<UserImageProps> = ({ username, imageUrl, size = "small", className }) => {
  return imageUrl ? (
    <img
      className={cn(imageClasses.get(size), "rounded-full p-0.5 ring-slate-400 hover:ring-1", className)}
      src={imageUrl}
      alt={username || ""}
    />
  ) : (
    <span className={placeholderClasses.get(size)}>
      <User
        className={cn(
          placeholderClasses.get(size),
          "rounded-full p-1 text-gray-400 ring-slate-400 hover:ring-1",
          className,
        )}
        size={12}
      />
    </span>
  );
};
