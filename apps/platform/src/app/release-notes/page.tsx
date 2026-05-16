export default function ReleaseNotesPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-100">Release Notes</h1>
        <p className="text-slate-400 text-sm mt-1">
          A running log of everything shipped in Nexus CDP.
        </p>
      </div>

      <div className="space-y-10">

        {/* v1.3 */}
        <Release version="1.3" date="May 16, 2026" label="latest">
          <Section title="Webhooks & Offer Generation">
            <Item type="new">
              Active Driver signal now automatically generates two personalized rewards offers via
              webhook — <strong>3× Points on Your Next Rental</strong> and{' '}
              <strong>500 Bonus Points on Your Next Service Visit</strong>. Offers appear on the
              Apex Rewards loyalty portal dashboard when the signal fires.
            </Item>
            <Item type="new">
              Added <code>POST /webhooks/offers</code> receiver endpoint on the API. Verifies
              HMAC-SHA256 signature, checks the signal name, and writes offers to the new{' '}
              <code>profile_offers</code> table. Idempotent — duplicate firings are safely ignored.
            </Item>
            <Item type="new">
              Added <code>GET /profiles/:profileId/offers</code> endpoint returning active,
              unclaimed offers for a profile.
            </Item>
            <Item type="new">
              Webhook Subscriptions page now includes a <strong>Webhook Request Format</strong>{' '}
              reference section showing all request headers and a sample request body, so teams
              know exactly what their endpoint will receive.
            </Item>
            <Item type="new">
              Signal dropdown in the Add Subscription form is now a custom picker showing each
              signal's name and full description instead of a plain select.
            </Item>
          </Section>
          <Section title="Infrastructure">
            <Item type="fix">
              Fixed duplicate signal rules accumulating on every API deploy. Added{' '}
              <code>UNIQUE (signal_id, sort_order)</code> constraint to <code>signal_rules</code>{' '}
              and <code>ON CONFLICT DO NOTHING</code> to all seed inserts — migration is now fully
              idempotent.
            </Item>
            <Item type="new">
              Database schema and seed data now run automatically on every API startup via a
              migration script, eliminating the need for manual SQL execution after deploys.
            </Item>
            <Item type="new">
              Deployed all 7 services to Railway — API, signal engine, webhook dispatcher, CDP
              platform, storefront, loyalty portal, and telemetry simulator are all publicly
              hosted with managed Postgres and Redis.
            </Item>
          </Section>
        </Release>

        {/* v1.2 */}
        <Release version="1.2" date="May 15, 2026">
          <Section title="Event Catalog">
            <Item type="new">
              New <strong>Event Catalog</strong> page listing all 19 event types across 5 domains
              — Digital, Loyalty, Connected Vehicle, In-Store, and Rental. Each entry shows the
              event type, source app, transport method, property schema, and live ingestion count
              pulled from the API.
            </Item>
            <Item type="new">
              Accordion-style cards expand to reveal the full property schema for each event,
              making it easy to understand what data is captured at each touchpoint.
            </Item>
          </Section>
          <Section title="Signals">
            <Item type="new">
              Signal detail pages at <code>/signals/:signalId</code> — view the full signal
              configuration including time window and all rules, and edit everything inline without
              leaving the page.
            </Item>
            <Item type="new">
              Signal Stream page now loads historical firings on mount so the feed isn't empty when
              you first open it. Filterable by signal name.
            </Item>
            <Item type="fix">
              Signal engine now gracefully recovers when the Redis consumer group is lost after a
              demo reset, recreating the group automatically instead of crashing.
            </Item>
          </Section>
          <Section title="Platform">
            <Item type="new">
              <strong>Reset Demo Data</strong> button in the nav clears all profiles, events, and
              signal firings while preserving signals and webhook subscriptions. Page reloads
              automatically after reset.
            </Item>
            <Item type="fix">
              Demo reset no longer deletes Redis streams, which was causing the signal engine to
              miss events fired immediately after a reset.
            </Item>
          </Section>
        </Release>

        {/* v1.1 */}
        <Release version="1.1" date="May 14, 2026">
          <Section title="Session Persistence">
            <Item type="new">
              Storefront and Loyalty Portal now remember the logged-in user across page refreshes
              using <code>localStorage</code>. Identity is automatically re-sent to the CDP on
              mount so the profile stays linked.
            </Item>
            <Item type="new">
              Telemetry Simulator remembers the active user ID across refreshes, so you don't
              have to re-enter it when switching between simulator panels.
            </Item>
            <Item type="new">
              Storefront nav shows the logged-in user's email and a Logout button when a session
              is active.
            </Item>
          </Section>
          <Section title="Webhooks">
            <Item type="fix">
              Webhook Subscriptions page signal dropdown was empty — fixed data envelope mismatch
              (<code>res.data</code> vs <code>data.signals</code>) and corrected all field names
              throughout the page to match the API (<code>signalId</code>,{' '}
              <code>subscriptionId</code>, <code>deliveryId</code>, <code>attemptedAt</code>).
            </Item>
          </Section>
        </Release>

        {/* v1.0 */}
        <Release version="1.0" date="May 13, 2026">
          <Section title="Core Platform">
            <Item type="new">
              Initial release of Nexus CDP — a unified Customer Data Platform built around the
              Apex Motors demo story.
            </Item>
            <Item type="new">
              <strong>Profile Explorer</strong> — search unified customer profiles by email, user
              ID, or fingerprint. View all linked identifiers, traits, and full event timeline per
              profile.
            </Item>
            <Item type="new">
              <strong>Live Event Stream</strong> — real-time SSE feed of all incoming events
              across every source app, with event type, profile, and property details.
            </Item>
            <Item type="new">
              <strong>Signal Builder</strong> — define named signals with time windows and
              multi-rule conditions. Pre-seeded with 6 Apex Motors signals including High Purchase
              Intent, Active Driver, and Dealership Walk-In.
            </Item>
            <Item type="new">
              <strong>Signal Stream</strong> — real-time feed of every signal firing, showing
              profile, matched events, and timestamp.
            </Item>
            <Item type="new">
              <strong>Webhook Subscriptions</strong> — register any HTTP endpoint as a subscriber
              to any signal. Deliveries are HMAC-signed and every attempt is logged with status
              code and response body.
            </Item>
          </Section>
          <Section title="Identity Resolution">
            <Item type="new">
              Cross-domain identity resolution using Fingerprint.js Pro — the same visitor is
              recognized across the Storefront and Loyalty Portal even without logging in.
            </Item>
            <Item type="new">
              Profile merging on login — when a user authenticates on either site, their
              fingerprint history and authenticated identity are unified into one profile.
            </Item>
            <Item type="new">
              IoT and POS identity linking — telemetry events with a device ID and dealership
              check-ins with a user ID are automatically linked to the unified profile.
            </Item>
          </Section>
          <Section title="Services">
            <Item type="new">
              Signal Engine worker — evaluates all signal rules against recent events on every
              incoming event, with a 5-minute cooldown to prevent duplicate firings.
            </Item>
            <Item type="new">
              Webhook Dispatcher worker — consumes the Redis signals stream and delivers
              HMAC-signed payloads to all registered subscribers with a 10-second timeout and
              full delivery logging.
            </Item>
            <Item type="new">
              Telemetry Simulator — three-panel simulator for vehicle GPS drives, dealership
              check-ins, and rental events, all wired to the CDP API.
            </Item>
          </Section>
        </Release>

      </div>
    </div>
  );
}

function Release({
  version,
  date,
  label,
  children,
}: {
  version: string;
  date: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pl-6 border-l-2 border-slate-700">
      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-500" />
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-lg font-bold text-slate-100">v{version}</h2>
        {label && (
          <span className="bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
            {label}
          </span>
        )}
        <span className="text-slate-500 text-sm">{date}</span>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function Item({ type, children }: { type: 'new' | 'fix' | 'improved'; children: React.ReactNode }) {
  const badge = {
    new: { label: 'New', cls: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' },
    fix: { label: 'Fix', cls: 'bg-amber-900/40 text-amber-400 border border-amber-800' },
    improved: { label: 'Improved', cls: 'bg-blue-900/40 text-blue-400 border border-blue-800' },
  }[type];

  return (
    <li className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
      <span className={`mt-0.5 flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
        {badge.label}
      </span>
      <span>{children}</span>
    </li>
  );
}
