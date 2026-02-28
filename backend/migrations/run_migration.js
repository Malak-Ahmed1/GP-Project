const pool = require('../config/db');

async function runMigration() {
  try {
    console.log('Running migration to update phone_number column length...');
    
    // Update hr table
    await pool.query('ALTER TABLE hr ALTER COLUMN phone_number TYPE VARCHAR(50)');
    console.log('✅ Updated hr table phone_number column');
    
    // Update candidate table
    await pool.query('ALTER TABLE candidate ALTER COLUMN phone_number TYPE VARCHAR(50)');
    console.log('✅ Updated candidate table phone_number column');
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
