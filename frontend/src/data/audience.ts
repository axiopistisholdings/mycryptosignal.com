// The ONE place the audience figures shown to prospective sponsors are set.
//
// We never invent an audience size. When a figure is not measured it is `null`
// and the sponsors page shows an honest "launching" state instead of a number.
// Update THIS object (and `asOf`) when a real, measured figure exists — it is the
// single source for any number quoted on /sponsors/. Nothing here is generated;
// it is a deliberate, human-set fact.
export interface AudienceSnapshot {
  /** Active newsletter subscribers, or `null` when not yet measured. */
  newsletterSubscribers: number | null;
  /** Monthly visits, or `null` when not yet measured. */
  monthlyVisits: number | null;
  /** When the figures were last true (`YYYY-MM-DD`), or `null` when unmeasured. */
  asOf: string | null;
}

export const AUDIENCE: AudienceSnapshot = {
  newsletterSubscribers: null,
  monthlyVisits: null,
  asOf: null,
};
