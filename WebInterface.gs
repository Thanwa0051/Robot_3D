/**
 * Web Interface - HTML UI for Classroom Manager
 * Provides a web-based dashboard for managing attendance, grades, and students
 */

/**
 * Main entry point for web app
 */
function doGet(e) {
  const params = e.parameter || {};
  
  Logger.log("doGet called with params: " + JSON.stringify(params));
  
  // Student access - no password needed
  if (params.studentId) {
    Logger.log("Student access for: " + params.studentId);
    return HtmlService.createHtmlOutput(getStudentView(params.studentId))
      .setWidth(1000)
      .setHeight(700);
  }
  
  // Teacher access - requires password
  if (params.password) {
    Logger.log("Password provided: " + (params.password ? "yes" : "no"));
    Logger.log("Expected password: " + TEACHER_PASSWORD);
    if (params.password === TEACHER_PASSWORD) {
      Logger.log("Password correct, showing dashboard");
      // Return simple HTML first to test
      return HtmlService.createHtmlOutput(`
        <html>
        <head><title>Classroom Manager - Test</title></head>
        <body>
          <h1>✅ Login Success!</h1>
          <p>รหัสผ่านถูกต้อง Dashboard กำลังโหลด...</p>
          <p>หากเห็นหน้านี้ แสดงว่า authentication ทำงานได้</p>
          <p>แต่ getHtmlContent() อาจมีปัญหา</p>
          <button onclick="loadFullDashboard()">Load Full Dashboard</button>
          <script>
            function loadFullDashboard() {
              // Try to load the full dashboard
              try {
                const fullHtml = \`${getHtmlContent()}\`;
                document.body.innerHTML = fullHtml;
              } catch(e) {
                document.body.innerHTML += '<p style="color:red">Error loading dashboard: ' + e.message + '</p>';
              }
            }
          </script>
        </body>
        </html>
      `)
        .setWidth(800)
        .setHeight(400);
    } else {
      Logger.log("Password incorrect");
      return HtmlService.createHtmlOutput(getLoginPage())
        .setWidth(400)
        .setHeight(300);
    }
  }
  
  // No valid access - show login page
  Logger.log("No valid access, showing login page");
  return HtmlService.createHtmlOutput(getLoginPage())
    .setWidth(400)
    .setHeight(300);
}

/**
 * Handle form submissions
 */
