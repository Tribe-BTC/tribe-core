import * as nostr from 'nostr-tools';
import { RELAYS } from '../config';
import { Filter } from 'nostr-tools';

export type NostrBitpacs = {
  id: string;
  name: string;
  threshold: number;
  pubkeys: string[];
};

const fetchBitpacsByPubkey = async (
  pubkey: string,
): Promise<NostrBitpacs[]> => {
  const filter: Filter = {
    kinds: [2857],
    '#z': [pubkey],
  };
  const pool = new nostr.SimplePool();
  let events = await pool.querySync(RELAYS, filter);

  const dTags = events.map((e) =>
    e.tags.filter((tag) => tag[0] === 'd').map((tag) => tag[1]),
  );
  const ids = dTags.flat();

  const bitpacs = await fetchBitpacs(ids);
  return bitpacs;
};

const fetchBitpacs = async (ids: string[]): Promise<NostrBitpacs[]> => {
  const filter: Filter = {
    kinds: [2858],
    ids,
  };
  const pool = new nostr.SimplePool();
  let events = await pool.querySync(RELAYS, filter);
  const bitpacs: NostrBitpacs[] = events.map((e) => {
    const content = JSON.parse(e.content);
    const name: string = content[0];
    const [threshold, pubkeys] = content[1];

    // pubkeys & bitpac pubkey
    return {
      id: e.id,
      name,
      threshold,
      pubkeys,
    };
  });

  return bitpacs;
};

export { fetchBitpacsByPubkey };
