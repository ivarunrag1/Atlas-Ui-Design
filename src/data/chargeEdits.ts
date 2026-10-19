/* Editing helpers for a rate's leg charges (step 3 — manual edits and Atlas commands). */
import type { ChargeLine, LegCharges, LegKey } from './rates';

type Kind = 'buy' | 'sell';

/** Replace one charge line (by id) in a leg. */
export function replaceCharge(legs: LegCharges[], legKey: LegKey, id: string, next: ChargeLine): LegCharges[] {
  return legs.map((leg) =>
    leg.key !== legKey ? leg : { ...leg, charges: leg.charges.map((c) => (c.id === id ? next : c)) },
  );
}

/** Append a charge line to a leg. */
export function addCharge(legs: LegCharges[], legKey: LegKey, charge: ChargeLine): LegCharges[] {
  return legs.map((leg) => (leg.key !== legKey ? leg : { ...leg, charges: [...leg.charges, charge] }));
}

/** Remove a charge line (by id) from a leg. */
export function removeCharge(legs: LegCharges[], legKey: LegKey, id: string): LegCharges[] {
  return legs.map((leg) => (leg.key !== legKey ? leg : { ...leg, charges: leg.charges.filter((c) => c.id !== id) }));
}

/** Apply a function to every amount of one kind in the matching charges. */
function mapAmounts(
  legs: LegCharges[],
  match: (leg: LegCharges, label: string) => boolean,
  fn: (amount: { buy: number; sell: number }) => number,
  kind: Kind,
): { legs: LegCharges[]; hits: string[] } {
  const hits: string[] = [];
  const next = legs.map((leg) => ({
    ...leg,
    charges: leg.charges.map((c) => {
      if (!match(leg, c.label)) return c;
      hits.push(`${c.label} (${leg.title.split(' · ')[0]})`);
      if (c.perBl) return { ...c, perBl: { ...c.perBl, [kind]: Math.max(0, Math.round(fn(c.perBl))) } };
      const perUnit = Object.fromEntries(
        Object.entries(c.perUnit ?? {}).map(([t, a]) => [t, { ...a, [kind]: Math.max(0, Math.round(fn(a))) }]),
      );
      return { ...c, perUnit };
    }),
  }));
  return { legs: next, hits };
}

const stop = new Set(['the', 'charge', 'charges', 'sell', 'buy', 'fee', 'for', 'and', 'all', 'usd', 'per', 'unit']);

/** Charge matcher from free text, e.g. "destination thc" → Destination port · THC. */
function matcher(phrase: string) {
  const words = phrase
    .toLowerCase()
    .replace(/[^a-z0-9/ ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w));
  return (leg: LegCharges, label: string) => {
    const hay = `${leg.title} ${label}`.toLowerCase();
    return words.length > 0 && words.every((w) => hay.includes(w));
  };
}

/**
 * Run a plain-language command against the charges. Supported:
 *  - "apply 12% margin" / "12% markup"        → sell = buy × (1 + 12%) everywhere
 *  - "add 150 to destination THC"             → +150 on matching sell amounts
 *  - "reduce ocean freight by 200"            → −200 on matching sell amounts
 *  - "waive seal fee" / "remove delivery order" → set matching sell amounts to 0
 * Mention "buy" to change buy amounts instead of sell.
 */
export function runChargeCommand(legs: LegCharges[], text: string): { legs: LegCharges[]; summary: string } | null {
  const t = text.toLowerCase();
  const kind: Kind = /\bbuy\b/.test(t) ? 'buy' : 'sell';

  const pct = t.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct && /margin|markup|mark up|mark-up/.test(t)) {
    const p = Number(pct[1]);
    const r = mapAmounts(legs, () => true, (a) => a.buy * (1 + p / 100), 'sell');
    return { legs: r.legs, summary: `Applied a ${p}% margin — every sell amount is now buy + ${p}%.` };
  }

  const delta =
    t.match(/\b(add|increase|raise)\s+(?:by\s+)?\$?(\d+(?:\.\d+)?)\s*(?:usd)?\s*(?:to|on|for)\s+(.+)/) ??
    t.match(/\b(reduce|decrease|lower|cut)\s+(.+?)\s+by\s+\$?(\d+(?:\.\d+)?)/);
  if (delta) {
    const sign = /add|increase|raise/.test(delta[1]) ? 1 : -1;
    const amount = Number(sign > 0 ? delta[2] : delta[3]);
    const phrase = sign > 0 ? delta[3] : delta[2];
    const r = mapAmounts(legs, matcher(phrase), (a) => a[kind] + sign * amount, kind);
    if (!r.hits.length) return null;
    return {
      legs: r.legs,
      summary: `${sign > 0 ? 'Added' : 'Reduced'} ${amount} ${sign > 0 ? 'to' : 'on'} the ${kind} amount of ${r.hits.join(', ')}.`,
    };
  }

  const zero = t.match(/\b(waive|remove|zero|drop)\s+(.+)/);
  if (zero) {
    const r = mapAmounts(legs, matcher(zero[2]), () => 0, kind);
    if (!r.hits.length) return null;
    return { legs: r.legs, summary: `Set the ${kind} amount of ${r.hits.join(', ')} to 0.` };
  }

  return null;
}

