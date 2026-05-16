const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Nexus CDP — Business Proposal";
pres.author = "Nexus CDP";

// ─── Palette ────────────────────────────────────────────────
const C = {
  navy:    "0F172A",   // slide bg (dark)
  navyMid: "1E293B",   // card bg
  navyLt:  "334155",   // card border / subtle
  indigo:  "6366F1",   // primary accent
  indigoLt:"818CF8",   // lighter indigo
  amber:   "F59E0B",   // warm highlight
  red:     "EF4444",   // problem slides
  green:   "10B981",   // success
  white:   "FFFFFF",
  offWhite:"E2E8F0",
  muted:   "94A3B8",
  bgLight: "F8FAFC",   // light slides (content)
};

const FONT = "Calibri";

// ─── Helpers ────────────────────────────────────────────────
const makeShadow = () => ({
  type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.25,
});

function footerBar(slide, pageNum) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.25, w: 10, h: 0.375,
    fill: { color: C.navyMid }, line: { color: C.navyMid },
  });
  // "N" monogram left
  slide.addText("N", {
    x: 0.25, y: 5.28, w: 0.3, h: 0.28,
    fontFace: FONT, fontSize: 13, bold: true, color: C.indigo, margin: 0,
  });
  // Product name centre
  slide.addText("NEXUS CDP", {
    x: 3.5, y: 5.28, w: 3, h: 0.28,
    fontFace: FONT, fontSize: 9, bold: true, color: C.muted,
    align: "center", charSpacing: 3, margin: 0,
  });
  // Page number right
  slide.addText(String(pageNum), {
    x: 9.5, y: 5.28, w: 0.35, h: 0.28,
    fontFace: FONT, fontSize: 10, color: C.muted, align: "right", margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // Large indigo circle decoration top-right
  s.addShape(pres.shapes.OVAL, {
    x: 6.8, y: -1.2, w: 4.5, h: 4.5,
    fill: { color: C.indigo, transparency: 82 }, line: { color: C.indigo, transparency: 82 },
  });
  s.addShape(pres.shapes.OVAL, {
    x: 7.5, y: -0.5, w: 3, h: 3,
    fill: { color: C.indigo, transparency: 70 }, line: { color: C.indigo, transparency: 70 },
  });

  // Bottom-left accent
  s.addShape(pres.shapes.OVAL, {
    x: -0.8, y: 4.2, w: 2.5, h: 2.5,
    fill: { color: C.indigoLt, transparency: 85 }, line: { color: C.indigoLt, transparency: 85 },
  });

  // Indigo vertical bar left
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 1.3, w: 0.06, h: 2.8,
    fill: { color: C.indigo }, line: { color: C.indigo },
  });

  // Title
  s.addText("NEXUS CDP", {
    x: 0.75, y: 1.3, w: 8, h: 0.95,
    fontFace: FONT, fontSize: 54, bold: true, color: C.white, margin: 0,
  });

  // Subtitle
  s.addText("Know Your Customer, Everywhere", {
    x: 0.75, y: 2.32, w: 7.5, h: 0.6,
    fontFace: FONT, fontSize: 22, bold: false, color: C.indigoLt, margin: 0,
  });

  // Tagline
  s.addText("Unified identity.  ·  Real-time signals.  ·  Moments that matter.", {
    x: 0.75, y: 3.05, w: 8, h: 0.45,
    fontFace: FONT, fontSize: 13, color: C.muted, italic: true, margin: 0,
  });

  // Divider
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.75, y: 2.98, w: 6, h: 0.015,
    fill: { color: C.navyLt }, line: { color: C.navyLt },
  });

  footerBar(s, 1);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 2 — THE PROBLEM
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // Title
  s.addText("Your Customer Is Everywhere.", {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontFace: FONT, fontSize: 30, bold: true, color: C.white, margin: 0,
  });
  s.addText("Your Data Isn't.", {
    x: 0.5, y: 0.88, w: 9, h: 0.5,
    fontFace: FONT, fontSize: 30, bold: true, color: C.red, margin: 0,
  });

  const pains = [
    {
      icon: "⚠",
      head: "Fragmented Identity",
      body: "The same customer appears as 12 different records across your systems, with no way to connect them.",
    },
    {
      icon: "🔗",
      head: "Siloed Data",
      body: "Website events, in-store visits, and IoT telemetry live in separate systems and never talk to each other.",
    },
    {
      icon: "⏱",
      head: "Missed Moments",
      body: "By the time you know a customer is ready, the moment has passed — and the opportunity is gone.",
    },
  ];

  pains.forEach((p, i) => {
    const x = 0.4 + i * 3.1;
    // Card bg
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.65, w: 2.9, h: 3.3,
      fill: { color: C.navyMid }, line: { color: "991B1B", width: 1.5 },
      shadow: makeShadow(),
    });
    // Icon circle
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.15, y: 1.75, w: 0.65, h: 0.65,
      fill: { color: "7F1D1D" }, line: { color: "7F1D1D" },
    });
    s.addText(p.icon, {
      x: x + 0.15, y: 1.75, w: 0.65, h: 0.65,
      fontFace: FONT, fontSize: 18, align: "center", valign: "middle", margin: 0,
    });
    // Heading
    s.addText(p.head, {
      x: x + 0.15, y: 2.5, w: 2.6, h: 0.45,
      fontFace: FONT, fontSize: 15, bold: true, color: C.white, margin: 0,
    });
    // Body
    s.addText(p.body, {
      x: x + 0.15, y: 3.0, w: 2.6, h: 1.7,
      fontFace: FONT, fontSize: 12, color: C.offWhite, margin: 0,
    });
  });

  footerBar(s, 2);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 3 — THE VISION
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };

  s.addText("One Customer. One Profile. Every Touchpoint.", {
    x: 0.5, y: 0.35, w: 9, h: 0.6,
    fontFace: FONT, fontSize: 28, bold: true, color: C.navy, margin: 0,
  });
  s.addText("Nexus CDP unifies identity, behavior, and signals across every channel — digital, physical, and connected.", {
    x: 0.5, y: 0.98, w: 9, h: 0.45,
    fontFace: FONT, fontSize: 13, color: C.muted, margin: 0,
  });

  const cols = [
    { icon: "🌐", title: "Any Source", sub: "Web · Mobile · IoT · POS · APIs · Physical sensors", col: C.indigo },
    { icon: "👤", title: "One Profile", sub: "Unified identity resolving fingerprints, user IDs, and device IDs into a single view", col: C.amber },
    { icon: "⚡", title: "Real-Time Signals", sub: "Named moments that matter — not raw data, but actionable customer signals", col: C.green },
  ];

  cols.forEach((c, i) => {
    const x = 0.4 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.65, w: 2.9, h: 3.3,
      fill: { color: C.white }, line: { color: "E2E8F0", width: 1 },
      shadow: makeShadow(),
    });
    // Top accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.65, w: 2.9, h: 0.12,
      fill: { color: c.col }, line: { color: c.col },
    });
    // Icon circle
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.1, y: 1.95, w: 0.7, h: 0.7,
      fill: { color: c.col, transparency: 85 }, line: { color: c.col, transparency: 85 },
    });
    s.addText(c.icon, {
      x: x + 1.1, y: 1.95, w: 0.7, h: 0.7,
      fontSize: 22, align: "center", valign: "middle", margin: 0,
    });
    s.addText(c.title, {
      x: x + 0.15, y: 2.75, w: 2.6, h: 0.45,
      fontFace: FONT, fontSize: 16, bold: true, color: C.navy, align: "center", margin: 0,
    });
    s.addText(c.sub, {
      x: x + 0.15, y: 3.25, w: 2.6, h: 1.5,
      fontFace: FONT, fontSize: 11.5, color: "475569", align: "center", margin: 0,
    });
  });

  footerBar(s, 3);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 4 — HOW IT WORKS
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addText("A Platform Built for the Connected Era", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontFace: FONT, fontSize: 26, bold: true, color: C.white, margin: 0,
  });

  const nodes = [
    { label: "DATA\nSOURCES",  sub: "Web, mobile,\nIoT, POS, APIs", col: C.indigoLt },
    { label: "CDP API",        sub: "Event ingestion\n+ identity resolve", col: C.indigo },
    { label: "UNIFIED\nPROFILES", sub: "Single view of\neach customer", col: C.amber },
    { label: "SIGNAL\nENGINE", sub: "Rule-based\nmoment detection", col: C.green },
    { label: "OPERATIONALI-\nZATION", sub: "Streams &\nwebhooks", col: "EC4899" },
  ];

  const boxW = 1.55, boxH = 1.3, startX = 0.3, y = 1.65, gap = 0.38;

  nodes.forEach((n, i) => {
    const x = startX + i * (boxW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: boxW, h: boxH,
      fill: { color: C.navyMid }, line: { color: n.col, width: 2 },
      shadow: makeShadow(),
    });
    // Top accent
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: boxW, h: 0.1,
      fill: { color: n.col }, line: { color: n.col },
    });
    s.addText(n.label, {
      x: x + 0.05, y: y + 0.15, w: boxW - 0.1, h: 0.65,
      fontFace: FONT, fontSize: 11, bold: true, color: n.col,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(n.sub, {
      x: x + 0.05, y: y + 0.82, w: boxW - 0.1, h: 0.6,
      fontFace: FONT, fontSize: 9, color: C.offWhite, align: "center", margin: 0,
    });

    // Arrow between nodes
    if (i < nodes.length - 1) {
      const arrowX = x + boxW;
      s.addShape(pres.shapes.LINE, {
        x: arrowX + 0.04, y: y + boxH / 2, w: gap - 0.08, h: 0,
        line: { color: C.navyLt, width: 1.5, endArrowType: "arrow" },
      });
    }
  });

  // Description row
  s.addText([
    { text: "Every event from any source — browser, vehicle, dealership, rental desk — flows into the CDP API.\n", options: { breakLine: true } },
    { text: "Identity resolution links them to a single profile. The signal engine detects meaningful moments.\n", options: { breakLine: true } },
    { text: "Downstream consumers receive signals in real time via SSE streams or HMAC-signed webhooks.", options: {} },
  ], {
    x: 0.5, y: 3.2, w: 9, h: 1.8,
    fontFace: FONT, fontSize: 13, color: C.offWhite, margin: 0,
  });

  footerBar(s, 4);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 5 — CROSS-DOMAIN IDENTITY
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };

  s.addText("The Same Person, Recognized Everywhere", {
    x: 0.5, y: 0.3, w: 9, h: 0.55,
    fontFace: FONT, fontSize: 26, bold: true, color: C.navy, margin: 0,
  });
  s.addText("Demo story: Apex Motors — a premium automotive brand", {
    x: 0.5, y: 0.88, w: 9, h: 0.35,
    fontFace: FONT, fontSize: 13, color: C.muted, italic: true, margin: 0,
  });

  const steps = [
    { icon: "💻", label: "Storefront Visit", detail: "Browse apexmotors.com\nFP.js fingerprint captured", id: "Fingerprint" },
    { icon: "⭐", label: "Loyalty Login", detail: "Login to apexrewards.com\nuserId linked — profiles merged", id: "userId" },
    { icon: "🚗", label: "Connected Vehicle", detail: "GPS telemetry via API\ndeviceId linked to profile", id: "deviceId" },
    { icon: "🏪", label: "Dealership Visit", detail: "Physical check-in via POS\nprofile updated in real time", id: "POS" },
  ];

  const stepW = 1.9, stepH = 1.9, startX = 0.5, stepY = 1.45;
  const arrowGap = 0.4;

  steps.forEach((step, i) => {
    const x = startX + i * (stepW + arrowGap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: stepY, w: stepW, h: stepH,
      fill: { color: C.white }, line: { color: C.indigo, width: 1.5 },
      shadow: makeShadow(),
    });
    // Number circle
    s.addShape(pres.shapes.OVAL, {
      x: x + stepW / 2 - 0.2, y: stepY - 0.28, w: 0.4, h: 0.4,
      fill: { color: C.indigo }, line: { color: C.indigo },
    });
    s.addText(String(i + 1), {
      x: x + stepW / 2 - 0.2, y: stepY - 0.28, w: 0.4, h: 0.4,
      fontFace: FONT, fontSize: 12, bold: true, color: C.white,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(step.icon, {
      x, y: stepY + 0.15, w: stepW, h: 0.5,
      fontSize: 24, align: "center", valign: "middle", margin: 0,
    });
    s.addText(step.label, {
      x: x + 0.08, y: stepY + 0.72, w: stepW - 0.16, h: 0.38,
      fontFace: FONT, fontSize: 12, bold: true, color: C.navy, align: "center", margin: 0,
    });
    s.addText(step.detail, {
      x: x + 0.08, y: stepY + 1.1, w: stepW - 0.16, h: 0.7,
      fontFace: FONT, fontSize: 9.5, color: "475569", align: "center", margin: 0,
    });
    // ID badge
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: stepY + stepH - 0.32, w: stepW - 0.4, h: 0.26,
      fill: { color: C.indigo, transparency: 88 }, line: { color: C.indigoLt },
    });
    s.addText(step.id, {
      x: x + 0.2, y: stepY + stepH - 0.32, w: stepW - 0.4, h: 0.26,
      fontFace: FONT, fontSize: 8.5, bold: true, color: C.indigo, align: "center", margin: 0,
    });
    // Arrow
    if (i < steps.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: x + stepW + 0.05, y: stepY + stepH / 2, w: arrowGap - 0.1, h: 0,
        line: { color: C.navyLt, width: 1.5, endArrowType: "arrow" },
      });
    }
  });

  // Bottom banner
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.65, w: 9, h: 0.55,
    fill: { color: C.indigo, transparency: 90 }, line: { color: C.indigo },
  });
  s.addText("All four touchpoints  →  ONE unified profile in Nexus CDP", {
    x: 0.5, y: 3.65, w: 9, h: 0.55,
    fontFace: FONT, fontSize: 14, bold: true, color: C.indigo, align: "center", valign: "middle", margin: 0,
  });

  footerBar(s, 5);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 6 — THE EVENT MODEL
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addText("A Single, Flexible Event Structure for Everything", {
    x: 0.5, y: 0.3, w: 9, h: 0.5,
    fontFace: FONT, fontSize: 24, bold: true, color: C.white, margin: 0,
  });
  s.addText("No rigid schemas. Any event from any source, normalized into one format.", {
    x: 0.5, y: 0.82, w: 9, h: 0.35,
    fontFace: FONT, fontSize: 13, color: C.muted, italic: true, margin: 0,
  });

  // Left: code block
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.3, w: 5.2, h: 3.7,
    fill: { color: "0D1117" }, line: { color: C.navyLt },
    shadow: makeShadow(),
  });
  const codeLines = [
    { text: "{", options: { color: C.offWhite } },
    { text: '  "eventId":    ', options: { color: "94A3B8" } },
    { text: '"uuid-v4",\n', options: { color: "A3E635", breakLine: true } },
    { text: '  "fingerprint": ', options: { color: "94A3B8" } },
    { text: '"fp_abc123...",\n', options: { color: "A3E635", breakLine: true } },
    { text: '  "userId":     ', options: { color: "94A3B8" } },
    { text: '"user_xyz",\n', options: { color: "A3E635", breakLine: true } },
    { text: '  "deviceId":   ', options: { color: "94A3B8" } },
    { text: '"VIN-NOVA-005",\n', options: { color: "A3E635", breakLine: true } },
    { text: '  "source":     ', options: { color: "94A3B8" } },
    { text: '"web | iot | pos",\n', options: { color: C.amber, breakLine: true } },
    { text: '  "sourceApp":  ', options: { color: "94A3B8" } },
    { text: '"storefront",\n', options: { color: "A3E635", breakLine: true } },
    { text: '  "type":       ', options: { color: "94A3B8" } },
    { text: '"vehicle_view",\n', options: { color: C.indigoLt, breakLine: true } },
    { text: '  "properties": ', options: { color: "94A3B8" } },
    { text: '{ vin, model, price },\n', options: { color: C.offWhite, breakLine: true } },
    { text: '  "context":    ', options: { color: "94A3B8" } },
    { text: '{ device, location, session }', options: { color: C.offWhite } },
    { text: "\n}", options: { color: C.offWhite, breakLine: true } },
  ];
  s.addText(codeLines, {
    x: 0.6, y: 1.45, w: 4.8, h: 3.4,
    fontFace: "Consolas", fontSize: 10.5, margin: 0,
  });

  // Right: example event types
  s.addText("Example Event Types", {
    x: 5.85, y: 1.3, w: 3.8, h: 0.4,
    fontFace: FONT, fontSize: 14, bold: true, color: C.indigoLt, margin: 0,
  });

  const types = [
    { t: "vehicle_view",         src: "web",    col: "3B82F6" },
    { t: "location_update",      src: "iot",    col: "10B981" },
    { t: "store_checkin",        src: "pos",    col: "F59E0B" },
    { t: "rental_ended",         src: "api",    col: "94A3B8" },
    { t: "points_balance_updated", src: "web",  col: "3B82F6" },
    { t: "service_scheduled",    src: "web",    col: "3B82F6" },
    { t: "reward_redeemed",      src: "web",    col: "3B82F6" },
    { t: "ignition_on",          src: "iot",    col: "10B981" },
  ];

  types.forEach((t, i) => {
    const y = 1.85 + i * 0.36;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.85, y, w: 3.8, h: 0.3,
      fill: { color: C.navyMid }, line: { color: C.navyLt },
    });
    s.addShape(pres.shapes.OVAL, {
      x: 5.92, y: y + 0.06, w: 0.18, h: 0.18,
      fill: { color: t.col }, line: { color: t.col },
    });
    s.addText(t.t, {
      x: 6.18, y, w: 2.4, h: 0.3,
      fontFace: "Consolas", fontSize: 9.5, color: C.offWhite, valign: "middle", margin: 0,
    });
    s.addText(`[${t.src}]`, {
      x: 8.6, y, w: 1, h: 0.3,
      fontFace: "Consolas", fontSize: 8.5, color: C.muted, align: "right", valign: "middle", margin: 0,
    });
  });

  s.addText("If it happened, it can be an event.", {
    x: 5.85, y: 4.85, w: 3.8, h: 0.35,
    fontFace: FONT, fontSize: 12, italic: true, bold: true, color: C.amber, margin: 0,
  });

  footerBar(s, 6);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 7 — SIGNALS
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };

  s.addText("Don't Just Collect Data — Detect Moments", {
    x: 0.5, y: 0.28, w: 9, h: 0.52,
    fontFace: FONT, fontSize: 25, bold: true, color: C.navy, margin: 0,
  });
  s.addText("Signals fire when a customer reaches a meaningful moment — not just a sales trigger.", {
    x: 0.5, y: 0.82, w: 9, h: 0.35,
    fontFace: FONT, fontSize: 12.5, color: C.muted, italic: true, margin: 0,
  });

  // Table header
  const cols = [2.8, 3.4, 2.8]; // widths
  const headers = ["Signal Name", "Trigger", "Opportunity"];
  const xs = [0.4, 3.2, 6.6];
  const hdrY = 1.3;

  headers.forEach((h, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: xs[i], y: hdrY, w: cols[i], h: 0.38,
      fill: { color: C.navy }, line: { color: C.navy },
    });
    s.addText(h, {
      x: xs[i] + 0.1, y: hdrY, w: cols[i] - 0.1, h: 0.38,
      fontFace: FONT, fontSize: 11, bold: true, color: C.white, valign: "middle", margin: 0,
    });
  });

  const rows = [
    ["High Purchase Intent", "3+ vehicle views + price check in 7 days", "Outreach from a sales advisor"],
    ["Loyalty Milestone Approaching", "Within 500 pts of next tier", "Personalized nudge to earn more"],
    ["Active Driver", "10+ location updates in 24 hours", "In-drive safety or convenience offer"],
    ["Recent Renter Browsing", "Rental ended + viewing vehicles", "Trade-in or purchase conversation"],
    ["Dealership Walk-In", "Physical store check-in", "Activate in-store associate alert"],
    ["Lapsed High-Value Customer", "2+ purchases + 90 days silent", "Win-back campaign trigger"],
  ];

  rows.forEach((row, ri) => {
    const rowY = hdrY + 0.38 + ri * 0.48;
    const bg = ri % 2 === 0 ? C.white : "F1F5F9";
    row.forEach((cell, ci) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: xs[ci], y: rowY, w: cols[ci], h: 0.48,
        fill: { color: bg }, line: { color: "E2E8F0" },
      });
      s.addText(cell, {
        x: xs[ci] + 0.1, y: rowY, w: cols[ci] - 0.1, h: 0.48,
        fontFace: FONT, fontSize: 10, color: ci === 0 ? C.navy : "475569",
        bold: ci === 0, valign: "middle", margin: 0,
      });
    });
  });

  s.addText("Signals are defined by your team, for your moments.", {
    x: 0.4, y: 4.45, w: 9.2, h: 0.4,
    fontFace: FONT, fontSize: 11.5, italic: true, color: C.indigo, align: "center", margin: 0,
  });

  footerBar(s, 7);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 8 — OPERATIONALIZATION
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addText("Signals Become Action, In Real Time", {
    x: 0.5, y: 0.3, w: 9, h: 0.52,
    fontFace: FONT, fontSize: 26, bold: true, color: C.white, margin: 0,
  });

  // Left card: SSE Streams
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.05, w: 4.3, h: 3.0,
    fill: { color: C.navyMid }, line: { color: "3B82F6", width: 1.5 },
    shadow: makeShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.05, w: 4.3, h: 0.1,
    fill: { color: "3B82F6" }, line: { color: "3B82F6" },
  });
  s.addText("SSE Streams  (Pull)", {
    x: 0.6, y: 1.2, w: 4.0, h: 0.42,
    fontFace: FONT, fontSize: 16, bold: true, color: C.white, margin: 0,
  });
  s.addText("Any application connects to a live event stream over HTTP — no polling, no message broker required.", {
    x: 0.6, y: 1.65, w: 3.9, h: 0.72,
    fontFace: FONT, fontSize: 11, color: C.offWhite, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.55, y: 2.45, w: 3.95, h: 0.72,
    fill: { color: "0D1117" }, line: { color: C.navyLt },
  });
  s.addText("const es = new EventSource(\n  '/signals/stream/all'\n);\nes.onmessage = (e) => {};", {
    x: 0.65, y: 2.5, w: 3.75, h: 0.6,
    fontFace: "Consolas", fontSize: 9, color: "A3E635", margin: 0,
  });
  s.addText("GET /events/stream  ·  GET /signals/stream/all  ·  GET /signals/:id/stream", {
    x: 0.6, y: 3.3, w: 3.9, h: 0.55,
    fontFace: "Consolas", fontSize: 8.5, color: C.muted, margin: 0,
  });

  // Right card: Webhooks
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.05, w: 4.3, h: 3.0,
    fill: { color: C.navyMid }, line: { color: C.indigo, width: 1.5 },
    shadow: makeShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.05, w: 4.3, h: 0.1,
    fill: { color: C.indigo }, line: { color: C.indigo },
  });
  s.addText("Webhooks  (Push)", {
    x: 5.4, y: 1.2, w: 3.9, h: 0.42,
    fontFace: FONT, fontSize: 16, bold: true, color: C.white, margin: 0,
  });
  s.addText("Subscribe any URL to any signal. Each delivery is HMAC-SHA256 signed for secure verification.", {
    x: 5.4, y: 1.65, w: 3.9, h: 0.72,
    fontFace: FONT, fontSize: 11, color: C.offWhite, margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.35, y: 2.45, w: 3.95, h: 0.72,
    fill: { color: "0D1117" }, line: { color: C.navyLt },
  });
  s.addText('POST /subscriptions\n{\n  "signalId": "...",\n  "targetUrl": "https://..."\n}', {
    x: 5.45, y: 2.5, w: 3.75, h: 0.6,
    fontFace: "Consolas", fontSize: 9, color: C.indigoLt, margin: 0,
  });
  s.addText("X-Nexus-Signature: sha256=...   ·   X-Nexus-Firing-Id", {
    x: 5.4, y: 3.3, w: 3.9, h: 0.55,
    fontFace: "Consolas", fontSize: 8.5, color: C.muted, margin: 0,
  });

  // Bottom note
  s.addText("Who can subscribe?  CRM systems · Marketing platforms · In-store associate apps · Mobile push services · Data warehouses — anything with an HTTP endpoint.", {
    x: 0.4, y: 4.3, w: 9.2, h: 0.6,
    fontFace: FONT, fontSize: 12, color: C.offWhite, italic: true, margin: 0,
  });

  footerBar(s, 8);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 9 — THE DEMO
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };

  s.addText("See It Live: The Apex Motors Story", {
    x: 0.5, y: 0.28, w: 9, h: 0.52,
    fontFace: FONT, fontSize: 26, bold: true, color: C.navy, margin: 0,
  });

  const sites = [
    { label: "A", name: "Apex Motors Storefront", port: "3001", icon: "🏎️", desc: "Browse vehicles, schedule service, track purchase intent signals in real time", col: C.indigo },
    { label: "B", name: "Apex Rewards Portal", port: "3002", icon: "⭐", desc: "Loyalty dashboard with live cross-domain identity merge demonstration", col: C.amber },
    { label: "C", name: "Telemetry Simulator", port: "3003", icon: "📡", desc: "Simulate car GPS, dealership visits, and rental events firing into the CDP", col: C.green },
    { label: "D", name: "Nexus CDP Platform", port: "3004", icon: "🖥️", desc: "Live profile explorer, event stream, signal builder, and webhook manager", col: "8B5CF6" },
  ];

  const positions = [
    { x: 0.4, y: 1.1 },
    { x: 5.1, y: 1.1 },
    { x: 0.4, y: 3.05 },
    { x: 5.1, y: 3.05 },
  ];

  sites.forEach((site, i) => {
    const { x, y } = positions[i];
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.5, h: 1.75,
      fill: { color: C.white }, line: { color: site.col, width: 1.5 },
      shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.5, h: 0.1,
      fill: { color: site.col }, line: { color: site.col },
    });
    // Site badge
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.15, y: y + 0.2, w: 0.42, h: 0.42,
      fill: { color: site.col }, line: { color: site.col },
    });
    s.addText(`Site ${site.label}`, {
      x: x + 0.15, y: y + 0.2, w: 0.42, h: 0.42,
      fontFace: FONT, fontSize: 7.5, bold: true, color: C.white,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(`${site.icon}  ${site.name}`, {
      x: x + 0.65, y: y + 0.2, w: 3.7, h: 0.42,
      fontFace: FONT, fontSize: 13, bold: true, color: C.navy, valign: "middle", margin: 0,
    });
    s.addText(`localhost:${site.port}`, {
      x: x + 0.65, y: y + 0.62, w: 3.7, h: 0.28,
      fontFace: "Consolas", fontSize: 9.5, color: site.col, margin: 0,
    });
    s.addText(site.desc, {
      x: x + 0.15, y: y + 0.95, w: 4.2, h: 0.65,
      fontFace: FONT, fontSize: 10.5, color: "475569", margin: 0,
    });
  });

  s.addText("All four sites share one CDP.  Watch the same customer recognized across every touchpoint.", {
    x: 0.4, y: 4.98, w: 9.2, h: 0.35,
    fontFace: FONT, fontSize: 12, italic: true, color: C.indigo, align: "center", margin: 0,
  });

  footerBar(s, 9);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 10 — USE CASES
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  s.addText("Built for Any Connected Brand", {
    x: 0.5, y: 0.3, w: 9, h: 0.52,
    fontFace: FONT, fontSize: 26, bold: true, color: C.white, margin: 0,
  });

  const industries = [
    { icon: "🚗", name: "Automotive", items: ["Connected vehicle telemetry", "Dealership visit signals", "Service history & scheduling", "Rental behavior profiling"] },
    { icon: "🏪", name: "Retail", items: ["In-store beacon events", "E-commerce behavior", "Loyalty program signals", "Physical + digital journey"] },
    { icon: "🏦", name: "Financial Services", items: ["Mobile app interactions", "Branch visit events", "ATM & advisor touchpoints", "Cross-channel profile merge"] },
    { icon: "🏥", name: "Healthcare", items: ["Patient portal activity", "Clinic & lab visit events", "Wearable device telemetry", "Pharmacy engagement"] },
  ];

  industries.forEach((ind, i) => {
    const x = 0.4 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 2.18, h: 3.8,
      fill: { color: C.navyMid }, line: { color: C.navyLt },
      shadow: makeShadow(),
    });
    s.addText(ind.icon, {
      x, y: 1.2, w: 2.18, h: 0.6,
      fontSize: 28, align: "center", margin: 0,
    });
    s.addText(ind.name, {
      x: x + 0.1, y: 1.85, w: 1.98, h: 0.45,
      fontFace: FONT, fontSize: 13, bold: true, color: C.white, align: "center", margin: 0,
    });
    s.addText(ind.items.map(item => item).join("\n"), {
      x: x + 0.12, y: 2.35, w: 1.95, h: 2.3,
      fontFace: FONT, fontSize: 10, color: C.offWhite, margin: 0,
    });
  });

  s.addText("The event model is generic.  The signals are yours to define.", {
    x: 0.4, y: 5.1, w: 9.2, h: 0.35,
    fontFace: FONT, fontSize: 13, bold: true, color: C.amber, align: "center", margin: 0,
  });

  footerBar(s, 10);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 11 — WHY NEXUS CDP
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bgLight };

  s.addText("The Platform Advantage", {
    x: 0.5, y: 0.3, w: 9, h: 0.52,
    fontFace: FONT, fontSize: 28, bold: true, color: C.navy, margin: 0,
  });

  const diff = [
    { icon: "🔒", title: "Privacy-First Identity", body: "Fingerprint.js Pro delivers accurate cross-domain recognition without relying on third-party cookies — future-proof and privacy-compliant.", col: C.indigo },
    { icon: "⚡", title: "Signal Over Noise", body: "Move beyond raw data collection. Define what moments matter to your customers and act on them — not just data points, but real opportunities.", col: C.amber },
    { icon: "🔓", title: "Open Operationalization", body: "Any application can subscribe to signals via open standards — SSE streams and HMAC-signed webhooks. No proprietary connectors. No vendor lock-in.", col: C.green },
  ];

  diff.forEach((d, i) => {
    const y = 1.2 + i * 1.3;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 9, h: 1.15,
      fill: { color: C.white }, line: { color: "E2E8F0" },
      shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.12, h: 1.15,
      fill: { color: d.col }, line: { color: d.col },
    });
    s.addText(d.icon, {
      x: 0.75, y, w: 0.7, h: 1.15,
      fontSize: 28, align: "center", valign: "middle", margin: 0,
    });
    s.addText(d.title, {
      x: 1.55, y: y + 0.1, w: 7.7, h: 0.4,
      fontFace: FONT, fontSize: 16, bold: true, color: C.navy, margin: 0,
    });
    s.addText(d.body, {
      x: 1.55, y: y + 0.5, w: 7.7, h: 0.58,
      fontFace: FONT, fontSize: 12, color: "475569", margin: 0,
    });
  });

  footerBar(s, 11);
}

