/**
 * Seed Script — Restore Assessment Backup
 * ----------------------------------------
 * Run this whenever you want to restore the backed-up assessments:
 *
 *   node seeds/seed_assessments.js
 *
 * It connects directly to MongoDB and inserts all records from
 * assessments_backup.json, preserving original _id values.
 */

const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = 'test';          // same DB used by the app
const COLL_NAME = 'assessments';   // same collection name used by the app

async function seed() {
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI not found in .env');
    process.exit(1);
  }

  const backupPath = path.join(__dirname, 'assessments_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('❌  assessments_backup.json not found in seeds/');
    process.exit(1);
  }

  const assessments = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  console.log(`📦  Loaded ${assessments.length} assessments from backup`);

  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('✅  Connected to MongoDB');

    const db   = client.db(DB_NAME);
    const coll = db.collection(COLL_NAME);

    // Convert string _id fields to ObjectId so Mongoose is happy
    const { ObjectId } = require('mongodb');
    const docs = assessments.map((doc) => {
      const d = { ...doc };
      if (d._id) d._id = new ObjectId(d._id);
      // Nested ObjectIds inside criteria.questionTypes
      if (d.criteria?.questionTypes) {
        d.criteria.questionTypes = d.criteria.questionTypes.map((qt) => ({
          ...qt,
          _id: qt._id ? new ObjectId(qt._id) : undefined,
        }));
      }
      // Nested section question _ids
      if (d.sections) {
        d.sections = d.sections.map((sec) => ({
          ...sec,
          _id: sec._id ? new ObjectId(sec._id) : undefined,
          questions: (sec.questions || []).map((q) => ({
            ...q,
            _id: q._id ? new ObjectId(q._id) : undefined,
          })),
        }));
      }
      return d;
    });

    // Use ordered:false so it skips duplicates if any already exist
    try {
      const result = await coll.insertMany(docs, { ordered: false });
      console.log(`✅  Inserted ${result.insertedCount} assessments`);
    } catch (err) {
      if (err.code === 11000) {
        console.warn('⚠️   Some documents already exist (duplicate _id) — skipped those.');
      } else {
        throw err;
      }
    }
  } finally {
    await client.close();
    console.log('🔌  Disconnected from MongoDB');
  }
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
