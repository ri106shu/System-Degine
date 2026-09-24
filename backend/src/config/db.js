import mongoose from 'mongoose';
import dns from 'node:dns';

// Node.js has a known, actively-tracked regression (most common on Windows,
// but not exclusive to it) where its built-in DNS resolver fails SRV lookups
// with "querySrv ECONNREFUSED" against mongodb+srv:// URIs — even when the
// record resolves fine via the OS resolver or `nslookup`. Pointing Node at a
// public resolver explicitly is the standard, documented workaround, and is
// harmless for connections that were never affected by it.
// See: https://github.com/nodejs/node/issues/63407 and
//      https://www.alexbevi.com/blog/2023/11/13/querysrv-errors-when-connecting-to-mongodb-atlas/
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`\u2705 MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`\u274c Could not connect to MongoDB: ${err.message}`);
    console.error(
      '   The API will keep running, but any request that touches the database will fail until MONGODB_URI points at a reachable instance.'
    );
  }
};

export default connectDB;