// ═══════════════════════════════════════════════════════════════
// SLIDE 12 — NEXT STEPS
// ═══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.navy };

  // Decorative circles
  s.addShape(pres.shapes.OVAL, {
    x: 7.5, y: -0.5, w: 4, h: 4,
    fill: { color: C.indigo, transparency: 88 }, line: { color: C.indigo, transparency: 88 },
  });
  s.addShape(pres.shapes.OVAL, {
    x: -1, y: 4, w: 3.5, h: 3.5,
    fill: { color: C.indigoLt, transparency: 88 }, line: { color: C.indigoLt, transparency: 88 },
  });

  s.addText("Ready to Know Your Customer?", {
    x: 0.6, y: 0.35, w: 8.5, h: 0.6,
    fontFace: FONT, fontSize: 28, bold: true, color: C.white, margin: 0,
  });

  const steps = [
    { num: "1", title: "Run the Demo", body: "docker compose up && pnpm dev\n— all four sites live in minutes" },
    { num: "2", title: "Define Your Signals", body: "Use the Signal Builder to create the\n5 moments that matter most to your customers" },
    { num: "3", title: "Connect a Subscriber", body: "Register your first webhook — CRM, push\nnotification, data warehouse, or in-store app" },
  ];

  steps.forEach((step, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.95, h: 2.8,
      fill: { color: C.navyMid }, line: { color: C.indigo, width: 1 },
      shadow: makeShadow(),
    });
    // Number circle
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.1, y: 1.3, w: 0.75, h: 0.75,
      fill: { color: C.indigo }, line: { color: C.indigo },
    });
    s.addText(step.num, {
      x: x + 1.1, y: 1.3, w: 0.75, h: 0.75,
      fontFace: FONT, fontSize: 22, bold: true, color: C.white,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(step.title, {
      x: x + 0.15, y: 2.18, w: 2.65, h: 0.45,
      fontFace: FONT, fontSize: 14, bold: true, color: C.indigoLt, align: "center", margin: 0,
    });
    s.addText(step.body, {
      x: x + 0.15, y: 2.65, w: 2.65, h: 1.2,
      fontFace: FONT, fontSize: 11, color: C.offWhite, align: "center", margin: 0,
    });
  });

  // CTA bottom
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 4.25, w: 9, h: 0.72,
    fill: { color: C.indigo }, line: { color: C.indigo },
  });
  s.addText("Nexus CDP  ·  One Profile. Every Moment. Real Action.", {
    x: 0.5, y: 4.25, w: 9, h: 0.72,
    fontFace: FONT, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle", margin: 0,
  });

  footerBar(s, 12);
}

// ─── Write file ──────────────────────────────────────────────
pres.writeFile({ fileName: "/Users/kameelyan/Claude/nexus-cdp/docs/business-proposal.pptx" })
  .then(() => console.log("✅  business-proposal.pptx written"))
  .catch((err) => { console.error("❌ ", err); process.exit(1); });
