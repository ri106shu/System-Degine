import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import { slugify } from '../utils/slugify.js';

// Extracted from the uploaded "LLD Interview Roadmap - JPMorgan Prep" PDF.
// `order` reflects each topic's day-of-first-appearance within its own
// category (the Topics page sorts `category, order`), not a single global
// cross-category sequence — patterns and builds interleave across weeks in
// the real roadmap, but the UI groups by category first.
const TOPICS = [
  // OOP & Design Fundamentals — Day 1-2
  { name: 'LLD Fundamentals', category: 'OOP', difficulty: 'Easy', order: 1,
    description: 'An introduction to low-level design: what interviewers are actually evaluating, and how object-oriented thinking underlies every design in this roadmap.' },
  { name: 'Abstraction', category: 'OOP', difficulty: 'Easy', order: 2,
    description: "Hiding implementation detail behind a simple interface, so callers depend on what an object does, not how it does it." },
  { name: 'Encapsulation', category: 'OOP', difficulty: 'Easy', order: 3,
    description: "Bundling data with the methods that operate on it, and controlling access so internal state can't be changed invalidly from outside." },
  { name: 'Inheritance', category: 'OOP', difficulty: 'Easy', order: 4,
    description: "Letting one class reuse and extend the fields and behavior of another, modeling an 'is-a' relationship." },
  { name: 'Polymorphism', category: 'OOP', difficulty: 'Easy', order: 5,
    description: "Calling the same method name on different types and getting type-appropriate behavior, via overriding or overloading." },
  { name: 'OOP Four Pillars', category: 'OOP', difficulty: 'Easy', order: 6,
    description: 'Practice abstraction, encapsulation, inheritance, and polymorphism as the foundation of LLD.' },

  // UML — Day 3
  { name: 'UML Diagrams', category: 'UML', difficulty: 'Medium', order: 1,
    description: 'Practice class and sequence diagrams and learn to represent system structure and interactions.' },
  { name: 'Class Diagrams', category: 'UML', difficulty: 'Medium', order: 2,
    description: 'Represent classes, attributes, methods, and relationships (association, inheritance, composition) in a static structural diagram.' },
  { name: 'Sequence Diagrams', category: 'UML', difficulty: 'Medium', order: 3,
    description: 'Represent the order of interactions between objects over time — the diagram most useful for walking an interviewer through a flow.' },

  // SOLID — Day 4-5
  { name: 'SOLID Design Principles', category: 'SOLID', difficulty: 'Medium', order: 1,
    description: 'Study SOLID principles and practice identifying violations and designing fixes.' },
  { name: 'Single Responsibility Principle', category: 'SOLID', difficulty: 'Medium', order: 2,
    description: 'A class should have one reason to change. The most commonly violated principle in real interview answers.' },
  { name: 'Open/Closed Principle', category: 'SOLID', difficulty: 'Medium', order: 3,
    description: 'Open for extension, closed for modification — add behavior via new classes, not by editing working ones.' },
  { name: 'Liskov Substitution Principle', category: 'SOLID', difficulty: 'Medium', order: 4,
    description: "A subtype must be usable anywhere its base type is, without breaking the caller's expectations." },
  { name: 'Interface Segregation Principle', category: 'SOLID', difficulty: 'Medium', order: 5,
    description: "Many small, specific interfaces beat one large one — no class should implement methods it doesn't need." },
  { name: 'Dependency Inversion Principle', category: 'SOLID', difficulty: 'Medium', order: 6,
    description: 'Depend on abstractions, not concrete classes — high- and low-level modules should both depend on an interface between them.' },

  // Creational Patterns — Day 9, 24
  { name: 'Factory Pattern', category: 'Creational Patterns', difficulty: 'Medium', order: 1,
    description: 'Delegates object creation to a method or class, so calling code depends on an interface, not a concrete constructor.' },
  { name: 'Singleton Pattern', category: 'Creational Patterns', difficulty: 'Medium', order: 2,
    description: 'Guarantees a class has exactly one instance and a global access point. Practice implementing all three common variants — eager, lazy, and thread-safe.' },
  { name: 'Builder Pattern', category: 'Creational Patterns', difficulty: 'Medium', order: 3,
    description: 'Separates constructing a complex object from its representation. Practice both the classic Builder and the step-builder variant.' },
  { name: 'Prototype Pattern', category: 'Creational Patterns', difficulty: 'Medium', order: 4,
    description: 'Creates new objects by cloning an existing instance rather than instantiating a class directly.' },

  // Structural Patterns — Day 11, 13, 16, 17, 20
  { name: 'Decorator Pattern', category: 'Structural Patterns', difficulty: 'Medium', order: 1,
    description: 'Attaches new behavior to an object at runtime by wrapping it, instead of subclassing for every feature combination.' },
  { name: 'Adapter Pattern', category: 'Structural Patterns', difficulty: 'Medium', order: 2,
    description: 'Wraps a class with a new interface so it works with client code that expects something different.' },
  { name: 'Facade Pattern', category: 'Structural Patterns', difficulty: 'Medium', order: 3,
    description: 'Provides a single, simplified interface in front of a complex subsystem of classes.' },
  { name: 'Composite Pattern', category: 'Structural Patterns', difficulty: 'Medium', order: 4,
    description: 'Composes objects into tree structures and lets clients treat an individual object and a group the same way.' },
  { name: 'Proxy Pattern', category: 'Structural Patterns', difficulty: 'Medium', order: 5,
    description: 'A stand-in object that controls access to another object — for lazy loading, access control, caching, or logging.' },
  { name: 'Bridge Pattern', category: 'Structural Patterns', difficulty: 'Hard', order: 6,
    description: 'Splits a class hierarchy into two independent ones — abstraction and implementation — that can vary separately.' },
  { name: 'Flyweight Pattern', category: 'Structural Patterns', difficulty: 'Hard', order: 7,
    description: 'Shares common, immutable state across many objects to cut memory use when you need a lot of similar objects.' },

  // Behavioral Patterns — Day 8, 11-12, 16-17, 27, 31, 33-34
  { name: 'Strategy Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 1,
    description: 'Defines a family of interchangeable algorithms and lets the client pick one at runtime.' },
  { name: 'Observer Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 2,
    description: 'A one-to-many dependency so that when one object changes state, all its dependents are notified automatically.' },
  { name: 'Command Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 3,
    description: 'Turns a request into a standalone object, so it can be queued, logged, or undone independently of who issued it.' },
  { name: 'Template Method Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 4,
    description: "Defines an algorithm's skeleton in a base class and lets subclasses override specific steps." },
  { name: 'Chain of Responsibility Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 5,
    description: 'Passes a request along a chain of handlers until one handles it, decoupling sender from any specific receiver.' },
  { name: 'Iterator Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 6,
    description: 'Accesses the elements of a collection sequentially without exposing its underlying representation.' },
  { name: 'State Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 7,
    description: "Lets an object change behavior when its internal state changes, via a family of state classes instead of a status flag." },
  { name: 'Mediator Pattern', category: 'Behavioral Patterns', difficulty: 'Hard', order: 8,
    description: 'Centralizes how a set of objects interact through a hub, instead of a tangle of direct references between them.' },
  { name: 'Visitor Pattern', category: 'Behavioral Patterns', difficulty: 'Hard', order: 9,
    description: 'Adds new operations to a set of classes without modifying them, by moving the operation into a visitor object.' },
  { name: 'Memento Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 10,
    description: "Captures and externalizes an object's internal state so it can be restored later, without breaking encapsulation." },
  { name: 'Null Object Pattern', category: 'Behavioral Patterns', difficulty: 'Medium', order: 11,
    description: "A do-nothing object standing in for a null reference, so callers don't need to null-check before every use." },

  // Design / Architecture Concepts — meta/review days (13, 34, 40-42),
  // no single build of their own
  { name: 'Design Principles', category: 'Design Concepts', difficulty: 'Medium', order: 1,
    description: 'The higher-level rules — SOLID and beyond — that guide which pattern, if any, actually fits a given design problem.' },
  { name: 'Design Patterns', category: 'Design Concepts', difficulty: 'Medium', order: 2,
    description: 'The catalog of reusable solutions this roadmap covers, reviewed as a set rather than one at a time — recognizing which family a problem calls for.' },
  { name: 'Pattern Selection', category: 'Design Concepts', difficulty: 'Medium', order: 3,
    description: "Practiced explicitly in the roadmap's self-quiz days: given a requirement, choosing which pattern actually applies instead of forcing one you just reviewed." },
  { name: 'Anti-Patterns', category: 'Design Concepts', difficulty: 'Medium', order: 4,
    description: "Common LLD mistakes and overuse of patterns where a simpler design would do — reviewed alongside Null Object on the roadmap's pattern-recap day." },
  { name: 'Extensible Object-Oriented Design', category: 'Design Concepts', difficulty: 'Medium', order: 5,
    description: 'Designing so new requirements can be added without reworking existing classes — the practical payoff of SOLID and pattern selection together.' },

  // LLD Problems — the 18 "build" projects, in day order
  { name: 'Google Docs', category: 'LLD Problems', difficulty: 'Medium', order: 1,
    description: 'Collaborative document editing: document structure, concurrent edits, and versioning.' },
  { name: 'Zomato Food Delivery', category: 'LLD Problems', difficulty: 'Medium', order: 2,
    description: 'Food delivery platform: restaurants, menus, orders, delivery assignment, order-state transitions.' },
  { name: 'Notification Engine', category: 'LLD Problems', difficulty: 'Medium', order: 3,
    description: 'A multi-channel notification system — a natural fit for Observer plus Strategy for channel selection.' },
  { name: 'Spotify Music Player', category: 'LLD Problems', difficulty: 'Medium', order: 4,
    description: 'Music streaming: playlists, playback state, and queue management.' },
  { name: 'File System', category: 'LLD Problems', difficulty: 'Medium', order: 5,
    description: "Model files and directories as a tree, where the same operations (size, list, delete) work uniformly on a single file or a whole folder — the Composite pattern's classic use case." },
  { name: 'ATM Cash Dispenser', category: 'LLD Problems', difficulty: 'Medium', order: 6,
    description: 'Cash withdrawal, card/PIN validation, and denomination breakdown — a compact State-and-Strategy problem.' },
  { name: 'Payment Gateway System', category: 'LLD Problems', difficulty: 'Medium', order: 7,
    description: 'Route a payment across multiple providers with retries and failover.' },
  { name: 'Discount Coupon Engine', category: 'LLD Problems', difficulty: 'Medium', order: 8,
    description: 'Stack and validate multiple discount rules against a cart.' },
  { name: 'Inventory Management System', category: 'LLD Problems', difficulty: 'Hard', order: 9,
    description: 'Quick-commerce inventory: stock across warehouses, reservations, restocking — wide scope, easy to run out of time on.' },
  { name: 'Tinder Dating App', category: 'LLD Problems', difficulty: 'Medium', order: 10,
    description: 'Matching system: profiles, swipe state, and mutual-match detection.' },
  { name: 'Splitwise Clone', category: 'LLD Problems', difficulty: 'Hard', order: 11,
    description: 'Shared expenses and settlements, including the debt-simplification algorithm to minimize repayments.' },
  { name: 'Vending Machine', category: 'LLD Problems', difficulty: 'Medium', order: 12,
    description: 'Item selection, payment and change calculation, and stock tracking, modeled as an explicit state machine.' },
  { name: 'Tic-Tac-Toe Game', category: 'LLD Problems', difficulty: 'Medium', order: 13,
    description: "The standard first 'game' problem — board state, turn-taking, and win detection." },
  { name: 'Snake and Ladder Game', category: 'LLD Problems', difficulty: 'Medium', order: 14,
    description: 'Board game with dice, player turns, and snake/ladder jumps.' },
  { name: 'Chat Room', category: 'LLD Problems', difficulty: 'Hard', order: 15,
    description: 'Real-time messaging between many users and rooms — participants coordinate through a central mediator rather than holding direct references to each other.' },
  { name: 'Chess Game', category: 'LLD Problems', difficulty: 'Hard', order: 16,
    description: 'The heaviest game problem: piece hierarchy, per-piece move validation, check/checkmate detection.' },
  { name: 'Parking Lot', category: 'LLD Problems', difficulty: 'Hard', order: 17,
    description: 'Vehicle-to-spot assignment across levels and vehicle types, with a pricing strategy — asked industry-wide.' },
  { name: 'Library Management System', category: 'LLD Problems', difficulty: 'Hard', order: 18,
    description: 'Book catalog, member borrowing/returns, and due-date/fine rules — structurally close to Parking Lot.' },

  // Interview / Mock Design Problems — Day 41, named as problems "not
  // covered in this plan" for the final timed mock round
  { name: 'Cab Booking System', category: 'Interview Problems', difficulty: 'Hard', order: 1,
    description: 'Match riders to nearby drivers, price a trip, and track ride state end to end — a real-time matching-and-state-machine problem outside the main roadmap.' },
  { name: 'Elevator System', category: 'Interview Problems', difficulty: 'Hard', order: 2,
    description: 'Schedule multiple elevators across requests from inside and outside the cars — a classic hard LLD problem built around a scheduling strategy.' },
  { name: 'LRU Cache', category: 'Interview Problems', difficulty: 'Medium', order: 3,
    description: 'A fixed-capacity cache that evicts the least-recently-used entry — more contained than the other two mock problems, and the one most likely to also come up as a pure DS&A question.' },
];

