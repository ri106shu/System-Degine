import Question from '../models/Question.js';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';

// One question per "build" project in the roadmap PDF, using its actual
// time estimate as expectedTime. topicName below is a seed-time lookup key
// (resolved to a real topicId after topics are seeded), not a schema field.
const QUESTIONS = [
  {
    topicName: 'Google Docs',
    title: 'Design Google Docs',
    difficulty: 'Easy',
    type: 'LLD Problem',
    expectedTime: 45,
    description:
      'Design the core of a collaborative document editor: a document made of ordered content blocks, multiple users editing concurrently, and a way to reconcile their changes.',
    hints: [
      "Start with a Document as an ordered list of content blocks, not one big mutable string.",
      'Model each edit as an operation (insert/delete at a position) rather than a full-document diff.',
      "Decide out loud whether you're doing last-writer-wins or true operational transform, and scope accordingly.",
    ],
    solutionNotes:
      "Most candidates over-scope this into real-time OT/CRDT territory. A strong answer models Document \u2192 Block \u2192 Operation, keeps an append-only operation log per document, and states the concurrency model it's choosing \u2014 and what it's punting on.",
    tags: ['collaborative-editing', 'versioning', 'observer'],
  },
  {
    topicName: 'Zomato Food Delivery',
    title: 'Design a Food Delivery App (Zomato-style)',
    difficulty: 'Medium',
    type: 'LLD Problem',
    expectedTime: 67,
    description:
      'Model a food delivery platform end to end: restaurants and their menus, placing an order, assigning a delivery partner, and the order lifecycle.',
    hints: [
      'Separate Restaurant/MenuItem (catalog) from Order/OrderItem (a snapshot at order time) \u2014 menu prices change, past orders should not.',
      'Model order status as an explicit state machine, not a free-text field.',
      'Delivery-partner assignment is a good place to show a Strategy (nearest-partner vs. least-busy-partner).',
    ],
    solutionNotes:
      'The interview signal here is usually the Order/OrderItem-vs-catalog snapshot distinction and a clean state machine for order status \u2014 both are easy to get sloppy on under time pressure.',
    tags: ['state-machine', 'strategy', 'marketplace'],
  },
  {
    topicName: 'Notification Engine',
    title: 'Design a Notification Engine',
    difficulty: 'Easy',
    type: 'LLD Problem',
    expectedTime: 42,
    description:
      'A system that sends notifications across multiple channels (email, SMS, push) with per-user preferences and channel-specific formatting.',
    hints: [
      'A Notifier interface with one implementation per channel is Strategy; something subscribing to app events to trigger notifications is Observer.',
      'Keep channel selection and message templating separate from the actual sending/delivery logic.',
      'Think about what happens when a channel fails to send \u2014 retry policy is a natural follow-up question.',
    ],
    solutionNotes:
      'A clean answer keeps three concerns separate: what triggered the notification (Observer), which channel(s) to use (Strategy, driven by user preference), and how to deliver on that channel (one class per channel behind a common interface).',
    tags: ['observer', 'strategy', 'notifications'],
  },
  {
    topicName: 'Spotify Music Player',
    title: 'Design a Music Player (Spotify-style)',
    difficulty: 'Medium',
    type: 'LLD Problem',
    expectedTime: 75,
    description:
      'Model core music-player functionality: songs, playlists, a play queue, and playback state (playing/paused/next/previous).',
    hints: [
      'Playback state (playing, paused, shuffled, repeat-mode) fits the State pattern better than a pile of booleans.',
      "Keep the play queue separate from the playlist it was built from \u2014 skipping or shuffling shouldn't mutate the source playlist.",
      'If time allows, model a Playable interface so a Song and a Podcast episode can share the same queue.',
    ],
    solutionNotes:
      'The main signal is whether playback state is modeled explicitly (State pattern) rather than scattered flags, and whether the play queue is correctly decoupled from its source playlist.',
    tags: ['state', 'queue', 'media'],
  },
  {
    topicName: 'ATM Cash Dispenser',
    title: 'Design an ATM Cash Dispenser',
    difficulty: 'Medium',
    type: 'LLD Problem',
    expectedTime: 40,
    description:
      'Model an ATM: card/PIN authentication, checking balance, withdrawing cash, and breaking a withdrawal amount into available denominations.',
    hints: [
      'ATM flow (idle \u2192 card inserted \u2192 PIN entry \u2192 menu \u2192 dispensing) is a clean State-pattern candidate.',
      "The denomination-breakdown logic is a self-contained algorithm \u2014 get it right and move on, don't over-engineer it.",
      "Decide where balance-check and account-debit actually happen \u2014 the ATM shouldn't own account state.",
    ],
    solutionNotes:
      "Interviewers are usually checking two things: a real state machine for the ATM's own flow, and that you didn't conflate the ATM with the bank account it's debiting.",
    tags: ['state', 'banking'],
  },
  {
    topicName: 'Payment Gateway System',
    title: 'Design a Payment Gateway System',
    difficulty: 'Medium',
    type: 'LLD Problem',
    expectedTime: 61,
    description:
      'Route a payment through one of several payment providers, with provider fallback if one fails.',
    hints: [
      'Each provider integration behind a common PaymentProvider interface is Strategy; trying providers in order until one succeeds is Chain of Responsibility.',
      'Model a Transaction with its own status, separate from any single provider attempt \u2014 one transaction can span multiple attempts.',
      "Idempotency (not double-charging on retry) is worth naming even if you don't fully implement it.",
    ],
    solutionNotes:
      "A strong answer explicitly separates the transaction (one) from provider attempts against it (many), and names Strategy plus Chain of Responsibility rather than hand-waving the fallback logic.",
    tags: ['strategy', 'chain-of-responsibility', 'payments'],
  },
  {
    topicName: 'Discount Coupon Engine',
    title: 'Design a Discount Coupon Engine',
    difficulty: 'Medium',
    type: 'LLD Problem',
    expectedTime: 83,
    description:
      'Apply multiple discount rules (percentage off, flat amount, buy-X-get-Y, category-specific) to a shopping cart, including rule ordering and stacking limits.',
    hints: [
      'Each rule type behind a common DiscountRule interface is Strategy \u2014 resist writing one big if/else.',
      'Chaining multiple applicable rules, each deciding whether to pass to the next, is Chain of Responsibility.',
      'Decide explicitly how stacking works (best-single vs. all-applicable vs. capped) \u2014 interviewers will ask.',
    ],
    solutionNotes:
      "The differentiator is whether rule composition is actually pluggable (new rule types don't require touching existing code) versus a hardcoded chain of conditionals.",
    tags: ['strategy', 'chain-of-responsibility', 'e-commerce'],
  },
  {
    topicName: 'Inventory Management System',
    title: 'Design an Inventory Management System (Zepto-style)',
    difficulty: 'Hard',
    type: 'LLD Problem',
    expectedTime: 96,
    description:
      'Track stock levels for many SKUs across multiple warehouses, handle reservations during checkout, and restock thresholds, under a quick-commerce delivery-time constraint.',
    hints: [
      "Separate 'stock owned' from 'stock reserved' (in a cart, not yet paid) \u2014 most real inventory bugs come from conflating these.",
      'Warehouse selection for an order is a Strategy (nearest-warehouse, or split-across-warehouses if needed).',
      'This has the widest scope in the set \u2014 state explicitly what you are cutting rather than trying to cover everything.',
    ],
    solutionNotes:
      'This is the problem most likely to run you out of time. The strongest signal is scoping discipline: correct reserved-vs-available stock, one clean warehouse-selection strategy, and an explicit out-of-scope list \u2014 over a design that covers everything shallowly.',
    tags: ['inventory', 'strategy', 'scoping'],
  },
  {
    topicName: 'Tinder Dating App',
    title: 'Design a Matching App (Tinder-style)',
    difficulty: 'Medium',
    type: 'LLD Problem',
    expectedTime: 82,
    description:
      'Model a swipe-based matching system: profiles, a swipe/like record, and detecting a mutual match.',
    hints: [
      'A mutual match is: does a Like A\u2192B exist AND a Like B\u2192A exist \u2014 model as a lookup, not a graph traversal.',
      'Profile discovery (who gets shown to whom) is a good place for a Strategy for ranking/filtering candidates.',
      'Keep Like/Swipe as its own entity rather than a field on Profile \u2014 you will want the history.',
    ],
    solutionNotes:
      'The core of a good answer is match-detection being an indexed lookup rather than scanning all likes, plus keeping discovery/ranking pluggable via Strategy.',
    tags: ['matching', 'strategy'],
  },
  {
    topicName: 'Splitwise Clone',
    title: 'Design Splitwise',
    difficulty: 'Hard',
    type: 'LLD Problem',
    expectedTime: 96,
    description:
      'Track shared expenses across a group and compute a minimal set of settlements (who pays whom) to clear all balances.',
    hints: [
      'Split strategy (equal, exact amounts, percentage, shares) is Strategy \u2014 one interface, one implementation per split type.',
      'Keep a running net balance per person per group rather than replaying every expense to compute who owes what.',
      'Settlement-minimization (fewest transactions to clear all debts) is a separate, swappable greedy step on top of the balance sheet.',
    ],
    solutionNotes:
      'This is most often graded on the debt-simplification step specifically \u2014 greedily settling the largest creditor against the largest debtor repeatedly is the standard approach, worth naming explicitly.',
    tags: ['strategy', 'graph', 'settlements'],
  },
  {
    topicName: 'Tic-Tac-Toe Game',
    title: 'Design Tic-Tac-Toe',
    difficulty: 'Easy',
    type: 'LLD Problem',
    expectedTime: 52,
    description:
      'A 3x3 board game: turn-taking between two players, move validation, and win/draw detection.',
    hints: [
      'Make board size and win condition configurable (N\u00d7N, K-in-a-row) \u2014 interviewers often extend this live.',
      'Win detection after a move should check only the lines through that move, not rescan the whole board.',
      'This is a speed round \u2014 the signal is clean class boundaries delivered fast, not cleverness.',
    ],
    solutionNotes:
      'Interviewers use this as a warm-up to judge baseline code organization speed. The one thing worth doing well: efficient win-checking through the last move, not a full-board rescan every turn.',
    tags: ['game', 'warm-up'],
  },
  {
    topicName: 'Snake and Ladder Game',
    title: 'Design Snake and Ladder',
    difficulty: 'Easy',
    type: 'LLD Problem',
    expectedTime: 68,
    description:
      "Board game with dice rolls, player turns, and snake/ladder jumps that move a player's position on the board.",
    hints: [
      "Snakes and ladders are both just 'position X jumps to position Y' \u2014 model as one Jump concept, not two classes.",
      'Keep dice-rolling behind an interface \u2014 loaded dice or multiple dice is a common follow-up.',
      'Decide how you detect a win (exact landing vs. overshoot-bounces-back) up front.',
    ],
    solutionNotes:
      'Similar shape to Tic-Tac-Toe with more state. The Jump abstraction unifying snakes and ladders is the small decision that separates a clean answer from a cluttered one.',
    tags: ['game', 'warm-up'],
  },
  {
    topicName: 'Chess Game',
    title: 'Design Chess',
    difficulty: 'Hard',
    type: 'LLD Problem',
    expectedTime: 113,
    description:
      "A chess engine's core LLD: the board, a piece-type hierarchy with per-piece move rules, turn-taking, and check/checkmate detection.",
    hints: [
      "One Piece base type with a subclass (or move-generation Strategy) per piece type \u2014 don't special-case piece types in Board or Game.",
      'Separate "is this move legal in general" from "does this move leave my own king in check."',
      'Given the time budget, get move validation working for most pieces before attempting full checkmate detection.',
    ],
    solutionNotes:
      "This is the capstone for a reason \u2014 the only problem here that meaningfully tests both a real class hierarchy and a nontrivial algorithm. Time-box corner cases (castling, en passant, promotion) and say out loud that you're doing so.",
    tags: ['inheritance', 'game', 'capstone'],
  },
  {
    topicName: 'Parking Lot',
    title: 'Design a Parking Lot',
    difficulty: 'Medium',
    type: 'LLD Problem',
    expectedTime: 120,
    description:
      'Assign incoming vehicles to spots across multiple levels and spot sizes, track occupancy, and calculate a parking fee on exit.',
    hints: [
      'Model spot-size compatibility explicitly (a motorcycle can use a car spot, not vice versa) rather than a strict 1:1 assumption.',
      'Spot assignment (nearest-available, level-balancing) is a Strategy \u2014 keep it swappable.',
      "Pricing is a separate Strategy from assignment \u2014 don't let fee calculation leak into spot-finding.",
    ],
    solutionNotes:
      'One of the most frequently asked LLD problems industry-wide. The bar is a clean ParkingLot \u2192 Level \u2192 Spot hierarchy, a pluggable assignment strategy, and a pluggable pricing strategy \u2014 three separate concerns, not one tangled method.',
    tags: ['strategy', 'allocation', 'frequently-asked'],
  },
  {
    topicName: 'Library Management System',
    title: 'Design a Library Management System',
    difficulty: 'Medium',
    type: 'LLD Problem',
    expectedTime: 120,
    description:
      "Model a library's book catalog, member borrowing and returns, and due-date/fine calculation, including multiple copies of the same title.",
    hints: [
      'Separate Book (title/metadata) from BookCopy (one loanable physical unit) \u2014 availability lives on the copy.',
      'A Loan entity (copy, member, borrowed-date, due-date, returned-date) gives you fine calculation as a simple function of it.',
      'Fine calculation is a good spot for a Strategy (flat-rate vs. tiered vs. escalating-per-day).',
    ],
    solutionNotes:
      'Structurally close to Parking Lot \u2014 the Book-vs-BookCopy split is the equivalent of the spot-size distinction there, and is the detail that separates a correct multi-copy design from one that breaks with more than one copy of a title.',
    tags: ['strategy', 'allocation'],
  },
];

export const seedQuestions = async () => {
  const lld = await Module.findOne({ slug: 'lld' });
  if (!lld) {
    throw new Error('Module "lld" not found — run seedModules() before seedQuestions().');
  }

  // source/createdBy set explicitly for the same backfill reason as in
  // seedTopics.js — see the comment there.
  let seeded = 0;
  for (const { topicName, ...question } of QUESTIONS) {
    const topic = await Topic.findOne({ moduleId: lld._id, name: topicName });
    if (!topic) {
      console.warn(`   Skipping "${question.title}" \u2014 topic "${topicName}" not found. Seed topics first.`);
      continue;
    }
    await Question.findOneAndUpdate(
      { moduleId: lld._id, title: question.title },
      { ...question, moduleId: lld._id, topicId: topic._id, source: 'system', createdBy: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seeded += 1;
  }
  console.log(`\u2705 Seeded ${seeded} questions (lld)`);
};
