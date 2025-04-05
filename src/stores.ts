import { EventStore, QueryStore } from "applesauce-core";
import { verifyEvent } from "nostr-tools";

export const eventStore = new EventStore();

// verify the events when they are added to the store
eventStore.verifyEvent = verifyEvent;

// the query store needs the event store to subscribe to it
export const queryStore = new QueryStore(eventStore);
