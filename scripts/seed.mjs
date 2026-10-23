// Loads sample machines into a local PocketBase for development.
// Usage: PB_EMAIL=... PB_PASSWORD=... node scripts/seed.mjs
// Skips anything that already exists, so it is safe to re-run. Do not run against production.

const PB_URL = process.env.PB_URL ?? "http://127.0.0.1:8090";
const { PB_EMAIL, PB_PASSWORD } = process.env;

if (!PB_EMAIL || !PB_PASSWORD) {
  console.error("Set PB_EMAIL and PB_PASSWORD to a local superuser's credentials.");
  process.exit(1);
}

let token = "";

async function api(method, path, body) {
  const res = await fetch(`${PB_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} failed: ${JSON.stringify(data)}`);
  return data;
}

async function findOrCreate(collection, filter, record) {
  const existing = await api(
    "GET",
    `/api/collections/${collection}/records?perPage=1&filter=${encodeURIComponent(filter)}`
  );
  if (existing.items.length) return existing.items[0];
  return api("POST", `/api/collections/${collection}/records`, record);
}

({ token } = await api("POST", "/api/collections/_superusers/auth-with-password", {
  identity: PB_EMAIL,
  password: PB_PASSWORD,
}));

const woodSteward = await findOrCreate("contacts", `name = "Wood Shop Steward"`, {
  name: "Wood Shop Steward",
  role: "Wood shop area lead",
  contact_method: "#woodshop channel on Discord",
  contact_link: "https://discord.com/",
});
const fabSteward = await findOrCreate("contacts", `name = "Digital Fab Steward"`, {
  name: "Digital Fab Steward",
  role: "Laser & 3D printing area lead",
  contact_method: "#digital-fab channel on Discord",
  contact_link: "https://discord.com/",
});

