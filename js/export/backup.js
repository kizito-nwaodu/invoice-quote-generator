/**
 * Data Backup Export and Restore Manager
 */

import { DataRepo } from '../storage/repository.js';
import { validateImportData } from '../engine/validator.js';

export const BackupManager = {
  /**
   * Export all database records to a downloadable JSON file
   */
  exportJSON() {
    const data = DataRepo.exportAll();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `InvoiceMaster_Backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Import data from a JSON File
   * @param {File} file 
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async importJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('No file selected.'));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const validation = validateImportData(parsed);

          if (!validation.isValid) {
            return reject(new Error(`Import validation failed: ${validation.errors.join(', ')}`));
          }

          DataRepo.importAll(parsed);
          resolve({
            success: true,
            message: `Successfully imported backup with ${parsed.documents?.length || 0} documents and ${parsed.customers?.length || 0} customers.`
          });
        } catch (err) {
          reject(new Error(`Failed to parse JSON file: ${err.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read the file.'));
      };

      reader.readAsText(file);
    });
  }
};
