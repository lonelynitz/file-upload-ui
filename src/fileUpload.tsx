import { useEffect, useState } from "react";
import axios from "axios";
import "./fileUpload.css";

export const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [uploads, setUploads] = useState<any[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const rowsPerPage = 10;

  const parseCsvPreview = async (
    file: File
  ) => {
    try {
      // RESET
      setPreviewEnabled(false);
      setPreviewHeaders([]);
      setPreviewRows([]);

      // 1MB CHUNK
      const chunkSize = 1024 * 1024;
      let offset = 0;
      let headers: string[] = [];
      let allRows: string[][] = [];
      let leftover = "";

      while (offset < file.size) {

        // READ FILE CHUNK
        const chunk = file.slice(
          offset,
          offset + chunkSize
        );

        const text = await chunk.text();

        // HANDLE SPLIT ROWS
        const combined =
          leftover + text;

        const lines =
          combined.split(/\r?\n/);

        leftover = lines.pop() || "";

        // PARSE CSV ROWS
        const parsedRows = lines.map(
          (line) =>
            line
              .split(",")
              .map((value) =>
                value.trim()
              )
        );

        // EXTRACT HEADERS
        if (
          headers.length === 0 &&
          parsedRows.length > 0
        ) {
          headers = parsedRows[0];

          parsedRows.shift();
        }

        // APPEND ROWS
        allRows.push(...parsedRows);

        // UPDATE UI
        setPreviewHeaders(headers);
        setPreviewRows([...allRows]);
        setPreviewEnabled(true);

        offset += chunkSize;

        // PREVENT UI FREEZE
        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );
      }

      // HANDLE LAST REMAINING ROW
      if (leftover.trim()) {
        const finalRow = leftover
          .split(",")
          .map((value) =>
            value.trim()
          );

        allRows.push(finalRow);
      }

      setPreviewHeaders(headers);
      setPreviewRows(allRows);
      setPreviewPage(1);
      setPreviewEnabled(true);

    } catch (err) {
      console.log(
        "CSV Preview Error",
        err
      );
    }
  };

  const fetchUploads = async () => {
    setUploadsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/uploads");
      setUploads(response.data || []);
    } catch (error) {
      console.error("Failed to load uploads", error);
    } finally {
      setUploadsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const uploadFile = async () => {
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);

      await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("File uploaded successfully ✅");
      setPreviewEnabled(false);
      setPreviewHeaders([]);
      setPreviewRows([]);
      setFile(null);
      await fetchUploads();
    } catch (err) {
      console.log(err);
      setMessage("Upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const messageType = message.includes("success")
    ? "success"
    : message.includes("failed")
      ? "error"
      : "info";

  const totalPages = Math.max(1, Math.ceil(previewRows.length / rowsPerPage));
  const currentRows = previewRows.slice(
    (previewPage - 1) * rowsPerPage,
    previewPage * rowsPerPage
  );

  return (
    <div className="upload-shell">
      <div className="upload-card">
        <h2 className="upload-title">Large File Upload</h2>

        <div className="drop-zone">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              if (selected) {
                setPreviewEnabled(true);
                parseCsvPreview(selected);
              } else {
                setPreviewEnabled(false);
                setPreviewHeaders([]);
                setPreviewRows([]);
              }
            }}
          />

          {file && (
            <p className="file-selected">Selected: {file.name}</p>
          )}
        </div>

        {previewEnabled && previewRows.length > 0 && (
          <div className="preview-section">
            <h3 className="preview-title">CSV Preview</h3>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    {previewHeaders.map((header, index) => (
                      <th key={index}>{header || `Column ${index + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="preview-footer">
              <p className="preview-note">
                Showing {currentRows.length} of {previewRows.length} rows.
              </p>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-button"
                  disabled={previewPage === 1}
                  onClick={() => setPreviewPage((page) => Math.max(1, page - 1))}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {previewPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="pagination-button"
                  disabled={previewPage === totalPages}
                  onClick={() => setPreviewPage((page) => Math.min(totalPages, page + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {uploadsLoading ? (
          <div className="uploads-loading">
            <p>Loading saved uploads...</p>
          </div>
        ) : (
          uploads.length > 0 && (
            <div className="uploads-section">
              <h3 className="preview-title">Saved Uploads</h3>
              <div className="uploads-table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Filename</th>
                      <th>Status</th>
                      <th>Rows</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploads.map((upload) => (
                      <tr key={upload.id}>
                        <td>{upload.id}</td>
                        <td>{upload.file_name}</td>
                        <td>{upload.status}</td>
                        <td>{upload.processed_rows ?? "-"}</td>
                        <td>
                          <a
                            className="download-link"
                            href={`http://localhost:5000/download/${encodeURIComponent(upload.file_name)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        <div className="upload-action">
          <button
            className="upload-button"
            onClick={uploadFile}
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload File"}
          </button>
        </div>

        {message && (
          <p className={`upload-message ${messageType}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};