const machines = [
  {
    code: "TS01",
    name: "Cabinet Table Saw",
    make: "SawStop",
    model: "PCS31230",
    category: "Saws",
    area: "Wood Shop",
    summary: "10\" cabinet saw with flesh-sensing blade brake. Sample entry for development.",
    training_required: true,
    safety:
      "<ul><li>Safety glasses and hearing protection required.</li><li>Always use the riving knife or blade guard for through-cuts.</li><li>Never reach over the blade. Use a push stick for rips narrower than 6\".</li></ul>",
    quick_start:
      "<ol><li>Check the blade is clean and the brake cartridge matches the blade (standard vs. dado).</li><li>Set blade height about 1/4\" above the stock.</li><li>Turn on dust collection, then pull the paddle switch.</li><li>Feed steadily; stop with the paddle when the cut is complete.</li></ol>",
    specs: "<p>Blade: 10\" diameter, 5/8\" arbor. Motor: 3 HP, 230 V single phase.</p>",
    contacts: [woodSteward.id],
    troubleshooting: [
      {
        symptom: "Saw won't start and the status light is flashing",
        likely_cause: "The safety system is in bypass, has an error, or the brake cartridge is not seated.",
        fix: "<p>Check the status light pattern against the code chart on the side of the saw. Reseat the brake cartridge. If it still won't start, tag the saw out and message the steward.</p>",
      },
      {
        symptom: "The brake fired",
        likely_cause: "Blade contacted something conductive: skin, wet wood, foil, or a metal fence or jig.",
        fix: "<p>Do not try to reset it yourself. Tag the saw out and contact the steward. A new cartridge and blade must be installed.</p>",
      },
      {
        symptom: "Burning or the board binds during a rip",
        likely_cause: "Fence out of parallel, dull blade, or internal stress in the board.",
        fix: "<p>Make sure the riving knife is installed. Feed slower. If it keeps happening, report the blade as dull.</p>",
      },
    ],
    consumables: [
      { name: "10\" combination blade", spec: "10\" diameter, 40T, 5/8\" arbor", storage_location: "Blade cabinet, Wood Shop" },
      { name: "Standard brake cartridge", spec: "For 10\" blades", part_number: "TSBC-10R3", storage_location: "Steward's locked cabinet" },
    ],
  },
  {
    code: "BS01",
    status: "repair_in_progress",
    name: "14\" Bandsaw",
    category: "Saws",
    area: "Wood Shop",
    summary: "Curved cuts and resawing. Sample entry for development.",
    safety: "<ul><li>Lower the upper guide to about 1/4\" above the workpiece.</li><li>Keep fingers out of the blade's path.</li></ul>",
    quick_start: "<ol><li>Check blade tension.</li><li>Set the upper guide height.</li><li>Start the saw and let it reach speed before cutting.</li></ol>",
    contacts: [woodSteward.id],
    troubleshooting: [
      {
        symptom: "Blade wanders or drifts off the line",
        likely_cause: "Low blade tension or a dull blade.",
        fix: "<p>Check tension. If the blade is dull, swap it for a spare and tell the steward.</p>",
      },
    ],
    consumables: [{ name: "Bandsaw blade", spec: "93-1/2\" length, 1/2\" width, 3 TPI", storage_location: "Blade cabinet, Wood Shop" }],
  },
  {
    code: "LZ01",
    name: "CO2 Laser Cutter",
    category: "Digital Fabrication",
    area: "Digital Fab Lab",
    summary: "Cuts and engraves wood, acrylic, paper and leather. Sample entry for development.",
    training_required: true,
    safety:
      "<ul><li><strong>Never leave the laser running unattended.</strong></li><li>Never cut PVC, vinyl, or anything containing chlorine.</li><li>Exhaust fan and air assist must be on.</li></ul>",
    quick_start:
      "<ol><li>Turn on the exhaust, chiller and air assist.</li><li>Power on the laser and wait for homing.</li><li>Focus on the material.</li><li>Send the job from the lab computer and stay with it until it finishes.</li></ol>",
    contacts: [fabSteward.id],
    troubleshooting: [
      {
        symptom: "Laser isn't cutting all the way through",
        likely_cause: "Wrong focus height, dirty lens or mirrors, or settings too fast.",
        fix: "<p>Re-focus first. Try a slower speed on a scrap. Do not clean optics yourself; report it to the steward.</p>",
      },
      {
        symptom: "Flames that don't go out right away",
        likely_cause: "Air assist is off or the power is too high.",
        fix: "<p>Pause the job and open the lid. Use the fire extinguisher by the door if needed. Report every fire to the steward.</p>",
      },
    ],
    consumables: [],
  },
  {
    code: "PR01",
    status: "out_of_service",
    name: "FDM 3D Printer",
    category: "Digital Fabrication",
    area: "Digital Fab Lab",
    summary: "Fused filament printer for PLA and PETG. Sample entry for development.",
    quick_start: "<ol><li>Slice your model with the lab profile.</li><li>Load filament.</li><li>Watch the first layer before walking away.</li></ol>",
    contacts: [fabSteward.id],
    troubleshooting: [
      {
        symptom: "Print won't stick to the bed",
        likely_cause: "Dirty build plate or wrong first-layer height.",
        fix: "<p>Clean the plate with isopropyl alcohol and retry.</p>",
      },
    ],
    consumables: [{ name: "PLA filament", spec: "1.75 mm, 1 kg spools", storage_location: "Filament shelf, Digital Fab Lab" }],
  },
  {
    code: "DP01",
    name: "Floor Drill Press",
    category: "Drills",
    area: "Metal Shop",
    summary: "Accurate vertical drilling in wood and metal. Sample entry for development.",
    safety: "<ul><li>Clamp the workpiece. Never hold metal by hand.</li><li>Remove the chuck key before starting.</li></ul>",
    quick_start: "<ol><li>Set the speed for your material and bit size (chart on the machine).</li><li>Clamp the work.</li><li>Drill with steady pressure, clearing chips often.</li></ol>",
    contacts: [woodSteward.id],
    troubleshooting: [],
    consumables: [],
  },
];

for (const { troubleshooting, consumables, ...data } of machines) {
  const machine = await findOrCreate("machines", `code = "${data.code}"`, { status: "working", ...data });
  for (const [i, item] of troubleshooting.entries()) {
    await findOrCreate(
      "troubleshooting",
      `machine = "${machine.id}" && symptom = ${JSON.stringify(item.symptom)}`,
      { ...item, machine: machine.id, sort: i }
    );
  }
  for (const item of consumables) {
    await findOrCreate("consumables", `name = ${JSON.stringify(item.name)}`, { ...item, machines: [machine.id] });
  }
  console.log(`Seeded ${machine.code} ${machine.name}`);
}
