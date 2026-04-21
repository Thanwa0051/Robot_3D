/**
 * Examples.gs - Sample functions demonstrating system usage
 * These functions show how to use the ClassroomManager class
 */

/**
 * Log attendance for today for all students
 * Call this function daily to record attendance
 */
function logAttendanceFromForm() {
  try {
    const manager = new ClassroomManager();
    const students = manager.getStudents();

    if (students.length === 0) {
      Logger.log("No students found. Please add students first.");
      return;
    }

    // For demo purposes, randomly mark some students as present/absent
    // In real usage, this would come from a form or manual input
    const attendanceRecords = students.map(student => ({
      studentId: student.studentId,
      date: new Date(),
      status: Math.random() > 0.1 ? 'present' : 'absent', // 90% present rate
      notes: Math.random() > 0.95 ? 'Late arrival' : ''
    }));

    const result = manager.batchUpdateAttendance(attendanceRecords);
    Logger.log(`Logged attendance for ${result.length} students`);

    // Send alerts for students with high absences
    sendAbsenceAlerts();

  } catch (error) {
    Logger.log("Error logging attendance: " + error.message);
    throw error;
  }
}

/**
 * Calculate grades for all students weekly
 * This should be run weekly (e.g., every Friday)
 */
function weeklyGradeCalculation() {
  try {
    const manager = new ClassroomManager();
    const students = manager.getStudents();

    let successCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        const gradeData = manager.calculateStudentGrade(student.studentId);
        Logger.log(`Calculated grade for ${student.name}: ${gradeData.overall}%`);
        successCount++;
      } catch (error) {
        Logger.log(`Error calculating grade for ${student.name}: ${error.message}`);
        errorCount++;
      }
    }

    Logger.log(`Grade calculation complete: ${successCount} success, ${errorCount} errors`);

  } catch (error) {
    Logger.log("Error in weekly grade calculation: " + error.message);
    throw error;
  }
}

/**
 * Daily check for attendance and send alerts
 * This runs daily to check for students with high absences
 */
function dailyAttendanceCheck() {
  try {
    const manager = new ClassroomManager();
    const students = manager.getStudents();

    const alerts = [];

    for (const student of students) {
      const summary = manager.getAttendanceSummary(student.studentId);
      const absenceRate = 100 - parseFloat(summary.percentage);

      if (absenceRate > 20) { // More than 20% absences
        alerts.push({
          student: student,
          summary: summary,
          absenceRate: absenceRate
        });
      }
    }

    if (alerts.length > 0) {
      sendAbsenceAlerts(alerts);
      Logger.log(`Sent absence alerts for ${alerts.length} students`);
    } else {
      Logger.log("No students require absence alerts today");
    }

  } catch (error) {
    Logger.log("Error in daily attendance check: " + error.message);
    throw error;
  }
}

/**
 * Generate comprehensive attendance report
 * Creates a new sheet with attendance statistics
 */
function generateAttendanceReport() {
  try {
    const manager = new ClassroomManager();
    const students = manager.getStudents();

    // Create new sheet for report
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reportSheetName = `Attendance_Report_${new Date().toISOString().split('T')[0]}`;

    // Check if sheet exists, delete if it does
    const existingSheet = spreadsheet.getSheetByName(reportSheetName);
    if (existingSheet) {
      spreadsheet.deleteSheet(existingSheet);
    }

    const reportSheet = spreadsheet.insertSheet(reportSheetName);

    // Headers
    reportSheet.appendRow([
      'Student ID', 'Name', 'Grade Level', 'Total Days',
      'Present', 'Absent', 'Late', 'Excused', 'Attendance %'
    ]);

    // Data rows
    for (const student of students) {
      const summary = manager.getAttendanceSummary(student.studentId);

      reportSheet.appendRow([
        student.studentId,
        student.name,
        student.gradeLevel || 'N/A',
        summary.total,
        summary.present,
        summary.absent,
        summary.late || 0,
        summary.excused || 0,
        summary.percentage + '%'
      ]);
    }

    // Format header row
    const headerRange = reportSheet.getRange(1, 1, 1, 9);
    headerRange.setFontWeight('bold').setBackground('#f0f0f0');

    // Auto-resize columns
    reportSheet.autoResizeColumns(1, 9);

    Logger.log(`Generated attendance report: ${reportSheetName}`);

  } catch (error) {
    Logger.log("Error generating attendance report: " + error.message);
    throw error;
  }
}

