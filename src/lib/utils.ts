import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nip19 } from "nostr-tools";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { Observable, Subscription } from "rxjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncatedNpub(pubkey: string) {
  const npub = pubkey.startsWith("npub1") ? pubkey : nip19.npubEncode(pubkey);
  return npub.slice(0, 8) + "..." + npub.slice(-5);
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
