import { createMemo, createSignal, Show } from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  LucideClipboardCopy,
  LucideHourglass,
  LucideLoader,
} from "lucide-solid";
import {
  CashuMint,
  CashuWallet,
  MintQuoteResponse,
  MintQuoteState,
  Proof,
} from "@cashu/cashu-ts";
import QRCode from "./QRCode";
import { formatAmount, sleep } from "../lib/utils";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { AcceptProposal } from "../actions/acceptProposal";
import { actions } from "../actions/hub";
import { Swap } from "../queries/swap";

export function AcceptProposalDialog(props: {
  swap: Swap;
  mint: string;
  amount: number;
}) {
  const cashuPrivateKey = generateSecretKey();
  const cashuPublicKey = getPublicKey(cashuPrivateKey);
  const [isRequestCopied, setIsRequestCopied] = createSignal(false);
  const [isSendingAdaptor, setIsSendingAdaptor] = createSignal(false);
  const [mintQuote, setMintQuote] = createSignal<MintQuoteResponse | null>(
    null
  );
  const [isWaitingForPayment, setIsWaitingForPayment] = createSignal(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = createSignal(false);
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);

  const isDialogDisabled = createMemo(() => {
    return isSendingAdaptor() || !props.mint;
  });

  async function sendAdaptor(proofs: Proof[]) {
    setIsSendingAdaptor(true);

    try {
      await actions.run(
        AcceptProposal,
        props.swap,
        props.mint,
        proofs,
        cashuPrivateKey
      );

      localStorage.removeItem(`cashu-proofs-${cashuPublicKey}`);
    } catch {
    } finally {
      setIsSendingAdaptor(false);
      setIsDialogOpen(false);
    }
  }

  async function handleOpenChange(isOpen: boolean) {
    setIsDialogOpen(isOpen);
    if (isOpen) {
      const mint = new CashuMint(props.mint);
      // Check if the mint supports the necessary NUTs
      const mintInfo = await mint.getInfo();
      const isSupported =
        mintInfo.nuts["7"]?.supported &&
        mintInfo.nuts["10"]?.supported &&
        mintInfo.nuts["11"]?.supported;

      if (!isSupported) {
        throw new Error("Mint does not support NUT-07, NUT-10 and NUT-11");
      }

      const wallet = new CashuWallet(mint);
      await wallet.loadMint();
      const quote = await wallet.createMintQuote(props.amount);
      setMintQuote(quote);

      // Wait for payment
      setIsWaitingForPayment(true);
      while (isWaitingForPayment()) {
        console.log("Waiting for payment");
        const status = await wallet.checkMintQuote(mintQuote()?.quote!);

        if (status && status.state === MintQuoteState.PAID) {
          const proofs = await wallet.mintProofs(
            props.amount,
            mintQuote()!.quote!,
            {
              pubkey: "02" + cashuPublicKey,
            }
          );

          // Cache proofs locally until they are sent as an adaptor event
          const key = `cashu-proofs-${cashuPublicKey}`;
          const existing = localStorage.getItem(key);
          let allProofs = [];

          if (existing) {
            try {
              allProofs = JSON.parse(existing);
            } catch {
              allProofs = [];
            }
          }

          allProofs = allProofs.concat(proofs);
          localStorage.setItem(key, JSON.stringify(allProofs));
          console.log(proofs);
          console.log("Payment received");
          setIsPaymentConfirmed(true);
          setIsWaitingForPayment(false);
          sendAdaptor(proofs);
        }
        await sleep(3000);
      }
    } else {
      setIsWaitingForPayment(false);
      setIsPaymentConfirmed(false);
    }
  }

  return (
    <Dialog open={isDialogOpen()} onOpenChange={handleOpenChange}>
      <DialogTrigger class="w-full">
        <button
          class={
            (isDialogDisabled()
              ? "bg-green-600/60 cursor-default"
              : "bg-gradient-to-br from-green-600 to-green-500 drop-shadow hover:from-green-600 hover:to-green-400") +
            " flex items-center justify-center border-green-700 text-white px-2 py-2 rounded-md w-full"
          }
          disabled={isDialogDisabled()}
        >
          <Show when={isSendingAdaptor()} fallback="Accept Proposal">
            <LucideLoader class="w-3 h-3 mr-1 animate-spin" /> Sending adaptor
            signature...
          </Show>
        </button>
      </DialogTrigger>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle class="text-center">Accept Proposal</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col items-center text-center">
          <div class="mb-2">
            Lock{" "}
            <span class="font-bold">{formatAmount(props.amount)} sats</span> to
            this proposal using
            <br />
            <span class="text-muted-foreground">{props.mint}</span>
          </div>
          <Show when={!mintQuote()}>
            <div class="flex flex-col items-center justify-center h-[240px] w-[240px]">
              <LucideLoader class="w-4 h-4 mr-1 animate-spin" />
              <div class="text-xs mt-2 text-muted-foreground">
                Generating quote...
              </div>
            </div>
          </Show>
          <Show when={isPaymentConfirmed()}>
            <div class="flex flex-col items-center justify-between">
              <div class="flex flex-col items-center justify-center h-[240px] w-[240px]">
                <div class="animate-bounce">
                  <svg
                    class="w-16 h-16 text-green-500 animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div class="text-sm mt-2 text-green-600 font-medium">
                  Payment Confirmed!
                </div>
              </div>
              <Show when={isSendingAdaptor()}>
                <div class="flex items-center gap-1 mt-4 text-sm text-primary">
                  <LucideLoader class="w-3 h-3 mr-1 animate-spin" /> Sending
                  adaptor signature...
                </div>
              </Show>
            </div>
          </Show>
          <Show
            when={
              mintQuote() &&
              mintQuote()!.state === "UNPAID" &&
              !isPaymentConfirmed()
            }
          >
            <QRCode data={mintQuote()?.request!} width={240} height={240} />
            <div class="mt-2 text-xs text-gray-500 break-all max-w-full overflow-hidden flex items-center gap-2">
              {mintQuote()?.request}
            </div>
            <button
              class="flex text-xs items-center gap-1 p-1.5 hover:bg-gray-100 rounded-md transition-colors mt-1"
              onClick={() => {
                if (mintQuote()?.request) {
                  navigator.clipboard.writeText(mintQuote()?.request!);
                  setIsRequestCopied(true);
                }
              }}
              title="Copy to clipboard"
            >
              <LucideClipboardCopy class="w-3 h-3" />{" "}
              {isRequestCopied() ? "Copied" : "Copy"}
            </button>
            <div class="flex items-center gap-1 mt-4 text-sm text-primary">
              <LucideHourglass class="w-3 h-3 mr-1" /> Waiting for payment...
            </div>
          </Show>
        </div>
      </DialogContent>
    </Dialog>
  );
}
