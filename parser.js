const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const app = express();
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "upload/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Upload
app.post("/upload", upload.single("file"), (req, res) => {
  console.log("File received:", req.file);
  res.json({ message: "File uploaded successfully!" });
});

//port
app.listen(8080, () => {
  console.log(" Server running on port 8080");
});

// path for logs to upload
const UPLOADS_DIR = path.join(__dirname, "upload");
const ALERTS_FILE = path.join(__dirname, "security_alerts.log");

// suspicious patterns
const suspiciousPatterns = [
  "failed login",
  "unauthorized access",
  "malicious activity detected",
];

// scan a log file
function scanLogFile(logFilePath) {
  console.log(`\n Scanning log file: ${logFilePath}`);

  const alerts = [];

  fs.createReadStream(logFilePath)
    .pipe(csv())
    .on("data", (row) => {
      const timestamp = row["Timestamp"];
      const message = row["Message"]?.toLowerCase();

      if (!message) return;

      suspiciousPatterns.forEach((pattern) => {
        if (message.includes(pattern)) {
          const alertMsg = `[${timestamp}] ALERT: Suspicious activity detected - "${pattern}"`;
          alerts.push(alertMsg);
        }
      });
    })
    .on("end", () => {
      if (alerts.length > 0) {
        console.log("\n ALERT MESSAGES ");
        alerts.forEach((alert) => console.log(alert));

        // Write alerts to file
        fs.writeFile(ALERTS_FILE, alerts.join("\n"), (err) => {
          if (err) {
            console.error("Error writing alert log:", err);
          } else {
            console.log(` Alerts saved to '${ALERTS_FILE}'`);
          }
        });
      } else {
        console.log("No suspicious activity detected.");
      }
    });
}

// scan all log files in the uploads directory
function scanUploadsDirectory() {
  fs.readdir(UPLOADS_DIR, (err, files) => {
    if (err) {
      console.error("Error reading upload directory:", err);
      return;
    }

    const logFiles = files.filter((file) => file.endsWith(".csv"));

    if (logFiles.length === 0) {
      console.log("No log files found in the upload directory.");
      return;
    }

    logFiles.forEach((file) => {
      const logFilePath = path.join(UPLOADS_DIR, file);
      scanLogFile(logFilePath);
    });
  });
}

//scanning the uploads directory
scanUploadsDirectory();
