import Module from '../models/Module.js';
import Roadmap from '../models/Roadmap.js';
import RoadmapWeek from '../models/RoadmapWeek.js';
import RoadmapDay from '../models/RoadmapDay.js';

// Extracted directly from the uploaded PDF (LLD_Interview_Roadmap_JPMorgan.pdf,
// verified via pdftotext against this transcription, not assumed accurate).
// The PDF's own header calls this "42 study days," but its day-by-day table
// has 5 explicit rest days (7, 14, 21, 28, 35) — so the real study-day count
// is 37. "42" describes the whole 6-week span; it is never used as a
// progress denominator anywhere in this app (see roadmapService.js).
const ROADMAP_SLUG = 'jpmorgan-lld-6-week';

const WEEKS = [
  { weekNumber: 1, title: 'OOP & Design Fundamentals' },
  { weekNumber: 2, title: 'First Patterns + First Two Builds' },
  { weekNumber: 3, title: 'Structural Patterns + Fintech/E-comm Builds' },
  { weekNumber: 4, title: 'Heavier Builds + Remaining Creational Patterns' },
  { weekNumber: 5, title: 'Games, Remaining Patterns, Capstone' },
  { weekNumber: 6, title: 'Close the JPMorgan Gaps, Then Go Live' },
];

// dayNumber is global (1-42); weekNumber ties each day back to its week.
const DAYS = [
  // Week 1
  { dayNumber: 1, weekNumber: 1, dayType: 'study', time: '25m + 54m',
    focus: 'Intro to LLD + OOP: Abstraction & Encapsulation' },
  { dayNumber: 2, weekNumber: 1, dayType: 'study', time: '45m',
    focus: 'Inheritance & Polymorphism - then code a small example using all 4 pillars together' },
  { dayNumber: 3, weekNumber: 1, dayType: 'study', time: '72m',
    focus: "UML Diagrams - pause often and hand-draw the class/sequence diagrams yourself, don't just watch" },
  { dayNumber: 4, weekNumber: 1, dayType: 'study', time: '68m',
    focus: 'SOLID Design Principles, Part 1' },
  { dayNumber: 5, weekNumber: 1, dayType: 'study', time: '77m',
    focus: 'SOLID Design Principles, Part 2' },
  { dayNumber: 6, weekNumber: 1, dayType: 'study', time: 'Self-practice',
    focus: 'Practice only: redraw UML for 2 simple systems from memory (a Book, a Vehicle) + write one violation-to-fix example per SOLID principle' },
  { dayNumber: 7, weekNumber: 1, dayType: 'rest', time: '',
    focus: 'Rest day - let the week consolidate' },

  // Week 2
  { dayNumber: 8, weekNumber: 2, dayType: 'study', time: '45m + 33m',
    focus: 'Build Google Docs + Strategy Design Pattern' },
  { dayNumber: 9, weekNumber: 2, dayType: 'study', time: '32m + 33m',
    focus: 'Factory Pattern + Singleton - implement all 3 Singleton variants yourself' },
  { dayNumber: 10, weekNumber: 2, dayType: 'study', time: '67m',
    focus: 'Build Zomato Food Delivery App' },
  { dayNumber: 11, weekNumber: 2, dayType: 'study', time: '29m + 29m',
    focus: 'Observer Pattern + Decorator Pattern' },
  { dayNumber: 12, weekNumber: 2, dayType: 'study', time: '42m + 30m',
    focus: 'Build Notification Engine + Command Pattern' },
  { dayNumber: 13, weekNumber: 2, dayType: 'study', time: '22m + 19m',
    focus: 'Adapter + Facade - then self-quiz: when would you reach for each pattern so far?' },
  { dayNumber: 14, weekNumber: 2, dayType: 'rest', time: '',
    focus: 'Rest day - let the week consolidate' },

  // Week 3
  { dayNumber: 15, weekNumber: 3, dayType: 'study', time: '75m',
    focus: 'Build Spotify Music Player App' },
  { dayNumber: 16, weekNumber: 3, dayType: 'study', time: '38m + 20m',
    focus: 'Composite Pattern / File System + Template Method Pattern' },
  { dayNumber: 17, weekNumber: 3, dayType: 'study', time: '37m + 30m',
    focus: 'Proxy Pattern + Chain of Responsibility / ATM Cash Dispenser' },
  { dayNumber: 18, weekNumber: 3, dayType: 'study', time: '61m',
    focus: 'Build Payment Gateway System' },
  { dayNumber: 19, weekNumber: 3, dayType: 'study', time: '83m',
    focus: 'Build Discount Coupon Engine' },
  { dayNumber: 20, weekNumber: 3, dayType: 'study', time: '31m',
    focus: "Bridge Pattern + review the week's patterns" },
  { dayNumber: 21, weekNumber: 3, dayType: 'rest', time: '',
    focus: 'Rest day - let the week consolidate' },

  // Week 4
  { dayNumber: 22, weekNumber: 4, dayType: 'study', time: '96m',
    focus: 'Build Zepto / Inventory Management System' },
  { dayNumber: 23, weekNumber: 4, dayType: 'study', time: '82m',
    focus: 'Build Tinder (Dating App)' },
  { dayNumber: 24, weekNumber: 4, dayType: 'study', time: '109m',
    focus: 'Builder Pattern - classic builder + step builder' },
  { dayNumber: 25, weekNumber: 4, dayType: 'study', time: '40m + 55m',
    focus: 'Iterator Pattern + Flyweight Pattern' },
  { dayNumber: 26, weekNumber: 4, dayType: 'study', time: '96m',
    focus: 'Build Splitwise Clone' },
  { dayNumber: 27, weekNumber: 4, dayType: 'study', time: '75m',
    focus: 'State Pattern / Vending Machine' },
  { dayNumber: 28, weekNumber: 4, dayType: 'rest', time: '',
    focus: 'Rest day - let the week consolidate' },

  // Week 5
  { dayNumber: 29, weekNumber: 5, dayType: 'study', time: '52m',
    focus: 'Build Tic-Tac-Toe Game' },
  { dayNumber: 30, weekNumber: 5, dayType: 'study', time: '68m',
    focus: 'Build Snake and Ladder Game' },
  { dayNumber: 31, weekNumber: 5, dayType: 'study', time: '48m + 32m',
    focus: 'Mediator Pattern / Chat Room + Prototype Pattern' },
  { dayNumber: 32, weekNumber: 5, dayType: 'study', time: '113m',
    focus: 'Build Chess Game - capstone project, give it the full day' },
  { dayNumber: 33, weekNumber: 5, dayType: 'study', time: '41m + 35m',
    focus: 'Visitor Pattern + Memento Pattern' },
  { dayNumber: 34, weekNumber: 5, dayType: 'study', time: '26m',
    focus: 'Null Object Pattern / anti-patterns - then quiz yourself cold on all 20+ patterns, one-line trigger for each' },
  { dayNumber: 35, weekNumber: 5, dayType: 'rest', time: '',
    focus: 'Rest day - let the week consolidate' },

  // Week 6 — no rest day; this is the last week of the plan
  { dayNumber: 36, weekNumber: 6, dayType: 'study', time: '~45m',
    focus: 'Parking Lot, part 1 - clarify requirements, design classes/UML on paper, no code yet' },
  { dayNumber: 37, weekNumber: 6, dayType: 'study', time: '~75m',
    focus: 'Parking Lot, part 2 - implement it (Strategy for pricing, a hierarchy for vehicle types)' },
  { dayNumber: 38, weekNumber: 6, dayType: 'study', time: '~45m',
    focus: 'Library Management System, part 1 - requirements + UML' },
  { dayNumber: 39, weekNumber: 6, dayType: 'study', time: '~75m',
    focus: 'Library Management System, part 2 - implement it' },
  { dayNumber: 40, weekNumber: 6, dayType: 'study', time: '~40m x2',
    focus: 'Mock round: pick 2 builds untouched for 2+ weeks (e.g. Zepto, Chess), redesign cold with no video, then compare to old notes' },
  { dayNumber: 41, weekNumber: 6, dayType: 'study', time: '~40-45m',
    focus: 'Mock round: one problem not covered in this plan (cab booking, elevator system, or LRU cache), timed like the real thing' },
  { dayNumber: 42, weekNumber: 6, dayType: 'study', time: 'Flexible',
    focus: 'Light review of whatever felt shakiest - keep this one calm, not a cram day' },
];

