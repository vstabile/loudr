import { createRxNostr, noopVerifier } from "rx-nostr";

export const rxNostr = createRxNostr({
  // skip verification here because we are going to verify events at the event store
  skipVerify: true,
  verifier: noopVerifier,
});

rxNostr.setDefaultRelays([
  "wss://relay.kartapio.com",
  "wss://relay.primal.net",
  "wss://relay.damus.io",
]);

export const KINDS = {
  CAMPAIGN: 30456,
  PROPOSAL: 455,
  NONCE: 456,
  ADAPTOR: 457,
  DELETION: 5,
};
