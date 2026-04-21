# Classroom Manager - Google Apps Script Project

A production-ready Google Apps Script framework for classroom automation. Manages attendance tracking, grade calculations, and assignment management with a Google Sheets database.

## Project Files

- **ClassroomManager.gs** - Core class with batch operations, caching, and error handling
- **Logger.gs** - Centralized logging to Sheets and console
- **Config.gs** - Configuration settings and initialization
- **Examples.gs** - Sample functions demonstrating the system
- **README.md** - This file

## Quick Start

### 1. Setup

1. Create a Google Sheet for your classroom data
2. Copy the Spreadsheet ID from the URL
3. Open [script.google.com](https://script.google.com) and create a new project
4. Copy all `.gs` files into the Apps Script editor
5. Update `SPREADSHEET_ID` in `Config.gs` with your sheet ID

### 2. Initialize

Run the setup function in the Apps Script editor console:

```javascript
initializeApp();
```

This creates required sheets: Students, Attendance, Grades, Assignments, and Logs.

### 3. Populate Data

Add your student data to the **Students** sheet:

| Student ID | Name | Email | Grade Level | Enrolled Date |
|---|---|---|---|---|
| S001 | Alice Johnson | alice@example.com | 10 | 2024-01-15 |
| S002 | Bob Smith | bob@example.com | 10 | 2024-01-15 |

### 4. Test

Run the test function:

```javascript
testSystem();
```

Check the Logs sheet for detailed output.

## Key Features

### 1. Batch Operations
Process hundreds of records efficiently:

```javascript
const manager = new ClassroomManager(SPREADSHEET_ID);
manager.batchUpdateAttendance([
  { studentId: "S001", date: "2024-04-21", status: "present" },
  { studentId: "S002", date: "2024-04-21", status: "absent" }
]);
```

### 2. Caching Strategy
Reduces API calls with intelligent caching:

```javascript
// First call reads from Sheets
const students = manager.getStudents(); 

// Subsequent calls use cache (1 hour TTL)
const students2 = manager.getStudents();
```

### 3. Error Handling
Comprehensive try-catch with logging:

```javascript
try {
  manager.calculateStudentGrade(studentId);
} catch (error) {
  logger.error("Grade calculation failed", error.message);
  throw error;
}
```

### 4. Weighted Grade Calculation

Configurable weights in `Config.gs`:

```javascript
const weights = {
  assignments: 0.40,
  participation: 0.10,
  midterm: 0.25,
  final: 0.25
};
```

Usage:

```javascript
const gradeData = manager.calculateStudentGrade("S001");
// Returns: { overall: 85.5, breakdown: {...}, weights: {...} }
```

### 5. Attendance Tracking

Log attendance and get summaries:

```javascript
// Log attendance
manager.batchUpdateAttendance(records);

// Get summary
const summary = manager.getAttendanceSummary("S001");
// Returns: { present: 45, absent: 3, late: 2, total: 50, percentage: "90.00" }
```

## Scheduled Triggers

Setup automated tasks:

```javascript
setupTriggers();
```

This creates:
- **Daily**: `dailyAttendanceCheck()` at 3 PM (checks for absences)
- **Weekly**: `weeklyGradeCalculation()` on Friday at 2 PM (updates grades)

## Example Functions

### Log Attendance from Form

```javascript
logAttendanceFromForm();
```

Records daily attendance for all students.

### Calculate Grades

```javascript
weeklyGradeCalculation();
```

Computes weighted grades and updates the Grades sheet.

### Generate Report

```javascript
generateAttendanceReport();
```

Creates a new sheet with attendance statistics.

### Send Alerts

```javascript
dailyAttendanceCheck();
```

Automatically emails teacher about students with high absences.

## Google Sheets Schema

### Students Sheet
- Student ID (Primary key)
- Name
- Email
- Grade Level
- Enrolled Date

### Attendance Sheet
- Student ID (Foreign key)
- Date
- Status (present/absent/late/excused)
- Timestamp
- Notes

### Grades Sheet
- Student ID
- Name
- Assignments (score)
- Participation (score)
- Midterm (score)
- Final (score)
- Overall Grade (calculated)
- Letter Grade (calculated)
- Last Updated

### Assignments Sheet
- Assignment ID
- Title
- Due Date
- Points Possible
- Student ID (Foreign key)
- Score
- Submitted Date
- Status (submitted/missing/graded)

### Logs Sheet
- Timestamp
- Level (INFO/WARN/ERROR)
- Message
- Details

## Configuration

Edit `Config.gs` to customize:

```javascript
const EMAIL_SETTINGS = {
  adminEmail: "teacher@example.com",
  sendNotifications: true,
  sendAbsenceAlerts: true,
  absenceThreshold: 3
};

const GRADE_SETTINGS = {
  weights: { /* ... */ },
  passingGrade: 70,
  scale: { "A": [90, 100], /* ... */ }
};
```

## Best Practices

1. **Batch Operations**: Use `batchUpdateAttendance()` instead of individual cell updates
2. **Caching**: Leverage built-in caching for frequently accessed data
3. **Logging**: Check the Logs sheet for debugging
4. **Error Handling**: All methods include try-catch blocks
5. **Optimization**: Reduce API calls by batching and caching

## Extending

Add new functionality:

```javascript
class ClassroomManager {
  // ... existing methods ...
  
  // Add new method for custom logic
  getStudentsByGradeLevel(level) {
    const students = this.getStudents();
    return students.filter(s => s.gradeLevel === level);
  }
}
```

## 🔐 Security & Access Control

### Teacher vs Student Access

This system implements **role-based access control**:

#### 👨‍🏫 Teacher Access (Full Control)
- **Authentication**: Requires password login
- **Permissions**: Add/edit students, manage attendance, calculate grades
- **Access**: Full dashboard with all management features

#### 👨‍🎓 Student Access (Read-Only)
- **Authentication**: No password required (URL-based)
- **Permissions**: View personal grades and attendance only
- **Access**: Student portal showing individual data

### Security Implementation

1. **Password Protection**: Teachers must enter password to access management features
2. **URL Parameters**: Students access via `?studentId=S001` parameter
3. **Role Separation**: Different interfaces for teachers vs students
4. **Audit Logging**: All access attempts logged in Logs sheet

### Setting Up Security

1. **Update Teacher Password** in `Config.gs`:
   ```javascript
   const TEACHER_PASSWORD = "YourSecurePassword123!";
   ```

2. **Deploy as Web App** with these settings:
   - Execute as: **Me**
   - Who has access: **Anyone** (required for student access)

3. **Access URLs**:
   - **Teacher Login**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
   - **Student Portal**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?studentId=S001`

### Files to Update in Google Apps Script

After making local changes, update these files in your Google Apps Script project:

1. **`Config.gs`**:
   - Update `TEACHER_PASSWORD` constant
   - Updated menu items in `onOpen()`

2. **`WebInterface.gs`**:
   - Modified `doGet()` function for authentication
   - Added `getLoginPage()` function
   - Enhanced student portal features

3. **Deploy** the web app with updated code

## Troubleshooting

| Issue | Solution |
|---|---|
| "Missing sheets" error | Run `initializeApp()` |
| Authorization required | Confirm you have edit access to the Sheet |
| Grade shows 0 | Check that Grades sheet has numeric scores |
| No logs appear | Verify Logs sheet exists |

## Performance Tips

- Large class (500+ students): Increase `batchSize` in ClassroomManager constructor
- Slow queries: Use `grep_search` to identify slow operations
- Memory issues: Clear cache periodically with `manager.clearCache("*")`

## Support

Refer to official documentation:
- [Google Apps Script Docs](https://developers.google.com/apps-script)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Classroom API](https://developers.google.com/classroom)

---

**Version**: 1.0.0  
**Last Updated**: April 2026  
**License**: MIT