export const seedTopics = async () => {
  const lld = await Module.findOne({ slug: 'lld' });
  if (!lld) {
    throw new Error('Module "lld" not found — run seedModules() before seedTopics().');
  }

  // Matched by name (not slug) on purpose: name is what already exists in
  // the database from the previous seed version, before `slug` existed.
  // Matching on it here — not the new moduleId+slug+source key — is what
  // lets this land on the SAME existing document and backfill its slug,
  // instead of creating a duplicate next to it.
  for (const topic of TOPICS) {
    await Topic.findOneAndUpdate(
      { moduleId: lld._id, name: topic.name },
      { ...topic, moduleId: lld._id, slug: slugify(topic.name), source: 'system', createdBy: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Two topics were renamed from the previous seed version ("Zepto /
  // Inventory Management" -> "Inventory Management System", "Tinder
  // (Dating App)" -> "Tinder Dating App"). A rename doesn't merge
  // automatically — the old name would otherwise sit alongside the new one
  // as a stale duplicate. This removes any *system* topic whose name isn't
  // in the current canonical list; user-created topics (source: 'user')
  // are never matched by this query, so nothing a user made is ever touched.
  const { deletedCount } = await Topic.deleteMany({
    moduleId: lld._id,
    source: 'system',
    name: { $nin: TOPICS.map((t) => t.name) },
  });

  console.log(
    `\u2705 Seeded ${TOPICS.length} topics (lld)${deletedCount ? `, removed ${deletedCount} stale renamed entries` : ''}`
  );
};
