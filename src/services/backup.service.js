const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const prisma = require('../config/db');

class BackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.initBackupDir();
  }

  // Init backup directory
  async initBackupDir() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('Backup directory initialized');
    } catch (error) {
      console.error('Failed to initialize backup directory:', error);
    }
  }

  // Create backup of entire database
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Create backup using pg_dump
      const backupCommand = `pg_dump "${process.env.DATABASE_URL}" > "${filepath}"`;

      return new Promise((resolve, reject) => {
        exec(backupCommand, async (error, stdout, stderr) => {
          if (error) {
            console.error('Backup error:', error);
            reject(error);
          } else {
            // Get file size
            const stats = await fs.stat(filepath);
            console.log(`Backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
            resolve({ filename, filepath, size: stats.size });
          }
        });
      });
    } catch (error) {
      console.error('Backup creation error:', error);
      throw error;
    }
  }

  // Daily auto backup
  async runDailyBackups() {
    try {
      console.log('Starting daily backup...');
      const result = await this.createBackup();
      console.log('Daily backup completed');
      
      // Cleanup old backups (keep last 7 days)
      await this.cleanupOldBackups();

      return result;
    } catch (error) {
      console.error('Daily backup routine error:', error);
    }
  }

  // Cleanup backups older than 7 days
  async cleanupOldBackups() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const files = await fs.readdir(this.backupDir);

      let deleted = 0;
      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);

        if (stats.birthtime < sevenDaysAgo) {
          await fs.unlink(filepath);
          deleted++;
          console.log(`Deleted old backup: ${file}`);
        }
      }

      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} old backups`);
      }
    } catch (error) {
      console.error('Backup cleanup error:', error);
    }
  }

  // Get backup history
  async getBackupHistory(limit = 10) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        backups.push({
          filename: file,
          path: filepath,
          size: stats.size,
          createdAt: stats.birthtime
        });
      }

      // Sort by date descending
      backups.sort((a, b) => b.createdAt - a.createdAt);
      return backups.slice(0, limit);
    } catch (error) {
      console.error('Get backup history error:', error);
      return [];
    }
  }

  // Restore from backup
  async restoreFromBackup(backupPath) {
    try {
      console.log(`Restoring from backup: ${backupPath}`);

      const restoreCommand = `psql "${process.env.DATABASE_URL}" < "${backupPath}"`;

      return new Promise((resolve, reject) => {
        exec(restoreCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('Restore error:', error);
            reject(error);
          } else {
            console.log('Restore completed');
            resolve({ success: true });
          }
        });
      });
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  }
}

module.exports = new BackupService();
