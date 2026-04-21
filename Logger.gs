/**
 * Logger - Centralized logging for the classroom app
 * Logs to a dedicated sheet for debugging and audit trails
 */

class Logger {
  constructor(sheetName = "Logs") {
    try {
      this.sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (!this.sheet) {
        this.sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
        this.sheet.appendRow(["Timestamp", "Level", "Message", "Details"]);
      }
    } catch (error) {
      console.log("Logger sheet unavailable, using console only");
    }
  }
  
  /**
   * Log an info message
   */
  info(message, details = "") {
    this.log("INFO", message, details);
  }
  
  /**
   * Log a warning
   */
  warn(message, details = "") {
    this.log("WARN", message, details);
  }
  
  /**
   * Log an error
   */
  error(message, details = "") {
    this.log("ERROR", message, details);
  }
  
  /**
   * Internal log method
   */
  log(level, message, details) {
    const timestamp = new Date().toISOString();
    const logEntry = [timestamp, level, message, details];
    
    // Log to console
    console.log(`[${level}] ${message}`);
    
    // Log to sheet if available
    if (this.sheet) {
      try {
        this.sheet.appendRow(logEntry);
      } catch (error) {
        console.log("Could not write to log sheet");
      }
    }
  }
  
  /**
   * Get recent logs
   */
  getRecent(count = 50) {
    if (!this.sheet) return [];
    
    const data = this.sheet.getDataRange().getValues();
    return data.slice(Math.max(0, data.length - count)).reverse();
  }
}