function doPost(e) {
  try {
    const action = e.parameter.action;
    const manager = new ClassroomManager(SPREADSHEET_ID);
    
    switch(action) {
      case 'addStudent':
        return addStudent(e.parameter);
      
      case 'logAttendance':
        return logAttendance(e.parameter);
      
      case 'updateGrade':
        return updateGrade(e.parameter);
      
      case 'getStudentData':
        return getStudentData(e.parameter.studentId);
      
      case 'getStudents':
        return getStudentsData();
      
      case 'getAttendance':
        return getAttendanceData(e.parameter.studentId);
      
      case 'getGrades':
        return getGradesData();
      
      case 'calculateAllGrades':
        return calculateAllGrades();
      
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: 'Unknown action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get HTML content for the web interface
 */
function getHtmlContent() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Classroom Manager</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        
        header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        
        header p {
          font-size: 1.1em;
          opacity: 0.9;
        }
        
        nav {
          display: flex;
          background: #f8f9fa;
          border-bottom: 2px solid #ddd;
          flex-wrap: wrap;
        }
        
        nav button {
          flex: 1;
          padding: 15px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1em;
          transition: all 0.3s;
          border-bottom: 3px solid transparent;
        }
        
        nav button:hover, nav button.active {
          background: white;
          border-bottom-color: #667eea;
          color: #667eea;
          font-weight: bold;
        }
        
        .content {
          padding: 30px;
        }
        
        .tab {
          display: none;
        }
        
        .tab.active {
          display: block;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1em;
          transition: border-color 0.3s;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 5px rgba(102, 126, 234, 0.2);
        }
        
        button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #667eea;
        }
        
        td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
        }
        
        tr:hover {
          background: #f8f9fa;
        }
        
        .alert {
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        
        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .alert-info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        
        .stat-card h3 {
          font-size: 2em;
          margin-bottom: 5px;
        }
        
        .stat-card p {
          font-size: 0.9em;
          opacity: 0.9;
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        @media (max-width: 768px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
          
          nav {
            flex-direction: column;
          }
          
          nav button {
            border-bottom: 2px solid transparent;
            border-right: 3px solid transparent;
          }
          
          nav button.active {
            border-right-color: #667eea;
            border-bottom: none;
          }
        }
        
        .loading {
          text-align: center;
          padding: 20px;
        }
        
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>📚 Classroom Manager</h1>
          <p>Manage attendance, grades, and student information</p>
        </header>
        
        <nav>
          <button class="nav-btn active" onclick="switchTab('dashboard')">📊 Dashboard</button>
          <button class="nav-btn" onclick="switchTab('students')">👥 Students</button>
          <button class="nav-btn" onclick="switchTab('attendance')">📝 Attendance</button>
          <button class="nav-btn" onclick="switchTab('grades')">📈 Grades</button>
          <button class="nav-btn" onclick="switchTab('studentAccess')">👨‍🎓 Student Access</button>
        </nav>
        
        <div class="content">
          <!-- Dashboard Tab -->
          <div id="dashboard" class="tab active">
            <h2>Dashboard</h2>
            <div class="stats" id="statsContainer">
              <div class="stat-card">
                <h3 id="totalStudents">0</h3>
                <p>Total Students</p>
              </div>
              <div class="stat-card">
                <h3 id="presentToday">0</h3>
                <p>Present Today</p>
              </div>
              <div class="stat-card">
                <h3 id="averageGrade">0%</h3>
                <p>Average Grade</p>
              </div>
            </div>
            
            <h3>Recent Activity</h3>
            <div id="activityLog" style="background: #f8f9fa; padding: 15px; border-radius: 5px; height: 200px; overflow-y: auto;">
              <p style="color: #999;">Loading activity...</p>
            </div>
          </div>
          
          <!-- Students Tab -->
          <div id="students" class="tab">
            <h2>Student Management</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
              <h3>Add New Student</h3>
              <div class="grid-2">
                <div>
                  <div class="form-group">
                    <label>Student ID:</label>
                    <input type="text" id="newStudentId" placeholder="e.g., S001">
                  </div>
                  <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="newStudentName" placeholder="Full name">
                  </div>
                </div>
                <div>
                  <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="newStudentEmail" placeholder="student@example.com">
                  </div>
                  <div class="form-group">
                    <label>Grade Level:</label>
                    <input type="text" id="newStudentGrade" placeholder="e.g., 10">
                  </div>
                </div>
              </div>
              <button onclick="addNewStudent()">➕ Add Student</button>
            </div>
            
            <h3>Student List</h3>
            <div id="studentsList">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
          
          <!-- Attendance Tab -->
          <div id="attendance" class="tab">
            <h2>Attendance Management</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
              <h3>Log Attendance</h3>
              <div class="grid-2">
                <div>
                  <div class="form-group">
                    <label>Student:</label>
                    <select id="attendanceStudent">
                      <option value="">Select student...</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div class="form-group">
                    <label>Status:</label>
                    <select id="attendanceStatus">
                      <option value="present">✓ Present</option>
                      <option value="absent">✗ Absent</option>
                      <option value="late">⏱ Late</option>
                      <option value="excused">📋 Excused</option>
                    </select>
                  </div>
                </div>
              </div>
              <button onclick="logAttendanceRecord()">📝 Log Attendance</button>
            </div>
            
            <div id="attendanceList">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
          
          <!-- Grades Tab -->
          <div id="grades" class="tab">
            <h2>Grade Management</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
              <h3>Update Student Grade</h3>
              <div class="grid-2">
                <div>
                  <div class="form-group">
                    <label>Student:</label>
                    <select id="gradeStudent">
                      <option value="">Select student...</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div class="form-group">
                    <label>Score:</label>
                    <input type="number" id="gradeScore" min="0" max="100" placeholder="0-100">
                  </div>
                </div>
              </div>
              <button onclick="calculateAllGradesNow()">📊 Recalculate All Grades</button>
            </div>
            
            <h3>Grade Summary</h3>
            <div id="gradesList">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
          
          <!-- Student Access Tab -->
          <div id="studentAccess" class="tab">
            <h2>Student Access</h2>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 5px; margin-bottom: 30px; border-left: 4px solid #4caf50;">
              <h3>📚 Student Portal</h3>
              <p>ให้นักเรียนเข้าดูข้อมูลส่วนตัวได้เอง</p>
              
              <div class="form-group">
                <label>Student ID:</label>
                <input type="text" id="studentIdInput" placeholder="e.g., S001">
              </div>
              
              <button onclick="openStudentView()">👨‍🎓 Open Student Portal</button>
              
              <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 5px;">
                <h4>📋 วิธีการใช้งาน:</h4>
                <ol style="margin-left: 20px;">
                  <li>ให้นักเรียนกรอก Student ID ของตัวเอง</li>
                  <li>คลิก "Open Student Portal"</li>
                  <li>นักเรียนจะเห็นข้อมูลส่วนตัว: เกรด, การเข้าเรียน, สถิติ</li>
                  <li>ครูไม่เห็นข้อมูลของนักเรียนคนอื่น</li>
                </ol>
              </div>
            </div>
            
            <h3>Quick Student Links</h3>
            <div id="studentLinks">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        const scriptUrl = '${ScriptApp.getService().getUrl()}';
        
        function switchTab(tabName) {
          // Hide all tabs
          const tabs = document.querySelectorAll('.tab');
          tabs.forEach(tab => tab.classList.remove('active'));
          
          // Remove active class from buttons
          const buttons = document.querySelectorAll('.nav-btn');
          buttons.forEach(btn => btn.classList.remove('active'));
          
          // Show selected tab
          document.getElementById(tabName).classList.add('active');
          
          // Add active class to clicked button
          event.target.classList.add('active');
          
          // Load data for the tab
          if (tabName === 'students') loadStudents();
          if (tabName === 'attendance') loadAttendance();
          if (tabName === 'grades') loadGrades();
          if (tabName === 'dashboard') loadDashboard();
          if (tabName === 'studentAccess') loadStudentLinks();
        }
        
        function apiCall(action, params = {}) {
          return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('action', action);
            Object.keys(params).forEach(key => {
              formData.append(key, params[key]);
            });
            
            fetch(scriptUrl, {
              method: 'POST',
              body: formData
            })
            .then(r => r.json())
            .then(data => resolve(data))
            .catch(e => reject(e));
          });
        }
        
        function showAlert(message, type = 'info') {
          const div = document.createElement('div');
          div.className = 'alert alert-' + type;
          div.textContent = message;
          
          const content = document.querySelector('.content');
          content.insertBefore(div, content.firstChild);
          
          setTimeout(() => div.remove(), 5000);
        }
        
        async function addNewStudent() {
          const studentId = document.getElementById('newStudentId').value;
          const name = document.getElementById('newStudentName').value;
          const email = document.getElementById('newStudentEmail').value;
          const gradeLevel = document.getElementById('newStudentGrade').value;
          
          if (!studentId || !name || !email) {
            showAlert('Please fill all required fields', 'error');
            return;
          }
          
          try {
            const result = await apiCall('addStudent', {
              studentId, name, email, gradeLevel
            });
            
            if (result.success) {
              showAlert('✓ Student added successfully!', 'success');
              document.getElementById('newStudentId').value = '';
              document.getElementById('newStudentName').value = '';
              document.getElementById('newStudentEmail').value = '';
              document.getElementById('newStudentGrade').value = '';
              loadStudents();
            } else {
              showAlert('Error: ' + result.message, 'error');
            }
          } catch (e) {
            showAlert('Error adding student: ' + e, 'error');
          }
        }
        
        async function loadStudents() {
          try {
            const result = await apiCall('getStudents');
            const list = document.getElementById('studentsList');
            
            if (!result.students || result.students.length === 0) {
              list.innerHTML = '<p style="color: #999;">No students yet</p>';
              return;
            }
            
            let html = '<table><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Grade Level</th></tr>';
            result.students.forEach(student => {
              html += \`<tr>
                <td>\${student.id}</td>
                <td>\${student.name}</td>
                <td>\${student.email}</td>
                <td>\${student.gradeLevel || '-'}</td>
              </tr>\`;
            });
            html += '</table>';
            list.innerHTML = html;
            
            // Update select dropdowns
            updateStudentSelects(result.students);
          } catch (e) {
            document.getElementById('studentsList').innerHTML = '<p style="color: red;">Error loading students</p>';
          }
        }
        
        function updateStudentSelects(students) {
          ['attendanceStudent', 'gradeStudent'].forEach(selectId => {
            const select = document.getElementById(selectId);
            const selected = select.value;
            select.innerHTML = '<option value="">Select student...</option>';
            students.forEach(s => {
              const option = document.createElement('option');
              option.value = s.id;
              option.textContent = s.name + ' (' + s.id + ')';
              select.appendChild(option);
            });
            select.value = selected;
          });
        }
        
        async function logAttendanceRecord() {
          const studentId = document.getElementById('attendanceStudent').value;
          const status = document.getElementById('attendanceStatus').value;
          
          if (!studentId) {
            showAlert('Please select a student', 'error');
            return;
          }
          
          try {
            const result = await apiCall('logAttendance', {
              studentId, status
            });
            
            if (result.success) {
              showAlert('✓ Attendance logged!', 'success');
              loadAttendance();
            } else {
              showAlert('Error: ' + result.message, 'error');
            }
          } catch (e) {
            showAlert('Error logging attendance: ' + e, 'error');
          }
        }
        
        async function loadAttendance() {
          try {
            const result = await apiCall('getAttendance', {});
            const list = document.getElementById('attendanceList');
            
            if (!result.attendance || result.attendance.length === 0) {
              list.innerHTML = '<p style="color: #999;">No attendance records yet</p>';
              return;
            }
            
            let html = '<table><tr><th>Student</th><th>Date</th><th>Status</th><th>Timestamp</th></tr>';
            result.attendance.slice(-50).reverse().forEach(record => {
              let statusEmoji = '✓';
              if (record.status === 'absent') statusEmoji = '✗';
              if (record.status === 'late') statusEmoji = '⏱';
              
              html += \`<tr>
                <td>\${record.studentId}</td>
                <td>\${record.date}</td>
                <td>\${statusEmoji} \${record.status}</td>
                <td>\${record.timestamp ? new Date(record.timestamp).toLocaleString() : '-'}</td>
              </tr>\`;
            });
            html += '</table>';
            list.innerHTML = html;
          } catch (e) {
            document.getElementById('attendanceList').innerHTML = '<p style="color: red;">Error loading attendance</p>';
          }
        }
        
        async function calculateAllGradesNow() {
          try {
            const result = await apiCall('calculateAllGrades', {});
            
            if (result.success) {
              showAlert('✓ All grades recalculated!', 'success');
              loadGrades();
              loadDashboard();
            } else {
              showAlert('Error: ' + result.message, 'error');
            }
          } catch (e) {
            showAlert('Error calculating grades: ' + e, 'error');
          }
        }
        
        async function loadGrades() {
          try {
            const result = await apiCall('getGrades', {});
            const list = document.getElementById('gradesList');
            
            if (!result.grades || result.grades.length === 0) {
              list.innerHTML = '<p style="color: #999;">No grades yet</p>';
              return;
            }
            
            let html = '<table><tr><th>Student</th><th>Assignments</th><th>Participation</th><th>Midterm</th><th>Final</th><th>Overall</th></tr>';
            result.grades.forEach(grade => {
              html += \`<tr>
                <td>\${grade.name}</td>
                <td>\${grade.assignments || '-'}</td>
                <td>\${grade.participation || '-'}</td>
                <td>\${grade.midterm || '-'}</td>
                <td>\${grade.final || '-'}</td>
                <td style="font-weight: bold; color: #667eea;">\${grade.overall || '-'}</td>
              </tr>\`;
            });
            html += '</table>';
            list.innerHTML = html;
          } catch (e) {
            document.getElementById('gradesList').innerHTML = '<p style="color: red;">Error loading grades</p>';
          }
        }
        
        async function loadDashboard() {
          try {
            const result = await apiCall('getStudents', {});
            document.getElementById('totalStudents').textContent = (result.students || []).length;
            
            const gradesResult = await apiCall('getGrades', {});
            if (gradesResult.grades && gradesResult.grades.length > 0) {
              const avg = gradesResult.grades.reduce((sum, g) => sum + (parseFloat(g.overall) || 0), 0) / gradesResult.grades.length;
              document.getElementById('averageGrade').textContent = avg.toFixed(1) + '%';
            }
            
            document.getElementById('presentToday').textContent = '0';
            document.getElementById('activityLog').innerHTML = '<p style="color: #999;">System initialized and ready</p>';
          } catch (e) {
            console.error('Error loading dashboard:', e);
          }
        }
        
        // Load dashboard on page load
        loadDashboard();
        
        // Student Access Functions
        function openStudentView() {
          const studentId = document.getElementById('studentIdInput').value.trim();
          
          if (!studentId) {
            showAlert('Please enter a Student ID', 'error');
            return;
          }
          
          // Open student view in new window
          const studentUrl = scriptUrl + '?studentId=' + encodeURIComponent(studentId);
          window.open(studentUrl, '_blank');
        }
        
        async function loadStudentLinks() {
          try {
            const result = await apiCall('getStudents');
            const linksDiv = document.getElementById('studentLinks');
            
            if (!result.students || result.students.length === 0) {
              linksDiv.innerHTML = '<p style="color: #999;">No students yet</p>';
              return;
            }
            
            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">';
            result.students.forEach(student => {
              const studentUrl = scriptUrl + '?studentId=' + encodeURIComponent(student.id);
              html += `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #f9f9f9;">
                  <h4 style="margin: 0 0 10px 0; color: #333;">${student.name}</h4>
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 0.9em;">ID: ${student.id}</p>
                  <a href="${studentUrl}" target="_blank" style="display: inline-block; padding: 8px 15px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-size: 0.9em;">
                    👁️ View Portal
                  </a>
                </div>
              `;
            });
            html += '</div>';
            linksDiv.innerHTML = html;
          } catch (e) {
            document.getElementById('studentLinks').innerHTML = '<p style="color: red;">Error loading student links</p>';
          }
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Add a new student to the spreadsheet
 */
function addStudent(params) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Students");
    
    sheet.appendRow([
      params.studentId,
      params.name,
      params.email,
      params.gradeLevel || "",
      new Date().toISOString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Student added successfully"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Log attendance for a student
 */
function logAttendance(params) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Attendance");
    
    sheet.appendRow([
      params.studentId,
      new Date().toISOString().split('T')[0],
      params.status,
      new Date().toISOString(),
      ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Attendance logged"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all students data
 */
function getStudentsData() {
  try {
    const manager = new ClassroomManager(SPREADSHEET_ID);
    const students = manager.getStudents();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      students: students
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      students: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get attendance data
 */
function getAttendanceData(studentId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Attendance");
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const attendance = data.slice(1).map(row => ({
      studentId: row[headers.indexOf("Student ID")],
      date: row[headers.indexOf("Date")],
      status: row[headers.indexOf("Status")],
      timestamp: row[headers.indexOf("Timestamp")]
    })).filter(r => r.studentId);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      attendance: attendance
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      attendance: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get grades data
 */
function getGradesData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("Grades");
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        grades: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const grades = data.slice(1).map(row => ({
      studentId: row[headers.indexOf("Student ID")],
      name: row[headers.indexOf("Name")] || "",
      assignments: row[headers.indexOf("assignments")],
      participation: row[headers.indexOf("participation")],
      midterm: row[headers.indexOf("midterm")],
      final: row[headers.indexOf("final")],
      overall: row[headers.indexOf("Overall Grade")],
      letterGrade: row[headers.indexOf("Letter Grade")]
    })).filter(g => g.studentId);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      grades: grades
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      grades: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Calculate all grades and update the sheet
 */
function calculateAllGrades() {
  try {
    weeklyGradeCalculation();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Grades calculated"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get student-specific data for student portal
 */
function getStudentData(studentId) {
  try {
    const manager = new ClassroomManager(SPREADSHEET_ID);
    
    // Get student info
    const students = manager.getStudents();
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Student not found"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get attendance summary
    const attendance = manager.getAttendanceSummary(studentId);
    
    // Get grades
    const gradeData = manager.calculateStudentGrade(studentId);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      student: student,
      attendance: attendance,
      grades: gradeData
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Generate HTML for student view
 */
function getStudentView(studentId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>My Student Portal</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        
        header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        header h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        
        header p {
          font-size: 1.1em;
          opacity: 0.9;
        }
        
        .content {
          padding: 30px;
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        
        .stat-card h3 {
          font-size: 2em;
          margin-bottom: 5px;
        }
        
        .stat-card p {
          font-size: 0.9em;
          opacity: 0.9;
        }
        
        .section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .section h3 {
          color: #333;
          margin-bottom: 15px;
          border-bottom: 2px solid #667eea;
          padding-bottom: 5px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        th {
          background: #667eea;
          color: white;
          padding: 12px;
          text-align: left;
        }
        
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #ddd;
        }
        
        tr:hover {
          background: #f0f0f0;
        }
        
        .grade-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .grade-item {
          background: white;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
          border: 1px solid #ddd;
        }
        
        .grade-item .score {
          font-size: 1.5em;
          font-weight: bold;
          color: #667eea;
        }
        
        .back-btn {
          display: inline-block;
          padding: 10px 20px;
          background: #666;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        
        .back-btn:hover {
          background: #555;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
        }
        
        .error {
          text-align: center;
          padding: 40px;
          color: #d32f2f;
          background: #ffebee;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>👨‍🎓 My Student Portal</h1>
          <p>Welcome to your personal classroom dashboard</p>
        </header>
        
        <div class="content">
          <div id="loading" class="loading">
            <h3>Loading your data...</h3>
            <p>Please wait while we fetch your information.</p>
          </div>
          
          <div id="error" class="error" style="display: none;">
            <h3>❌ Student Not Found</h3>
            <p>The student ID you entered was not found in our system.</p>
            <p>Please contact your teacher for assistance.</p>
          </div>
          
          <div id="studentContent" style="display: none;">
            <div class="stats">
              <div class="stat-card">
                <h3 id="attendanceRate">0%</h3>
                <p>Attendance Rate</p>
              </div>
              <div class="stat-card">
                <h3 id="overallGrade">0</h3>
                <p>Overall Grade</p>
              </div>
              <div class="stat-card">
                <h3 id="totalDays">0</h3>
                <p>Days Recorded</p>
              </div>
            </div>
            
            <div class="section">
              <h3>📊 My Grades</h3>
              <div id="gradesSection">
                <p>No grades available yet.</p>
              </div>
            </div>
            
            <div class="section">
              <h3>📅 Attendance History</h3>
              <div id="attendanceSection">
                <p>No attendance records yet.</p>
              </div>
            </div>
            
            <div class="section">
              <h3>📈 Grade Breakdown</h3>
              <div id="gradeBreakdown">
                <p>Grade breakdown will appear here when available.</p>
              </div>
            </div>
          </div>
          
          <a href="${ScriptApp.getService().getUrl()}" class="back-btn">← Back to Teacher Dashboard</a>
        </div>
      </div>
      
      <script>
        const studentId = '${studentId}';
        const scriptUrl = '${ScriptApp.getService().getUrl()}';
        
        async function loadStudentData() {
          try {
            const formData = new FormData();
            formData.append('action', 'getStudentData');
            formData.append('studentId', studentId);
            
            const response = await fetch(scriptUrl, {
              method: 'POST',
              body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
              displayStudentData(data);
            } else {
              showError();
            }
          } catch (error) {
            showError();
          }
        }
        
        function displayStudentData(data) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('studentContent').style.display = 'block';
          
          // Update header
          document.querySelector('header h1').textContent = '👨‍🎓 ' + data.student.name + "'s Portal";
          document.querySelector('header p').textContent = 'Student ID: ' + data.student.id;
          
          // Update stats
          document.getElementById('attendanceRate').textContent = data.attendance.percentage + '%';
          document.getElementById('overallGrade').textContent = data.grades ? data.grades.overall : 'N/A';
          document.getElementById('totalDays').textContent = data.attendance.total;
          
          // Grades section
          if (data.grades && data.grades.overall) {
            document.getElementById('gradesSection').innerHTML = \`
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #667eea; font-size: 3em;">\${data.grades.overall}</h2>
                <p style="color: #666;">Overall Grade</p>
              </div>
            \`;
          }
          
          // Attendance section
          if (data.attendance.total > 0) {
            document.getElementById('attendanceSection').innerHTML = \`
              <table>
                <tr><th>Present</th><th>Absent</th><th>Late</th><th>Total Days</th><th>Percentage</th></tr>
                <tr>
                  <td style="color: #4caf50; font-weight: bold;">\${data.attendance.present}</td>
                  <td style="color: #f44336; font-weight: bold;">\${data.attendance.absent}</td>
                  <td style="color: #ff9800; font-weight: bold;">\${data.attendance.late}</td>
                  <td>\${data.attendance.total}</td>
                  <td style="font-weight: bold;">\${data.attendance.percentage}%</td>
                </tr>
              </table>
            \`;
          }
          
          // Grade breakdown
          if (data.grades && data.grades.breakdown) {
            let breakdownHtml = '<div class="grade-breakdown">';
            Object.entries(data.grades.breakdown).forEach(([category, score]) => {
              const weight = data.grades.weights[category] * 100;
              breakdownHtml += \`
                <div class="grade-item">
                  <div class="score">\${score || 0}</div>
                  <div>\${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                  <div style="font-size: 0.8em; color: #666;">\${weight}% weight</div>
                </div>
              \`;
            });
            breakdownHtml += '</div>';
            document.getElementById('gradeBreakdown').innerHTML = breakdownHtml;
          }
        }
        
        function showError() {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('error').style.display = 'block';
        }
        
        // Load data when page loads
        loadStudentData();
      </script>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for teacher login page
 */
function getLoginPage() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Teacher Login - Classroom Manager</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .login-container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          padding: 40px;
          text-align: center;
          max-width: 400px;
          width: 100%;
        }
        
        .login-container h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2em;
        }
        
        .login-container p {
          color: #666;
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
          text-align: left;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }
        
        input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1em;
          transition: border-color 0.3s;
        }
        
        input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 5px rgba(102, 126, 234, 0.2);
        }
        
        button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 30px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          width: 100%;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .alert {
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 20px;
          display: none;
        }
        
        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .student-access {
          margin-top: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 5px;
        }
        
        .student-access h3 {
          color: #333;
          margin-bottom: 15px;
        }
        
        .student-access input {
          margin-bottom: 10px;
        }
        
        .student-access button {
          background: #28a745;
          width: auto;
          padding: 8px 20px;
        }
        
        .student-access button:hover {
          background: #218838;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h1>👨‍🏫 Teacher Login</h1>
        <p>Enter password to access classroom management</p>
        
        <div id="alert" class="alert alert-error"></div>
        
        <form onsubmit="login(event)">
          <div class="form-group">
            <label>Password:</label>
            <input type="password" id="password" required placeholder="Enter teacher password">
          </div>
          <button type="submit">🔓 Login to Dashboard</button>
        </form>
        
        <div class="student-access">
          <h3>👨‍🎓 Student Access</h3>
          <p>Students can view their data directly:</p>
          <input type="text" id="studentId" placeholder="Enter Student ID (e.g., S001)">
          <button onclick="openStudentPortal()">👁️ Open Student Portal</button>
        </div>
      </div>
      
      <script>
        const scriptUrl = '${ScriptApp.getService().getUrl()}';
        
        console.log('Script URL:', scriptUrl);
        
        function login(event) {
          event.preventDefault();
          const password = document.getElementById('password').value;
          
          if (!password) {
            showAlert('Please enter password');
            return;
          }
          
          // Redirect to teacher dashboard with password
          const teacherUrl = scriptUrl + '?password=' + encodeURIComponent(password);
          window.location.href = teacherUrl;
        }
        
        function openStudentPortal() {
          const studentId = document.getElementById('studentId').value.trim();
          
          if (!studentId) {
            showAlert('Please enter Student ID');
            return;
          }
          
          // Open student portal
          const studentUrl = scriptUrl + '?studentId=' + encodeURIComponent(studentId);
          window.open(studentUrl, '_blank');
        }
        
        function showAlert(message) {
          const alert = document.getElementById('alert');
          alert.textContent = message;
          alert.style.display = 'block';
          
          setTimeout(() => {
            alert.style.display = 'none';
          }, 3000);
        }
        
        // Focus on password field
        document.getElementById('password').focus();
      </script>
    </body>
    </html>
  `;
}
