import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nip19, NostrEvent, UnsignedEvent } from "nostr-tools";
import { createEffect, createSignal, from, onCleanup } from "solid-js";
import { Observable, Subscription } from "rxjs";
import { ProfileContent } from "applesauce-core/helpers";
import { queryStore } from "../stores/queryStore";
import { ProfileQuery } from "applesauce-core/queries";
import { replaceableLoader } from "./loaders";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function truncate(value: string, length: number = 15) {
  if (value.length <= length) {
    return value;
  }

  return value.slice(0, length - 5) + "..." + value.slice(-5);
}

export function truncatedNpub(pubkey: string) {
  const npub = pubkey.startsWith("npub1") ? pubkey : nip19.npubEncode(pubkey);
  return truncate(npub);
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "just now";
  }
}

export function waitForNip07(retries = 10, delay = 100): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    const check = () => {
      if (window.nostr) {
        resolve(true);
      } else if (attempts < retries) {
        attempts++;
        setTimeout(check, delay);
      } else {
        resolve(false);
      }
    };
    check();
  });
}

export function fromReactive<T>(getObservable: () => Observable<T>) {
  const [value, setValue] = createSignal<T>();

  createEffect(() => {
    const observable = getObservable();
    const subscription: Subscription = observable.subscribe(setValue);

    onCleanup(() => subscription.unsubscribe());
  });

  return value;
}

export function profileName(
  profile: ProfileContent | undefined,
  pubkey: string
) {
  return profile?.display_name || profile?.name || truncatedNpub(pubkey);
}

export function formatContent(content: string) {
  return content.replace(/nostr:npub1[a-zA-Z0-9]+/g, (match) => {
    const [npubProfiles, setNpubProfiles] = createSignal(
      new Map<string, ProfileContent | undefined>()
    );
    const npubMatches = content.match(/nostr:npub1[a-zA-Z0-9]+/g) || [];

    for (const match of npubMatches) {
      const npub = match.replace("nostr:", "");
      try {
        const pubkey = nip19.decode(npub).data as string;
        const profile = from(queryStore.createQuery(ProfileQuery, pubkey));

        replaceableLoader.next({
          pubkey,
          kind: 0,
        });

        // Store the profile in our map
        setNpubProfiles((prev) => new Map(prev).set(npub, profile()));
      } catch (error) {
        console.error(error);
      }
    }

    const npub = match.replace("nostr:", "");
    const profile = npubProfiles().get(npub);
    const displayName = truncate(profileName(profile, npub));

    return `<a href="https://njump.me/${npub}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${displayName}</a>`;
  });
}

export function formatNoteContent(event: NostrEvent | UnsignedEvent) {
  return (
    event.content
      // Handle line breaks
      .replace(/\n/g, "<br />")
      // Handle URLs - limit display length to 40 chars
      .replace(/(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g, (url: string) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline max-w-full inline-block text-ellipsis overflow-hidden">${url}</a>`;
      })
      // Handle nostr:<bech32> references
      .replace(
        /nostr:([a-z0-9]+1[023456789acdefghjklmnpqrstuvwxyz]+)/g,
        (match: string, bech32: string) => {
          // Remove event mentions
          if (bech32.startsWith("nevent")) {
            return "";
          }

          return `<a href="https://njump.me/${bech32}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${match}</a>`;
        }
      )
      // Handle hashtags
      .replace(
        /#[\w\u0590-\u05ff]+/g,
        (tag) => `<span class="text-primary">${tag}</span>`
      )
      // Remove line breaks at the end of the content
      .replace(/<br \/>$/g, "")
  );
}

export function campaignUrl(pubkey: string, dTag: string, baseUrl?: string) {
  return `${baseUrl || "https://loudr.me"}/c/${pubkey}/${dTag}`;
}

export function formatAmount(amount: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });

  return formatter.format(amount);
}