export const seedRoadmap = async () => {
  const lld = await Module.findOne({ slug: 'lld' });
  if (!lld) {
    throw new Error('Module "lld" not found — run seedModules() before seedRoadmap().');
  }

  const roadmap = await Roadmap.findOneAndUpdate(
    { moduleId: lld._id, slug: ROADMAP_SLUG, source: 'system' },
    {
      title: 'Low-Level Design Roadmap',
      slug: ROADMAP_SLUG,
      moduleId: lld._id,
      description:
        'A 6-week prep plan for JPMorgan-style LLD interviews \u2014 OOP fundamentals, UML, SOLID, 20+ design patterns, and 15 real build projects, plus Parking Lot and Library Management System.',
      totalWeeks: WEEKS.length,
      totalStudyDays: DAYS.filter((d) => d.dayType === 'study').length,
      source: 'system',
      createdBy: null,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const weekIdByNumber = {};
  for (const week of WEEKS) {
    const doc = await RoadmapWeek.findOneAndUpdate(
      { roadmapId: roadmap._id, weekNumber: week.weekNumber },
      { ...week, roadmapId: roadmap._id, order: week.weekNumber, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    weekIdByNumber[week.weekNumber] = doc._id;
  }

  let seeded = 0;
  for (const day of DAYS) {
    const weekId = weekIdByNumber[day.weekNumber];
    await RoadmapDay.findOneAndUpdate(
      { roadmapId: roadmap._id, dayNumber: day.dayNumber },
      {
        roadmapId: roadmap._id,
        weekId,
        dayNumber: day.dayNumber,
        title: day.focus,
        focus: day.focus,
        time: day.time,
        dayType: day.dayType,
        order: day.dayNumber,
        source: 'system',
        createdBy: null,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seeded += 1;
  }

  console.log(
    `\u2705 Seeded roadmap "${roadmap.title}" \u2014 ${WEEKS.length} weeks, ${seeded} days (${DAYS.filter((d) => d.dayType === 'study').length} study, ${DAYS.filter((d) => d.dayType === 'rest').length} rest)`
  );
};
