import React, { useState } from "react";
import "./app.css";

const App = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8080/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert("File uploaded successfully:", result);
      } else {
        alert("Upload failed.");
      }
    } catch (error) {
      alert("Error uploading file:", error);
    }
  };

  return (
    <div>
      <h1>Log File Detection</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <small>upload .csv file only</small>
    </div>
  );
};

export default App;
