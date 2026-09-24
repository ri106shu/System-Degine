// Run with: npm run seed
// Safe to re-run — every seed function upserts rather than inserting blindly.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import TopicInterviewPrompt from '../models/TopicInterviewPrompt.js';
import Roadmap from '../models/Roadmap.js';
import RoadmapDay from '../models/RoadmapDay.js';
import { seedModules } from './seedModules.js';
import { seedTopics } from './seedTopics.js';
import { seedQuestions } from './seedQuestions.js';
import { seedTopicPrompts } from './seedTopicPrompts.js';
import { seedRoadmap } from './roadmapSeed.js';
import { seedTimingConfig } from './timingConfigSeed.js';
import { seedAdminUser } from './adminSeed.js';

// Section 17: a real summary computed from the database after seeding, not
// a count written into this file by hand — so it can never drift from
// what's actually there.
const printSummary = async () => {
  const lld = await Module.findOne({ slug: 'lld' });
  const hld = await Module.findOne({ slug: 'hld' });

  const lldTopics = lld ? await Topic.find({ moduleId: lld._id, isActive: true }) : [];
  const hldCount = hld ? await Topic.countDocuments({ moduleId: hld._id, isActive: true }) : 0;
  const promptCount = lld ? await TopicInterviewPrompt.countDocuments({ moduleId: lld._id, isActive: true }) : 0;

  const byCategory = {};
  for (const t of lldTopics) byCategory[t.category] = (byCategory[t.category] || 0) + 1;

  console.log('--------------------------------');
  console.log('InterviewForge Seed Summary');
  console.log('--------------------------------');
  console.log(`LLD Topics: ${lldTopics.length}`);
  console.log('');
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`${category}: ${count}`);
  }
  console.log('');
  console.log(`Topic Interview Prompts: ${promptCount}`);
  console.log(`HLD Topics: ${hldCount}`);

  const lldRoadmap = lld ? await Roadmap.findOne({ moduleId: lld._id, source: 'system', isActive: true }) : null;
  if (lldRoadmap) {
    const studyDays = await RoadmapDay.countDocuments({ roadmapId: lldRoadmap._id, dayType: 'study', isActive: true });
    const restDays = await RoadmapDay.countDocuments({ roadmapId: lldRoadmap._id, dayType: 'rest', isActive: true });
    console.log(`Roadmap: "${lldRoadmap.title}" \u2014 ${lldRoadmap.totalWeeks} weeks, ${studyDays} study days, ${restDays} rest days`);
  }
  console.log('--------------------------------');
};

const run = async () => {
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    console.error('Seed aborted: no active MongoDB connection. Check MONGODB_URI in .env.');
    process.exit(1);
  }

  await seedModules();
  await seedTopics(); // depends on modules
  await seedQuestions(); // depends on topics
  await seedTopicPrompts(); // depends on topics
  await seedRoadmap(); // depends on modules
  await seedTimingConfig();
  await seedAdminUser();
  await printSummary();

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
};

run();