/**
 * Send email alerts for students with high absences
 * @param {Array} alerts - Array of alert objects with student and summary data
 */
function sendAbsenceAlerts(alerts) {
  try {
    if (!EMAIL_SETTINGS.sendAbsenceAlerts) {
      Logger.log("Absence alerts disabled in settings");
      return;
    }

    if (!alerts || alerts.length === 0) {
      // Get alerts automatically if not provided
      const manager = new ClassroomManager();
      const students = manager.getStudents();
      alerts = [];

      for (const student of students) {
        const summary = manager.getAttendanceSummary(student.studentId);
        const absenceCount = summary.absent;

        if (absenceCount >= EMAIL_SETTINGS.absenceThreshold) {
          alerts.push({
            student: student,
            summary: summary,
            absenceCount: absenceCount
          });
        }
      }
    }

    if (alerts.length === 0) {
      return;
    }

    const subject = `Classroom Alert: ${alerts.length} Students with High Absences`;
    let body = `Dear Teacher,\n\nThe following students have high absence rates:\n\n`;

    for (const alert of alerts) {
      body += `${alert.student.name} (${alert.student.studentId}):\n`;
      body += `  - Total absences: ${alert.absenceCount}\n`;
      body += `  - Attendance rate: ${alert.summary.percentage}%\n`;
      body += `  - Total days: ${alert.summary.total}\n\n`;
    }

    body += `Please follow up with these students.\n\n`;
    body += `Generated by Classroom Manager\n`;
    body += `${new Date().toLocaleString()}`;

    MailApp.sendEmail(EMAIL_SETTINGS.adminEmail, subject, body);
    Logger.log(`Sent absence alert email to ${EMAIL_SETTINGS.adminEmail}`);

  } catch (error) {
    Logger.log("Error sending absence alerts: " + error.message);
    // Don't throw error for email failures
  }
}

/**
 * Test the entire system functionality
 * This function tests all major components
 */
function testSystem() {
  try {
    Logger.log("=== Starting System Test ===");

    // Test 1: Initialize system
    Logger.log("Test 1: Initializing system...");
    initializeApp();
    Logger.log("✅ System initialization complete");

    // Test 2: Create ClassroomManager
    Logger.log("Test 2: Testing ClassroomManager...");
    const manager = new ClassroomManager();
    Logger.log("✅ ClassroomManager created successfully");

    // Test 3: Get students (may be empty initially)
    Logger.log("Test 3: Testing student retrieval...");
    const students = manager.getStudents();
    Logger.log(`✅ Retrieved ${students.length} students`);

    // Test 4: Test logging
    Logger.log("Test 4: Testing logging system...");
    const logger = new Logger();
    logger.info("System test", "All systems operational");
    Logger.log("✅ Logging system working");

    // Test 5: Test web interface (basic check)
    Logger.log("Test 5: Testing web interface setup...");
    const scriptUrl = ScriptApp.getService().getUrl();
    if (scriptUrl) {
      Logger.log(`✅ Web app URL available: ${scriptUrl}`);
    } else {
      Logger.log("⚠️ Web app not deployed yet");
    }

    Logger.log("=== System Test Complete ===");
    Logger.log("🎉 All core systems are functioning!");

    // Show summary in a dialog if running from spreadsheet
    try {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        'System Test Complete',
        '✅ All core systems are functioning!\n\n' +
        `Students: ${students.length}\n` +
        `Web App: ${scriptUrl ? 'Ready' : 'Not deployed'}\n\n` +
        'Next steps:\n' +
        '1. Add students to the Students sheet\n' +
        '2. Deploy web app if not done\n' +
        '3. Test attendance logging',
        ui.ButtonSet.OK
      );
    } catch (e) {
      // Not running from spreadsheet, skip dialog
    }

  } catch (error) {
    Logger.log("❌ System test failed: " + error.message);
    throw error;
  }
}