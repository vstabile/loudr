import { createMemo, createSignal, Show } from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  LucideClipboardCopy,
  LucideHourglass,
  LucideLoader,
} from "lucide-solid";
import { useAuth } from "../contexts/authContext";
import {
  CashuMint,
  CashuWallet,
  MintQuoteResponse,
  MintQuoteState,
} from "@cashu/cashu-ts";
import QRCode from "./QRCode";
import { formatAmount, sleep } from "../lib/utils";

export function AcceptProposalDialog(props: { mint: string; amount: number }) {
  const { state } = useAuth();
  const [isRequestCopied, setIsRequestCopied] = createSignal(false);
  const [isSendingAdaptor, setIsSendingAdaptor] = createSignal(false);
  const [isAdaptorSupportDialogOpen, setIsAdaptorSupportDialogOpen] =
    createSignal(false);
  const [mintQuote, setMintQuote] = createSignal<MintQuoteResponse | null>(
    null
  );
  const [isWaitingForPayment, setIsWaitingForPayment] = createSignal(false);

  const isAdaptorDisabled = createMemo(() => {
    return isSendingAdaptor() || !props.mint;
  });

  async function sendAdaptor() {
    if (isAdaptorDisabled()) return setIsAdaptorSupportDialogOpen(true);

    setIsSendingAdaptor(true);

    try {
      // Make sure we have an nsec
      if (!state.nsec) {
        throw new Error("No nsec available");
      }

      // await actions.run(GenerateAdaptors, props.swap, state.nsec);
    } catch {
    } finally {
      setIsSendingAdaptor(false);
    }
  }

  async function handleOpenChange(isOpen: boolean) {
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
            mintQuote()!.quote!
            // {
            //   pubkey: "02" + account()?.pubkey,
            // }
          );
          console.log(proofs);
          console.log("Payment received");
          setIsWaitingForPayment(false);
        }
        await sleep(3000);
      }
    } else {
      setIsWaitingForPayment(false);
    }
  }

  return (
    <>
      <Dialog onOpenChange={(isOpen) => handleOpenChange(isOpen)}>
        <DialogTrigger class="w-full">
          <button
            class={
              (isAdaptorDisabled()
                ? "bg-green-600/60 cursor-default"
                : "bg-gradient-to-br from-green-600 to-green-500 drop-shadow hover:from-green-600 hover:to-green-400") +
              " flex items-center justify-center border-green-700 text-white px-2 py-2 rounded-md w-full"
            }
            onClick={sendAdaptor}
            disabled={isAdaptorDisabled()}
          >
            <Show when={isSendingAdaptor()} fallback="Accept Proposal">
              <LucideLoader class="w-3 h-3 mr-1 animate-spin" /> Accepting
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
              <span class="font-bold">{formatAmount(props.amount)} sats</span>{" "}
              to this proposal using
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
            <Show when={mintQuote() && mintQuote()!.state === "UNPAID"}>
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
            </Show>
            <div class="flex items-center gap-1 mt-4 text-sm text-primary">
              <LucideHourglass class="w-3 h-3 mr-1" /> Waiting for payment...
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isAdaptorSupportDialogOpen()}
        onOpenChange={setIsAdaptorSupportDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle class="pb-2">
              Generating Adaptor Signatures is not Supported
            </DialogTitle>
            <DialogDescription>
              NIP-07 extensions and NIP-46 remote signers still do not support
              generating adaptor signatures. For now, you need to sign in with
              an nsec, so that the client code can perform the calculations
              needed. Note that only one party of the swap needs to do this, by
              default the one who created the proposal.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
