const fs = require('fs');
const csv = require('csv-parser');

// Path to your CSV log file
const logFile = 'login_log.csv';

// data
const failedAttemptsPerUser = {};
const loginAttemptsPerIp = {};
const successfulUsers = new Set();
const alerts = [];

//ip
const knownAdminIps = new Set(['203.0.113.55']);

// Read and parse the CSV file
fs.createReadStream(logFile)
  .pipe(csv())
  .on('data', (row) => {
    const timestamp = row['Timestamp'];
    const username = row['Username'];
    const ip = row['IP Address'];
    const status = row['Status'];
    const message = row['Message'];

    // Count login attempts per IP
    loginAttemptsPerIp[ip] = (loginAttemptsPerIp[ip] || 0) + 1;

    // Track successful logins
    if (status === 'SUCCESS') {
      successfulUsers.add(username);

      // Check for admin login from unknown IP
      if (username === 'admin' && !knownAdminIps.has(ip)) {
        const alertMsg = `[${timestamp}] ALERT: Admin login from unknown IP ${ip}!`;
        alerts.push(alertMsg);
      }
    }

    // Track failed attempts
    if (status === 'FAILED') {
      failedAttemptsPerUser[username] = (failedAttemptsPerUser[username] || 0) + 1;

      // Alert on 3 failed attempts for a user
      if (failedAttemptsPerUser[username] === 3) {
        const alertMsg = `[${timestamp}] ALERT: User '${username}' has 3 failed login attempts! Possible account lock!`;
        alerts.push(alertMsg);
      }
    }
  })
  .on('end', () => {
    // Check for abusive IPs (5+ attempts)
    for (const [ip, attempts] of Object.entries(loginAttemptsPerIp)) {
      if (attempts >= 5) {
        const alertMsg = `ALERT: IP address ${ip} has ${attempts} login attempts! Possible brute-force attack!`;
        alerts.push(alertMsg);
      }
    }

    // ✅ Show alerts
    console.log('\n--- ALERT MESSAGES ---');
    if (alerts.length > 0) {
      alerts.forEach((alert) => console.log(alert));
    } else {
      console.log('No alerts triggered.');
    }

    // ✅ Write alerts to a file
    const alertLogFile = 'security_alerts.log';
    fs.writeFile(alertLogFile, alerts.join('\n'), (err) => {
      if (err) {
        console.error('Error writing alert log:', err);
      } else {
        console.log(`\nAlerts have been written to '${alertLogFile}'`);
      }
    });
  });
