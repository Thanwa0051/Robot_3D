/**
 * Configuration - Set your Google Sheets ID and other settings here
 */

// ===== REQUIRED: Update with your Google Sheets ID =====
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

// ===== SECURITY: Teacher Password =====
const TEACHER_PASSWORD = "teacher123"; // เปลี่ยนรหัสผ่านนี้ให้ยากขึ้น!

/**
 * Add menu to Google Sheets (for use from spreadsheet)
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Classroom Manager')
    .addItem('👨‍🏫 Teacher Login', 'openWebApp')
    .addItem('📋 Initialize System', 'initializeApp')
    .addItem('🔄 Test System', 'testSystem')
    .addSeparator()
    .addItem('📝 Log Attendance Today', 'logAttendanceFromForm')
    .addItem('📈 Calculate Grades', 'weeklyGradeCalculation')
    .addItem('📊 Generate Report', 'generateAttendanceReport')
    .addSeparator()
    .addItem('👨‍🎓 Student Access Portal', 'openStudentAccess')
    .addToUi();
}

/**
 * Open the web app login page
 */
function openWebApp() {
  const html = HtmlService.createHtmlOutput(`
    <script>window.open("${ScriptApp.getService().getUrl()}", "_blank");</script>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, 'Opening Classroom Manager...');
}

// ===== Email Settings =====
const EMAIL_SETTINGS = {
  adminEmail: "teacher@example.com",
  sendNotifications: true,
  sendAbsenceAlerts: true,
  absenceThreshold: 3 // Alert if student has 3+ absences
};

// ===== Grade Settings =====
const GRADE_SETTINGS = {
  weights: {
    assignments: 0.40,
    participation: 0.10,
    midterm: 0.25,
    final: 0.25
  },
  passingGrade: 70,
  scale: {
    "A": [90, 100],
    "B": [80, 89],
    "C": [70, 79],
    "D": [60, 69],
    "F": [0, 59]
  }
};

// ===== Attendance Settings =====
const ATTENDANCE_SETTINGS = {
  statuses: ["present", "absent", "late", "excused"],
  clockInTime: "08:00",
  lateAfterMinutes: 5,
  trackTimestamps: true
};

// ===== Trigger Settings =====
const TRIGGER_SETTINGS = {
  // Run daily attendance check at 3 PM
  attendanceCheckTime: 15,
  
  // Run weekly grade calculations on Friday at 2 PM
  gradeCalculationDay: 5, // 0=Sunday, 5=Friday
  gradeCalculationTime: 14,
  
  // Send weekly parent notifications
  parentNotificationDay: 5,
  parentNotificationTime: 16
};

/**
 * Initialize the app - call this once from Apps Script editor
 * Creates necessary sheets and logging infrastructure
 */
function initializeApp() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const requiredSheets = ["Students", "Attendance", "Grades", "Assignments", "Logs"];
    
    requiredSheets.forEach(sheetName => {
      if (!ss.getSheetByName(sheetName)) {
        ss.insertSheet(sheetName);
      }
    });
    
    // Initialize Students sheet headers
    const studentSheet = ss.getSheetByName("Students");
    if (studentSheet.getLastRow() === 0) {
      studentSheet.appendRow(["Student ID", "Name", "Email", "Grade Level", "Enrolled Date"]);
    }
    
    // Initialize Attendance sheet headers
    const attendanceSheet = ss.getSheetByName("Attendance");
    if (attendanceSheet.getLastRow() === 0) {
      attendanceSheet.appendRow(["Student ID", "Date", "Status", "Timestamp", "Notes"]);
    }
    
    // Initialize Grades sheet headers
    const gradesSheet = ss.getSheetByName("Grades");
    if (gradesSheet.getLastRow() === 0) {
      gradesSheet.appendRow([
        "Student ID", "Name", 
        "assignments", "participation", "midterm", "final",
        "Overall Grade", "Letter Grade", "Last Updated"
      ]);
    }
    
    // Initialize Assignments sheet headers
    const assignmentsSheet = ss.getSheetByName("Assignments");
    if (assignmentsSheet.getLastRow() === 0) {
      assignmentsSheet.appendRow([
        "Assignment ID", "Title", "Due Date", "Points Possible", 
        "Student ID", "Score", "Submitted Date", "Status"
      ]);
    }
    
    console.log("✓ App initialized successfully");
    Logger.log("App initialized with required sheets and headers");
  } catch (error) {
    console.error("Initialization failed: " + error.message);
  }
}

/**
 * Setup scheduled triggers - call once from Apps Script editor
 */
function setupTriggers() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Daily attendance check
  ScriptApp.newTrigger("dailyAttendanceCheck")
    .timeBased()
    .atHour(TRIGGER_SETTINGS.attendanceCheckTime)
    .everyDays(1)
    .create();
  
  // Weekly grade calculation
  ScriptApp.newTrigger("weeklyGradeCalculation")
    .timeBased()
    .onWeeksAt(TRIGGER_SETTINGS.gradeCalculationDay, TRIGGER_SETTINGS.gradeCalculationTime + ":00")
    .create();
  
  console.log("✓ Triggers set up successfully");
}

/**
 * Open student access portal in a dialog
 */
function openStudentAccess() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
      <h2>👨‍🎓 Student Access Portal</h2>
      <p>ให้นักเรียนเข้าดูข้อมูลส่วนตัวได้เอง</p>
      
      <div style="margin: 20px 0;">
        <label style="display: block; margin-bottom: 10px; font-weight: bold;">
          Student ID:
        </label>
        <input type="text" id="studentId" placeholder="e.g., S001" 
               style="padding: 10px; font-size: 16px; width: 200px; border: 1px solid #ccc; border-radius: 4px;">
      </div>
      
      <button onclick="openPortal()" 
              style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
        👁️ Open Student Portal
      </button>
      
      <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 4px; text-align: left;">
        <h4 style="margin: 0 0 10px 0;">📋 วิธีการใช้งาน:</h4>
        <ol style="margin: 0; padding-left: 20px;">
          <li>ให้นักเรียนกรอก Student ID ของตัวเอง</li>
          <li>คลิก "Open Student Portal"</li>
          <li>นักเรียนจะเห็นข้อมูลส่วนตัว: เกรด, การเข้าเรียน, สถิติ</li>
        </ol>
      </div>
    </div>
    
    <script>
      function openPortal() {
        const studentId = document.getElementById('studentId').value.trim();
        if (!studentId) {
          alert('Please enter a Student ID');
          return;
        }
        
        const url = '${ScriptApp.getService().getUrl()}?studentId=' + encodeURIComponent(studentId);
        window.open(url, '_blank');
        google.script.host.close();
      }
    </script>
  `)
  .setWidth(400)
  .setHeight(350);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Student Access Portal');
}
