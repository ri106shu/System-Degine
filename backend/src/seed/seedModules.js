import Module from '../models/Module.js';

const MODULES = [
  {
    name: 'Low-Level Design',
    slug: 'lld',
    description: 'Object-oriented design, design patterns, and machine coding problems.',
    icon: 'component',
    color: '#F2751A',
    isActive: true,
    order: 1,
  },
  {
    name: 'High-Level Design',
    slug: 'hld',
    description: 'Distributed systems, scalability, and architecture case studies.',
    icon: 'network',
    color: '#5B9BE0',
    isActive: false, // shown as "Coming soon" on the client
    order: 2,
  },
];

export const seedModules = async () => {
  for (const moduleData of MODULES) {
    await Module.findOneAndUpdate({ slug: moduleData.slug }, moduleData, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }
  console.log(`\u2705 Seeded ${MODULES.length} modules (lld, hld)`);
};
