// backend/services/jobScheduler.js
const pool = require('../config/db');

class JobScheduler {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
  }

  start() {
    if (this.isRunning) {
      console.log('Job scheduler already running');
      return;
    }

    console.log('Starting job scheduler...');
    this.isRunning = true;
    
    // Check for expired jobs every 5 minutes
    this.checkInterval = setInterval(async () => {
      await this.checkAndCloseExpiredJobs();
    }, 5 * 60 * 1000); // 5 minutes

    // Run once immediately on start
    this.checkAndCloseExpiredJobs();
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Job scheduler stopped');
  }

  async checkAndCloseExpiredJobs() {
    try {
      console.log('Checking for expired jobs...');
      
      const result = await pool.query(`
        UPDATE job 
        SET available = false 
        WHERE available = true 
        AND end_date IS NOT NULL 
        AND end_date <= NOW()
        RETURNING id, title, end_date
      `);

      if (result.rows.length > 0) {
        console.log(`Automatically closed ${result.rows.length} expired jobs:`);
        result.rows.forEach(job => {
          console.log(`- Closed job "${job.title}" (ID: ${job.id}) - End date: ${job.end_date}`);
        });
      } else {
        console.log('No expired jobs found');
      }
      
    } catch (error) {
      console.error('Error checking expired jobs:', error);
    }
  }

  async getJobStatus(job) {
    // Check if job has an end date and if it's expired
    if (job.end_date) {
      const endDate = new Date(job.end_date);
      const now = new Date();
      
      if (endDate <= now) {
        return 'closed';
      } else {
        return 'open';
      }
    }
    
    // If no end date, use the available field
    return job.available ? 'open' : 'closed';
  }

  async getJobsWithStatus(hrId) {
    try {
      const result = await pool.query(`
        SELECT id, title, job_desc, available, end_date, created_at
        FROM job
        WHERE hr_id = $1
        ORDER BY created_at DESC
      `, [hrId]);

      const jobs = await Promise.all(
        result.rows.map(async (job) => {
          const status = await this.getJobStatus(job);
          return {
            ...job,
            status
          };
        })
      );

      return jobs;
    } catch (error) {
      console.error('Error fetching jobs with status:', error);
      throw error;
    }
  }
}

module.exports = new JobScheduler();
