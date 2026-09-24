import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import TopicInterviewPrompt from '../models/TopicInterviewPrompt.js';

// topicName is a seed-time lookup key (resolved to a real topicId after
// topics are seeded), exactly like seedQuestions.js — and for the same
// reason that mattered there, every name below is verified programmatically
// against the actual seeded Topic.name values before anything is written,
// not just proofread by eye.
const PROMPTS = [
  // OOP
  { topicName: 'LLD Fundamentals', difficulty: 'Easy', category: 'OOP',
    prompt: 'What is Low-Level Design? What are the key things you focus on while designing a system at the class/object level?',
    followUps: ["What's the difference between LLD and HLD?", 'What does an interviewer expect you to demonstrate in an LLD round?'] },
  { topicName: 'Abstraction', difficulty: 'Easy', category: 'OOP',
    prompt: 'What is Abstraction in object-oriented programming? Explain it with a practical example.',
    followUps: ['How is abstraction different from encapsulation?', 'When can excessive abstraction become a problem?'] },
  { topicName: 'Encapsulation', difficulty: 'Easy', category: 'OOP',
    prompt: 'What is Encapsulation? Why is encapsulation important in Low-Level Design?',
    followUps: ['How does encapsulation help maintain object integrity?', 'Give an example of a class that violates encapsulation.'] },
  { topicName: 'Inheritance', difficulty: 'Easy', category: 'OOP',
    prompt: 'What is Inheritance? When would you use inheritance in an LLD design, and what problems can it introduce?',
    followUps: ['When should you prefer composition over inheritance?', 'What is the fragile base class problem?'] },
  { topicName: 'Polymorphism', difficulty: 'Easy', category: 'OOP',
    prompt: 'What is Polymorphism? Explain compile-time and runtime polymorphism with examples.',
    followUps: ['How does runtime polymorphism relate to the Strategy pattern?', "What's the difference between overloading and overriding?"] },
  { topicName: 'OOP Four Pillars', difficulty: 'Easy', category: 'OOP',
    prompt: 'What are the four pillars of OOP? Explain each with an example.',
    followUps: ['Which pillar do you find most often misunderstood in interviews, and why?', 'How do these four pillars work together in a real class design?'] },

  // UML
  { topicName: 'UML Diagrams', difficulty: 'Medium', category: 'UML',
    prompt: 'What is UML and why is it useful in Low-Level Design?',
    followUps: ['Which UML diagrams do you use most in an LLD interview, and why?', 'How much time should you spend drawing UML in a 45-minute interview?'] },
  { topicName: 'Class Diagrams', difficulty: 'Medium', category: 'UML',
    prompt: 'What is a UML Class Diagram? What information should it contain?',
    followUps: ['How do you represent inheritance vs. composition in a class diagram?', "What's the difference between association, aggregation, and composition?"] },
  { topicName: 'Sequence Diagrams', difficulty: 'Medium', category: 'UML',
    prompt: 'What is a UML Sequence Diagram and when would you use one?',
    followUps: ['How does a sequence diagram differ from a class diagram in what it communicates?', 'When would you draw a sequence diagram instead of just talking through the flow?'] },

  // SOLID
  { topicName: 'SOLID Design Principles', difficulty: 'Medium', category: 'SOLID',
    prompt: 'What are the five SOLID principles and why are they important?',
    followUps: ['Can you give an example of a design that violates multiple SOLID principles at once?', 'Do you always need to apply all five, or can over-applying them hurt a design?'] },
  { topicName: 'Single Responsibility Principle', difficulty: 'Medium', category: 'SOLID',
    prompt: 'What is the Single Responsibility Principle? Give an example of a violation.',
    followUps: ["How do you decide what counts as 'one reason to change'?", 'Can a class have multiple methods and still satisfy SRP?'] },
  { topicName: 'Open/Closed Principle', difficulty: 'Medium', category: 'SOLID',
    prompt: 'What does the Open/Closed Principle mean?',
    followUps: ['How does the Strategy pattern help satisfy the Open/Closed Principle?', 'Give an example of extending behavior without modifying existing code.'] },
  { topicName: 'Liskov Substitution Principle', difficulty: 'Medium', category: 'SOLID',
    prompt: 'What is the Liskov Substitution Principle? Give an example.',
    followUps: ['What\u2019s the classic Rectangle/Square example, and why does it violate LSP?', 'How does LSP relate to designing a good inheritance hierarchy?'] },
  { topicName: 'Interface Segregation Principle', difficulty: 'Medium', category: 'SOLID',
    prompt: 'What is the Interface Segregation Principle?',
    followUps: ['How does ISP relate to the Single Responsibility Principle?', "Give an example of a 'fat interface' and how you'd split it."] },
  { topicName: 'Dependency Inversion Principle', difficulty: 'Medium', category: 'SOLID',
    prompt: 'What is the Dependency Inversion Principle?',
    followUps: ['How does dependency inversion enable unit testing?', 'What\u2019s the difference between dependency inversion and dependency injection?'] },

  // Creational Patterns
  { topicName: 'Factory Pattern', difficulty: 'Medium', category: 'Creational Patterns',
    prompt: 'What is the Factory Pattern and what problem does it solve?',
    followUps: ['What\u2019s the difference between a Factory Method and an Abstract Factory?', 'When would a simple constructor be enough, without needing a Factory at all?'] },
  { topicName: 'Singleton Pattern', difficulty: 'Medium', category: 'Creational Patterns',
    prompt: 'What is the Singleton Pattern? What are its advantages and disadvantages?',
    followUps: ['How do you make a Singleton thread-safe?', 'Why do many engineers consider Singleton an anti-pattern in some contexts?'] },
  { topicName: 'Builder Pattern', difficulty: 'Medium', category: 'Creational Patterns',
    prompt: 'What is the Builder Pattern and when should it be used?',
    followUps: ['How does Builder differ from just using a constructor with many parameters?', 'What\u2019s a step-builder, and how does it differ from the classic Builder?'] },
  { topicName: 'Prototype Pattern', difficulty: 'Medium', category: 'Creational Patterns',
    prompt: 'What is the Prototype Pattern and what problem does it solve?',
    followUps: ['What\u2019s the difference between a shallow copy and a deep copy in this context?', 'When is cloning an object cheaper than constructing a new one from scratch?'] },

  // Structural Patterns
  { topicName: 'Decorator Pattern', difficulty: 'Medium', category: 'Structural Patterns',
    prompt: 'What is the Decorator Pattern? How is it different from inheritance?',
    followUps: ['How would you add multiple decorators to the same object?', 'When does decorator composition become harder to reason about than a subclass?'] },
  { topicName: 'Adapter Pattern', difficulty: 'Medium', category: 'Structural Patterns',
    prompt: 'What problem does the Adapter Pattern solve?',
    followUps: ['What\u2019s the difference between an object adapter and a class adapter?', 'Give a real-world example where you\u2019d reach for Adapter.'] },
  { topicName: 'Facade Pattern', difficulty: 'Medium', category: 'Structural Patterns',
    prompt: 'What is the Facade Pattern and what problem does it solve?',
    followUps: ['How does Facade differ from Adapter, since both wrap something?', 'Does a Facade have to hide the subsystem completely, or can callers still reach through it?'] },
  { topicName: 'Composite Pattern', difficulty: 'Medium', category: 'Structural Patterns',
    prompt: 'What is the Composite Pattern? Where would you use it?',
    followUps: ['How does Composite let you treat a single object and a group the same way?', 'What\u2019s a real system where a tree-of-objects structure like this shows up?'] },
  { topicName: 'Proxy Pattern', difficulty: 'Medium', category: 'Structural Patterns',
    prompt: 'What is the Proxy Pattern and what problem does it solve?',
    followUps: ['What are some different kinds of proxies \u2014 lazy-loading, protection, caching?', 'How is Proxy different from Decorator, since both wrap an object?'] },
  { topicName: 'Bridge Pattern', difficulty: 'Hard', category: 'Structural Patterns',
    prompt: 'What is the Bridge Pattern? How is it different from Adapter?',
    followUps: ['Why split abstraction and implementation into two separate hierarchies?', 'Give an example where Bridge avoids a combinatorial explosion of subclasses.'] },
  { topicName: 'Flyweight Pattern', difficulty: 'Hard', category: 'Structural Patterns',
    prompt: 'What is the Flyweight Pattern and what problem does it solve?',
    followUps: ['What\u2019s the difference between intrinsic and extrinsic state in Flyweight?', 'Give an example of a system where Flyweight would meaningfully reduce memory.'] },

  // Behavioral Patterns
  { topicName: 'Strategy Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the Strategy Pattern? When would you use it?',
    followUps: ['How does Strategy relate to the Open/Closed Principle?', 'How would a client choose which strategy to use at runtime?'] },
  { topicName: 'Observer Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the Observer Pattern? Where would you use it?',
    followUps: ['How do observers get notified \u2014 pull or push, and what\u2019s the trade-off?', "What can go wrong if an observer isn't unsubscribed properly?"] },
  { topicName: 'Command Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the Command Pattern and what problem does it solve?',
    followUps: ['How does Command enable undo/redo functionality?', 'How is a Command object different from just calling a method directly?'] },
  { topicName: 'Template Method Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the Template Method Pattern?',
    followUps: ['How does Template Method differ from Strategy, since both vary behavior?', 'What parts of an algorithm typically stay fixed vs. get overridden?'] },
  { topicName: 'Chain of Responsibility Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the Chain of Responsibility Pattern? Where would you use it?',
    followUps: ["What happens if no handler in the chain can process the request?", 'How is this different from just calling a list of handlers in a loop?'] },
  { topicName: 'Iterator Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the Iterator Pattern and what problem does it solve?',
    followUps: ["How does Iterator let you change a collection's internal structure without breaking client code?", 'What\u2019s the difference between an internal and an external iterator?'] },
  { topicName: 'State Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the State Pattern? How is it different from a plain status flag?',
    followUps: ['How does State relate to a state machine you\u2019d draw for a problem like an ATM?', 'How does adding a new state affect existing state classes?'] },
  { topicName: 'Mediator Pattern', difficulty: 'Hard', category: 'Behavioral Patterns',
    prompt: 'What is the Mediator Pattern and what problem does it solve?',
    followUps: ['How does Mediator prevent objects from holding direct references to each other?', 'What\u2019s the risk of a Mediator becoming a \u2018god object\u2019?'] },
  { topicName: 'Visitor Pattern', difficulty: 'Hard', category: 'Behavioral Patterns',
    prompt: 'What is the Visitor Pattern? What problem does it solve?',
    followUps: ['Why does adding a new visitable type require touching every visitor, and is that a real cost?', 'How does Visitor let you add operations without modifying the visited classes?'] },
  { topicName: 'Memento Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the Memento Pattern and what problem does it solve?',
    followUps: ['How does Memento preserve encapsulation while still allowing state to be restored?', 'Give an example system where undo functionality would use Memento.'] },
  { topicName: 'Null Object Pattern', difficulty: 'Medium', category: 'Behavioral Patterns',
    prompt: 'What is the Null Object Pattern?',
    followUps: ['How does Null Object remove the need for null checks throughout a codebase?', 'What\u2019s a risk of using Null Object where a real null check would be clearer?'] },

  // Design Concepts
  { topicName: 'Design Principles', difficulty: 'Medium', category: 'Design Concepts',
    prompt: 'What design principles, beyond SOLID, guide a good LLD design?',
    followUps: ['How do you balance following principles against shipping something simple that works?', 'Can you give an example where strictly following a principle made a design worse?'] },
  { topicName: 'Design Patterns', difficulty: 'Medium', category: 'Design Concepts',
    prompt: 'How would you approach recognizing which design pattern, if any, fits a given requirement?',
    followUps: ["What's the risk of forcing a pattern onto a problem that doesn't need one?", 'Which pattern families show up most often in LLD interviews?'] },
  { topicName: 'Pattern Selection', difficulty: 'Medium', category: 'Design Concepts',
    prompt: 'Given a requirement, how do you decide which pattern actually applies instead of defaulting to one you just reviewed?',
    followUps: ['What questions would you ask about a requirement before reaching for a specific pattern?', 'Can you walk through picking between Strategy and State for a problem with multiple \u2018modes\u2019 of behavior?'] },
  { topicName: 'Anti-Patterns', difficulty: 'Medium', category: 'Design Concepts',
    prompt: 'What are some common LLD anti-patterns, and what makes them problematic?',
    followUps: ['What is the God Object anti-pattern, and how do you recognize it forming during a design?', 'Is overusing design patterns itself an anti-pattern? Why or why not?'] },
  { topicName: 'Extensible Object-Oriented Design', difficulty: 'Medium', category: 'Design Concepts',
    prompt: 'What makes an object-oriented design extensible, and why does that matter in an interview?',
    followUps: ['How do SOLID and pattern selection work together to produce an extensible design?', 'How would you demonstrate extensibility if an interviewer asked you to add a new requirement mid-interview?'] },

  // LLD Problems — conceptual framing, distinct from the "Design X" question
  { topicName: 'Google Docs', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'Before writing any code, what are the core entities and challenges in designing a collaborative document editor like Google Docs?',
    followUps: ['How would you represent a document so multiple users can edit it concurrently?', 'What\u2019s the difference between last-writer-wins and operational transform, at a conceptual level?'] },
  { topicName: 'Zomato Food Delivery', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What are the core entities and design challenges in a food delivery platform?',
    followUps: ['Why should Order/OrderItem be modeled separately from the restaurant\u2019s live menu?', 'What design pattern fits choosing a delivery partner, and why?'] },
  { topicName: 'Notification Engine', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What are the core design challenges in a multi-channel notification system?',
    followUps: ['Which patterns fit triggering a notification versus choosing a delivery channel?', 'How would you handle a channel failing to deliver a notification?'] },
  { topicName: 'Spotify Music Player', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What are the core entities you\u2019d model for a music streaming player?',
    followUps: ['Why should the play queue be modeled separately from the playlist it came from?', 'What pattern fits representing playback state \u2014 playing, paused, shuffled?'] },
  { topicName: 'File System', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What\u2019s the core design challenge in modeling a file system\u2019s files and directories?',
    followUps: ['Why is this a natural fit for the Composite pattern?', 'What operations should work identically on a single file and an entire folder?'] },
  { topicName: 'ATM Cash Dispenser', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What are the core design challenges in modeling an ATM?',
    followUps: ['Why does an ATM\u2019s own flow fit the State pattern well?', 'Where should account balance and debit logic actually live, and why not on the ATM itself?'] },
  { topicName: 'Payment Gateway System', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What\u2019s the core design challenge in routing a payment across multiple providers?',
    followUps: ['Which patterns fit trying providers in order until one succeeds?', 'Why should a Transaction be modeled separately from individual provider attempts?'] },
  { topicName: 'Discount Coupon Engine', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What\u2019s the core design challenge in applying multiple discount rules to a cart?',
    followUps: ['Which pattern fits composing multiple applicable discount rules?', 'How would you decide whether rules stack, or only the best one applies?'] },
  { topicName: 'Inventory Management System', difficulty: 'Hard', category: 'LLD Problems',
    prompt: 'What are the core design challenges in tracking inventory across multiple warehouses?',
    followUps: ['Why is separating \u2018stock owned\u2019 from \u2018stock reserved\u2019 so important here?', 'What would you explicitly scope out to avoid running out of time on this problem?'] },
  { topicName: 'Tinder Dating App', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What\u2019s the core design challenge in a swipe-based matching system?',
    followUps: ['How would you detect a mutual match efficiently, without scanning all likes?', 'Where does a ranking/discovery strategy fit into this design?'] },
  { topicName: 'Splitwise Clone', difficulty: 'Hard', category: 'LLD Problems',
    prompt: 'What\u2019s the core design challenge in tracking shared expenses and settling debts?',
    followUps: ['Which pattern fits supporting multiple ways to split an expense \u2014 equal, exact, percentage?', 'At a high level, how does the debt-simplification algorithm work?'] },
  { topicName: 'Vending Machine', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What are the core design challenges in modeling a vending machine?',
    followUps: ['Why does a vending machine\u2019s flow fit the State pattern well?', 'How would you model calculating change from available denominations?'] },
  { topicName: 'Tic-Tac-Toe Game', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What are the core design challenges in a simple board game like Tic-Tac-Toe?',
    followUps: ['How would you make the board size and win condition configurable?', 'Why should win-detection only check lines through the last move, not the whole board?'] },
  { topicName: 'Snake and Ladder Game', difficulty: 'Medium', category: 'LLD Problems',
    prompt: 'What are the core design challenges in a board game with snakes and ladders?',
    followUps: ['Why can snakes and ladders be modeled as one \u2018Jump\u2019 concept instead of two?', 'How would you support multiple or loaded dice cleanly?'] },
  { topicName: 'Chat Room', difficulty: 'Hard', category: 'LLD Problems',
    prompt: 'What\u2019s the core design challenge in real-time messaging between many users and rooms?',
    followUps: ['Why does this fit the Mediator pattern well?', 'How would participants be notified of new messages without holding direct references to each other?'] },
  { topicName: 'Chess Game', difficulty: 'Hard', category: 'LLD Problems',
    prompt: 'What are the core design challenges in modeling a chess engine?',
    followUps: ['How would you model different piece types without special-casing them everywhere?', "What's the difference between 'is this move legal' and 'does this move leave my king in check'?"] },
  { topicName: 'Parking Lot', difficulty: 'Hard', category: 'LLD Problems',
    prompt: 'What are the core design challenges in a parking lot system?',
    followUps: ['Why should spot assignment and pricing be separate, swappable strategies?', 'How would you handle a vehicle that can fit in more than one spot size?'] },
  { topicName: 'Library Management System', difficulty: 'Hard', category: 'LLD Problems',
    prompt: 'What are the core design challenges in a library\u2019s catalog and borrowing system?',
    followUps: ['Why should Book and BookCopy be modeled as separate entities?', 'How would you calculate a fine, and why is that a natural Strategy?'] },

  // Interview Problems
  { topicName: 'Cab Booking System', difficulty: 'Hard', category: 'Interview Problems',
    prompt: 'What are the core design challenges in matching riders to drivers and pricing a trip?',
    followUps: ['How would you find nearby drivers efficiently?', 'What states does a ride go through from request to completion?'] },
  { topicName: 'Elevator System', difficulty: 'Hard', category: 'Interview Problems',
    prompt: 'What\u2019s the core design challenge in scheduling multiple elevators across requests?',
    followUps: ['How do internal (inside-the-car) and external (floor) requests differ in how they\u2019re handled?', 'What scheduling strategy would you start with, and when would it break down?'] },
  { topicName: 'LRU Cache', difficulty: 'Medium', category: 'Interview Problems',
    prompt: 'What is an LRU Cache, and what\u2019s the core design challenge in implementing one?',
    followUps: ['Which two data structures do you combine to get O(1) get and put?', 'What would you change to support LFU (least-frequently-used) instead?'] },
];

export const seedTopicPrompts = async () => {
  const lld = await Module.findOne({ slug: 'lld' });
  if (!lld) {
    throw new Error('Module "lld" not found — run seedModules() before seedTopicPrompts().');
  }

  let seeded = 0;
  let skipped = 0;
  for (const { topicName, ...prompt } of PROMPTS) {
    const topic = await Topic.findOne({ moduleId: lld._id, name: topicName });
    if (!topic) {
      console.warn(`   Skipping prompt for "${topicName}" \u2014 topic not found. Seed topics first.`);
      skipped += 1;
      continue;
    }
    await TopicInterviewPrompt.findOneAndUpdate(
      { topicId: topic._id },
      { ...prompt, topicId: topic._id, moduleId: lld._id, source: 'system', createdBy: null, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seeded += 1;
  }
  console.log(`\u2705 Seeded ${seeded} topic interview prompts (lld)${skipped ? `, ${skipped} skipped (topic not found)` : ''}`);
};
