import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

// Mongoose connects in the background rather than blocking startup: Express
// starts listening immediately either way, and Mongoose buffers queries
// until the connection is ready (or times out) rather than the whole API
// going down because the database happened to be slow to answer.
connectDB();

app.listen(PORT, () => {
  console.log(`\ud83d\ude80 InterviewForge API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
