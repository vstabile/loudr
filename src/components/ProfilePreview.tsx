import { ProfileContent } from "applesauce-core/helpers";
import { truncatedNpub } from "../lib/utils";
import ProfilePicture from "./ProfilePicture";
import { Accessor } from "solid-js";

export function ProfilePreview(props: {
  profile: Accessor<ProfileContent | undefined>;
  pubkey: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const getSizeClass = (size?: "xs" | "sm" | "md" | "lg" | "xl") => {
    switch (size) {
      case "xs":
        return "w-4 h-4";
      case "sm":
        return "w-5 h-5";
      case "md":
        return "w-6 h-6";
      case "lg":
        return "w-8 h-8";
      case "xl":
        return "w-10 h-10";
      default:
        return "w-6 h-6";
    }
  };

  const sizeClass = getSizeClass(props.size);

  return (
    <div class="flex flex-row items-center gap-2">
      <div class={`${sizeClass} rounded-full overflow-hidden`}>
        <ProfilePicture profile={props.profile} pubkey={props.pubkey} />
      </div>
      <span class="truncate">
        {props.profile()?.display_name ||
          props.profile()?.name ||
          truncatedNpub(props.pubkey)}
      </span>
      <p class="text-gray-400 ml-2 text-sm truncate">
        {props.profile() && props.profile()?.nip05}
      </p>
    </div>
  );
}