/* ── Common charges (step 3, more than one rate) ───────────────────────────── */

/** Where an extracted common charge came from on each rate (to restore it later). */
export interface CommonExtraction {
  /** Common charges grouped by leg (editable as their own table). */
  legs: LegCharges[];
  /** commonId → rateId → original position + id on that rate. */
  origin: Record<string, Record<string, { legKey: LegKey; index: number; id: string }>>;
}

/** Identity of a charge for "is it the same on every rate": leg, name, basis, currency and amounts. */
const signature = (legKey: LegKey, c: ChargeLine, types: string[]) =>
  JSON.stringify([
    legKey,
    c.label.trim().toLowerCase(),
    c.basis,
    c.currency ?? '',
    c.perBl ? [c.perBl.buy, c.perBl.sell] : types.map((t) => [c.perUnit?.[t]?.buy ?? null, c.perUnit?.[t]?.sell ?? null]),
  ]);

/**
 * Pull out the charges that are identical on every rate. Returns the trimmed legs per
 * rate and the extraction (common table + where each charge came from), or null if
 * nothing is common.
 */
export function extractCommon(
  byRate: Record<string, LegCharges[]>,
  types: string[],
): { byRate: Record<string, LegCharges[]>; extraction: CommonExtraction } | null {
  const rateIds = Object.keys(byRate);
  if (rateIds.length < 2) return null;
  const [first, ...rest] = rateIds;

  const commonLegs: LegCharges[] = [];
  const origin: CommonExtraction['origin'] = {};
  const remove: Record<string, Set<string>> = Object.fromEntries(rateIds.map((r) => [r, new Set<string>()]));

  for (const leg of byRate[first]) {
    const picked: ChargeLine[] = [];
    leg.charges.forEach((c, index) => {
      const sig = signature(leg.key, c, types);
      const matches = rest.map((rid) => {
        const other = byRate[rid].find((l) => l.key === leg.key);
        const i = other?.charges.findIndex((oc) => signature(leg.key, oc, types) === sig) ?? -1;
        return i >= 0 && other ? { rid, index: i, id: other.charges[i].id } : null;
      });
      if (matches.some((m) => !m)) return;
      const commonId = `common-${leg.key}-${index}`;
      picked.push({ ...c, id: commonId });
      origin[commonId] = { [first]: { legKey: leg.key, index, id: c.id } };
      remove[first].add(c.id);
      for (const m of matches) {
        origin[commonId][m!.rid] = { legKey: leg.key, index: m!.index, id: m!.id };
        remove[m!.rid].add(m!.id);
      }
    });
    if (picked.length) commonLegs.push({ ...leg, charges: picked });
  }
  if (!commonLegs.length) return null;

  const trimmed = Object.fromEntries(
    rateIds.map((rid) => [
      rid,
      byRate[rid].map((leg) => ({ ...leg, charges: leg.charges.filter((c) => !remove[rid].has(c.id)) })),
    ]),
  );
  return { byRate: trimmed, extraction: { legs: commonLegs, origin } };
}

/**
 * Put the (possibly edited) common charges back on each rate — at their original
 * positions; charges added to the common table are appended to that leg.
 */
export function restoreCommon(byRate: Record<string, LegCharges[]>, extraction: CommonExtraction): Record<string, LegCharges[]> {
  return Object.fromEntries(
    Object.entries(byRate).map(([rid, legs]) => {
      let next = legs;
      for (const cleg of extraction.legs) {
        // Insert in ascending original index so earlier inserts don't shift later ones.
        const placed = cleg.charges
          .map((c) => ({ c, at: extraction.origin[c.id]?.[rid] }))
          .sort((a, b) => (a.at?.index ?? Infinity) - (b.at?.index ?? Infinity));
        for (const { c, at } of placed) {
          const charge = { ...c, id: at?.id ?? `${c.id}-${rid}` };
          const hasLeg = next.some((l) => l.key === cleg.key);
          next = hasLeg
            ? next.map((l) => {
                if (l.key !== cleg.key) return l;
                const charges = [...l.charges];
                charges.splice(at ? Math.min(at.index, charges.length) : charges.length, 0, charge);
                return { ...l, charges };
              })
            : [...next, { ...cleg, charges: [charge] }];
        }
      }
      return [rid, next];
    }),
  );
}
