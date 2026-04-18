// InspectionViewModalWithAI.jsx
import { useState, useEffect } from "react";
import apiClient from "../api/axiosConfig";
import { resolveDisplayImageUrl } from "../api/imageUpload";
import MaintenanceRecordForm from "./MaintenanceRecordForm";
import ZoomAnnotatedImage from "./ZoomAnnotatedImage";
import '../styles/InspectionViewModal.css';

export default function InspectionViewModal({
  inspection,
  transformers,
  onClose,
  updateInspection,
  updateTransformer
}) {
  const inspectionTransformerId = Number(inspection.transformerId ?? inspection.transformer);
  const transformer = transformers.find(t => Number(t.id) === inspectionTransformerId);
  const uploader = "Admin";
  const weatherOptions = ["Sunny", "Rainy", "Cloudy"];

  // --- Baseline state ---
  const [baselineImage, setBaselineImage] = useState(inspection.baselineImage || transformer?.baselineImage || null);
  const [baselineWeather, setBaselineWeather] = useState(inspection.baselineWeather || transformer?.weather || "Sunny");
  const [baselineUploadDate, setBaselineUploadDate] = useState(inspection.baselineUploadDate || transformer?.baselineUploadDate || null);
  const [localBaselineChanged, setLocalBaselineChanged] = useState(false);
  useEffect(() => {
    if (!localBaselineChanged) {
      setBaselineImage(transformer?.baselineImage || null);
      setBaselineWeather(transformer?.weather || "Sunny");
      setBaselineUploadDate(transformer?.baselineUploadDate || null);
    }
  }, [transformer, localBaselineChanged]);

  const [baselineImageURL, setBaselineImageURL] = useState(null);
  useEffect(() => {
    let isActive = true;
    let objectUrl = null;

    const loadBaselineImageUrl = async () => {
      if (!baselineImage) {
        setBaselineImageURL(null);
        return;
      }

      if (baselineImage instanceof File || baselineImage instanceof Blob) {
        objectUrl = URL.createObjectURL(baselineImage);
        if (isActive) {
          setBaselineImageURL(objectUrl);
        }
        return;
      }

      if (typeof baselineImage === "string") {
        try {
          const resolvedUrl = await resolveDisplayImageUrl(baselineImage);
          if (isActive) {
            setBaselineImageURL(resolvedUrl);
          }
        } catch (error) {
          console.error("Failed to resolve baseline image URL:", error);
          if (isActive) {
            setBaselineImageURL(null);
          }
        }
        return;
      }

      if (isActive) {
        setBaselineImageURL(null);
      }
    };

    loadBaselineImageUrl();

    return () => {
      isActive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [baselineImage]);

  // --- Maintenance state ---
  const [maintenanceImage] = useState(inspection.maintenanceImage || null);
  const [maintenanceWeather] = useState(inspection.maintenanceWeather || "Sunny");
  const [maintenanceUploadDate] = useState(inspection.maintenanceUploadDate || null);

  const [maintenanceImageURL, setMaintenanceImageURL] = useState(null);
  useEffect(() => {
    let isActive = true;
    let objectUrl = null;

    const loadMaintenanceImageUrl = async () => {
      if (!maintenanceImage) {
        setMaintenanceImageURL(null);
        return;
      }

      if (maintenanceImage instanceof File || maintenanceImage instanceof Blob) {
        objectUrl = URL.createObjectURL(maintenanceImage);
        if (isActive) {
          setMaintenanceImageURL(objectUrl);
        }
        return;
      }

      if (typeof maintenanceImage === "string") {
        try {
          const resolvedUrl = await resolveDisplayImageUrl(maintenanceImage);
          if (isActive) {
            setMaintenanceImageURL(resolvedUrl);
          }
        } catch (error) {
          console.error("Failed to resolve maintenance image URL:", error);
          if (isActive) {
            setMaintenanceImageURL(null);
          }
        }
        return;
      }

      if (isActive) {
        setMaintenanceImageURL(null);
      }
    };

    loadMaintenanceImageUrl();

    return () => {
      isActive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [maintenanceImage]);

  const [showBaselinePreview, setShowBaselinePreview] = useState(false);

  // --- Progress status ---
  const [progressStatus, setProgressStatus] = useState(
    inspection.progressStatus || {
      thermalUpload: inspection.maintenanceImage ? "Completed" : "Pending",
      aiAnalysis: inspection.maintenanceImage ? "In Progress" : "Pending",
      review: inspection.maintenanceImage ? "In Progress" : "Pending"
    }
  );
  const isAIAnalysisCompleted = progressStatus.aiAnalysis === "Completed";

  // --- Completion ---
  const [isCompleted, setIsCompleted] = useState(false);
  const handleComplete = async () => {
    const updatedInspection = {
      ...inspection,
      maintenanceImage,
      annotatedImage: annotatedImageSource,
      baselineWeather,
      baselineUploadDate,
      maintenanceWeather,
      maintenanceUploadDate,
      anomalies,
      // Then update status to complete
      status: "Completed",
      inspectedDate: inspection.date,
      date: null,
      progressStatus: {
        thermalUpload: "Completed",
        aiAnalysis: "Completed",
        review: "Completed",
      },
    };
    if (updateInspection) updateInspection(updatedInspection);
    // Now close the modal
    onClose();
  };

  // ---------------- AI Analysis + Annotations ----------------
  const [annotatedImageSource, setAnnotatedImageSource] = useState(
    inspection.progressStatus?.aiAnalysis === "Completed"
      ? (inspection.annotatedImageKey || null)
      : null
  );
  const [annotatedImageURL, setAnnotatedImageURL] = useState(null); // resolved presigned URL of the backend-annotated image
  const [annotatedImageUnavailable, setAnnotatedImageUnavailable] = useState(false); // true when backend did not upload annotated image
  const [anomalies, setAnomalies] = useState(inspection.anomalies || []); // {id,x,y,w,h,confidence,comment,source,deleted}
  const [isRunningAI, setIsRunningAI] = useState(false);
  const [aiThreshold, setAiThreshold] = useState(50); // 0–100 scale matching API sliderPercent
  const [hoveredAnomalyId, setHoveredAnomalyId] = useState(null); // For highlighting rows in analysis log
  const [showRecordForm, setShowRecordForm] = useState(false);

  useEffect(() => {
    let isActive = true;
    let objectUrl = null;

    const loadAnnotatedImageUrl = async () => {
      if (!isAIAnalysisCompleted || !annotatedImageSource) {
        setAnnotatedImageURL(null);
        return;
      }

      if (annotatedImageSource instanceof File || annotatedImageSource instanceof Blob) {
        objectUrl = URL.createObjectURL(annotatedImageSource);
        if (isActive) {
          setAnnotatedImageURL(objectUrl);
        }
        return;
      }

      if (typeof annotatedImageSource === "string") {
        try {
          const resolvedUrl = await resolveDisplayImageUrl(annotatedImageSource);
          if (isActive) {
            setAnnotatedImageURL(resolvedUrl);
          }
        } catch (error) {
          console.error("Failed to resolve annotated image URL:", error);
          if (isActive) {
            setAnnotatedImageURL(null);
          }
        }
        return;
      }

      if (isActive) {
        setAnnotatedImageURL(null);
      }
    };

    loadAnnotatedImageUrl();

    return () => {
      isActive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [annotatedImageSource, isAIAnalysisCompleted]);

  // Auto-save annotations when they change
  useEffect(() => {
    // Single anomaly save API is not ideal for mass auto-save on every drag.
    // Moved saving logic to handleSave.
  }, [anomalies, inspection.id, inspectionTransformerId]);

  // Load saved annotations when component mounts
  useEffect(() => {
    const loadAnnotations = async () => {
      if (inspection.id) {
        try {
          const response = await apiClient.get(`/inspections/${inspection.id}/anomalies`);
          if (response.data && response.data.data) {
            const savedAnnotations = response.data.data;
            if (savedAnnotations.length > 0) {
              // Convert from database format to UI format
              const convertedAnnotations = savedAnnotations.map(a => ({
                id: a.id,                       // numeric DB id — used for PUT/DELETE
                annotationId: a.annotationId,   // stringified DB id returned by API
                x: a.x,
                y: a.y,
                w: a.w,
                h: a.h,
                confidence: a.confidence,
                severity: a.severity,
                severityScore: a.severityScore,
                classification: a.classification,
                area: a.area,
                centroid: a.centroid,
                meanDeltaE: a.meanDeltaE,
                peakDeltaE: a.peakDeltaE,
                meanHsv: a.meanHsv,
                elongation: a.elongation,
                comment: a.comment || '',
                source: a.source,
                deleted: a.deleted === true,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
                userId: a.userId,
              }));
              setAnomalies(convertedAnnotations);
            }
          }
        } catch (error) {
          console.error('Failed to load annotations:', error);
        }
      }
    };
    
    loadAnnotations();
  }, [inspection.id]);

  // Filter out deleted anomalies for display
  const visibleAnomalies = anomalies.filter(a => !a.deleted);

  // Edit comment for anomaly
  const handleCommentChange = (id, text) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, comment: text } : a));
  };

  // Delete (mark deleted) or restore
  const handleDeleteAnomaly = (id) => {
    const anomalyToDelete = anomalies.find(a => a.id === id);
    if (!anomalyToDelete) return;

    if (anomalyToDelete.source === 'ai') {
      // For AI anomalies, a comment (reason) is required for deletion.
      if (!anomalyToDelete.comment || anomalyToDelete.comment.trim() === '') {
        alert('Please provide a reason in the "Comment" field before deleting an AI-detected anomaly.');
        return;
      }
    }
    // For both AI (with reason) and Manual anomalies, mark as deleted.
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, deleted: true } : a));
  };
  
  const handleRestoreAnomaly = (id) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, deleted: false } : a));
  };

  // --- Save handler (will also save annotations if present) ---
  const handleManualSeverityChange = (id, newSeverity) => {
    setAnomalies(prev => prev.map(a =>
        (a.id === id && a.source === 'user')
            ? { ...a, severity: newSeverity }
            : a
    ));
  };
  const handleManualClassificationChange = (id, newClassification) => {
    setAnomalies(prev => prev.map(a =>
        (a.id === id && a.source === 'user')
            ? { ...a, classification: newClassification }
            : a
    ));
  };
  const manualSeverityOptions = ["Faulty", "Potentially Faulty", "Normal"];
  const manualClassificationOptions = ["LooseJoint", "PointOverload", "FullWireOverload", "None"];

  const handleSave = async () => {
    // Persist inspection info (images & status)
    if (updateInspection) {
      await updateInspection({
        ...inspection,
        maintenanceImage,
        annotatedImage: annotatedImageSource,
        annotatedImageKey: annotatedImageSource,  // persist the S3 key for reload
        baselineWeather,
        baselineUploadDate,
        maintenanceWeather,
        maintenanceUploadDate,
        progressStatus,
        anomalies, // Save anomalies
        inspectedDate: isCompleted ? inspection.date : inspection.inspectedDate,
        status: progressStatus.thermalUpload === "Completed" && isCompleted ? "Completed" : inspection.status
      });
    }

    // Save annotations to backend
    if (anomalies && anomalies.length > 0 && inspection.id) {
      try {
        await Promise.all(
          anomalies.map(anomaly => {
            if (anomaly.deleted && anomaly.id) {
              // Delete anomaly if it's marked as deleted
              // We check if it's not a generic random id starting with 'Date.now()'
              if (!anomaly.id.toString().includes('_')) {
                 return apiClient.delete(`/anomalies/${anomaly.id}`);
              } else {
                 return Promise.resolve();
              }
            } else if (!anomaly.deleted) {
              const payload = {
                x: anomaly.x,
                y: anomaly.y,
                w: anomaly.w,
                h: anomaly.h,
                confidence: anomaly.confidence ?? null,
                severity: anomaly.severity ?? null,
                classification: anomaly.classification ?? null,
                comment: anomaly.comment || "",
                source: anomaly.source || "user",
                userId: uploader,
              };
              
              if (!anomaly.id.toString().includes('_')) {
                // If it's an existing ID from DB, PUT it to update
                return apiClient.put(`/anomalies/${anomaly.id}`, payload);
              } else {
                // If it's a new generated ID format, POST it
                return apiClient.post(`/inspections/${inspection.id}/anomalies`, payload);
              }
            }
            return Promise.resolve();
          })
        );
      } catch (error) {
        console.error('Failed to save annotations:', error);
        alert('Failed to save annotations. Please try again.');
      }
    }

    onClose();
  };

  // --- Upload handlers ---
  const handleBaselineUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const now = new Date().toLocaleString();
        setBaselineImage(reader.result);
        setBaselineUploadDate(now);
        setLocalBaselineChanged(true);
        if (updateTransformer && transformer) {
          updateTransformer({
            ...transformer,
            baselineImage: reader.result,
            baselineUploadDate: now,
            weather: baselineWeather
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  // Run AI: POST to /api/v1/inspections/{id}/analyze
  const handleRunAI = async () => {
    if (!baselineImage || !maintenanceImageURL) {
      alert("Please ensure both baseline and maintenance images are available before running AI analysis.");
      return;
    }
    setIsRunningAI(true);
    setProgressStatus(prev => ({ ...prev, aiAnalysis: "In Progress" }));

    try {
      const res = await apiClient.post(`/inspections/${inspection.id}/analyze`, {
        sliderPercent: aiThreshold
      });

      const data = res.data?.data || res.data;

      // Use the backend-generated annotated image key; fall back gracefully if upload did not succeed
      if (data.annotatedImageKey) {
        setAnnotatedImageUnavailable(false);
        setAnnotatedImageSource(data.annotatedImageKey);
      } else {
        setAnnotatedImageUnavailable(true);
        setAnnotatedImageSource(null);
      }

      // Map anomalies from the response into state for the analysis log and future manual edits/saves
      const mapped = (data.anomalies || []).map(a => ({
        id: a.id ?? `${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
        x: a.bbox ? a.bbox.x : a.x,
        y: a.bbox ? a.bbox.y : a.y,
        w: a.bbox ? a.bbox.width : a.w,
        h: a.bbox ? a.bbox.height : a.h,
        confidence: a.confidence ?? null,
        classification: a.classification ?? 'Unknown',
        severity: a.severity ?? null,
        severityScore: a.severityScore ?? null,
        area: a.area ?? null,
        centroid: a.centroid ?? null,
        meanDeltaE: a.meanDeltaE ?? null,
        peakDeltaE: a.peakDeltaE ?? null,
        meanHsv: a.meanHsv ?? null,
        elongation: a.elongation ?? null,
        comment: a.comment ?? '',
        source: 'ai',
        deleted: false
      }));
      setAnomalies(mapped);
      setProgressStatus(prev => ({ ...prev, aiAnalysis: "Completed", review: "In Progress", thermalUpload: "Completed" }));
    } catch (err) {
      console.error(err);
      alert("AI analysis failed. See console for details.");
      setProgressStatus(prev => ({ ...prev, aiAnalysis: "Failed" }));
    } finally {
      setIsRunningAI(false);
    }
  };

  // Remove all annotations (utility)
  const handleClearAnnotations = () => {
    if (!window.confirm("Clear all annotations?")) return;
    setAnomalies([]);
  };

  // ---------------- UI Render helpers ----------------
  const renderStep = (label, state) => {
    const color = state === "Completed" ? "green" : state === "In Progress" ? "orange" : state === "Failed" ? "red" : "grey";
    return (
      <div className="progress-step" key={label}>
        <div className="progress-circle" style={{ backgroundColor: color }}></div>
        <span className="progress-label">{label}</span>
        <span className="progress-status">{state}</span>
      </div>
    );
  };

  const displayImageSrc = isAIAnalysisCompleted
    ? (annotatedImageURL || maintenanceImageURL)
    : maintenanceImageURL;



  // ---------------- JSX ----------------
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2 className="modal-title">Thermal Inspection Analysis</h2>

        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>Transformer Info</h3>
            <p><strong>Number:</strong> {transformer?.number || "N/A"}</p>
            <p><strong>Pole:</strong> {transformer?.pole || "N/A"}</p>
            <p><strong>Region:</strong> {transformer?.region || "N/A"}</p>
            <p><strong>Location:</strong> {transformer?.location || "N/A"}</p>
            <p><strong>Type:</strong> {transformer?.type || "N/A"}</p>
            <p><strong>Inspector:</strong> {inspection.inspector || "N/A"}</p>
            <p><strong>Inspection Date:</strong> {inspection.date || "N/A"}</p>
          </div>

          <div className="modal-section">
            <h3>Inspection Progress</h3>
            <div className="progress-bar-container">
              {renderStep("Thermal Image Upload", progressStatus.thermalUpload)}
              {renderStep("AI Analysis", progressStatus.aiAnalysis)}
              {renderStep("Thermal Image Review", progressStatus.review)}
            </div>
          </div>
        </div>

        <div className="modal-flex-horizontal">
          <div className="modal-section">
            <h3>Baseline Image</h3>
            {baselineImageURL ? (
              <div className="image-actions">
                <span>Baseline image uploaded</span>
                <button className="icon-btn" onClick={() => setShowBaselinePreview(true)}>Preview</button>
              </div>
            ) : (
              <>
                <input type="file" id="baselineUpload" onChange={handleBaselineUpload} style={{ display: "none" }} />
                <label htmlFor="baselineUpload" className="upload-btn">Upload Baseline Image</label>
              </>
            )}
          </div>

          <div className="modal-section">
            <h3>Thermal Image</h3>
            <div style={{ marginTop: 12 }}>
              <div className="threshold-slider">
                <label htmlFor="ai-threshold">Detection Sensitivity: {Math.round(aiThreshold)}% <span style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:400}}>(higher = more sensitive, lower = less sensitive)</span></label>
                <input
                  type="range"
                  id="ai-threshold"
                  min="0" max="100" step="1"
                  value={aiThreshold}
                  onChange={e => setAiThreshold(parseFloat(e.target.value))} />
              </div>
              <button
                className="analysis-btn"
                onClick={handleRunAI}
                disabled={isRunningAI || !baselineImage || !maintenanceImageURL}
              >
                {isRunningAI ? "Running AI..." : "Run AI Analysis"}
              </button>
              <div className="ai-controls">
                <button className="clear-annotations-btn" onClick={handleClearAnnotations}>Clear Annotations</button>
              </div>
            </div>
          </div>
        </div>

        {maintenanceImageURL && (
          <div className="modal-section comparison">
            <h3 className="center-text">Thermal Image Comparison</h3>
            <div className="comparison-flex">
              <div className="image-card">
                <div className="image-card-header">
                  <h4>Baseline Image</h4>
                </div>
                <div className="image-box"><img src={baselineImageURL} alt="Baseline" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {baselineUploadDate || "N/A"}</p>
                  <p><strong>Weather:</strong> {baselineWeather}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> Baseline</p>
                </div>
              </div>

              <div className="image-card">
                <div className="image-card-header">
                  <h4>{isAIAnalysisCompleted ? "AI Annotated Maintenance Image" : "Maintenance Image"}</h4>
                </div>
                <div className="image-box" style={{ overflow: 'hidden' }}>
                  {annotatedImageUnavailable && (
                    <div className="annotated-image-warning" style={{ padding: '6px 10px', marginBottom: '6px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '4px', fontSize: '13px' }}>
                      Annotated image could not be loaded from server. Showing original maintenance image.
                    </div>
                  )}
                  <ZoomAnnotatedImage src={displayImageSrc} anomalies={[]} height={380} />
                </div>
                <div className="image-info">
                  <p><strong>Date & Time:</strong> {maintenanceUploadDate || inspection.date || "N/A"}</p>
                  <p><strong>Weather:</strong> {maintenanceWeather || "N/A"}</p>
                  <p><strong>Uploader:</strong> {uploader}</p>
                  <p><strong>Image Type:</strong> {isAIAnalysisCompleted ? 'AI Annotated Maintenance' : 'Maintenance'}</p>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Annotated AI results & editable overlays */}
        

        {/* Analysis Log */}
        {anomalies.length > 0 && (
          <div className="modal-section">
            <h3>Analysis Log</h3>
            <table className="log-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Source</th>
                  <th>Severity</th>
                  <th>Classification</th>
                  <th>Details</th>
                  <th>Comment</th>
                  <th>User/Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAnomalies.map((a, index) => (
                  <tr key={a.id} className={a.id === hoveredAnomalyId ? 'log-row-highlight' : ''}>
                    <td>{index + 1}</td>
                    <td>{a.source === 'ai' ? 'AI' : 'Manual'}</td>
                    <td>
                      {a.source === 'ai' ? (
                        <span className={`severity-badge ${a.severity?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {a.severity || 'N/A'}
                        </span>
                      ) : (
                        <select
                          value={a.severity || ''}
                          onChange={(e) => handleManualSeverityChange(a.id, e.target.value)}
                          className="log-classification-select"
                        >
                          <option value="" disabled>Select...</option>
                          {manualSeverityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      {a.source === 'ai' ? (
                        <span>{a.classification || 'N/A'}</span>
                      ) : (
                        <select
                          value={a.classification || ''}
                          onChange={(e) => handleManualClassificationChange(a.id, e.target.value)}
                          className="log-classification-select"
                        >
                          <option value="" disabled>Select...</option>
                          {manualClassificationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      <div style={{ lineHeight: '1.4' }}>
                        <div><strong>Pos:</strong> ({Math.round(a.x)}, {Math.round(a.y)})</div>
                        <div><strong>Size:</strong> {Math.round(a.w)}×{Math.round(a.h)} px</div>
                        {a.confidence != null && (
                          <div><strong>Conf:</strong> {Math.round(a.confidence * 100)}%</div>
                        )}
                        {a.severityScore != null && (
                          <div><strong>Score:</strong> {a.severityScore.toFixed(1)}</div>
                        )}
                        {a.peakDeltaE != null && (
                          <div><strong>pΔE:</strong> {a.peakDeltaE.toFixed(1)}</div>
                        )}
                        {a.meanDeltaE != null && (
                          <div><strong>mΔE:</strong> {a.meanDeltaE.toFixed(1)}</div>
                        )}
                        {a.area != null && (
                          <div><strong>Area:</strong> {a.area} px²</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <textarea
                        placeholder="Add comment..."
                        value={a.comment || ''}
                        onChange={(e) => handleCommentChange(a.id, e.target.value)}
                        className="log-comment-textarea"
                      />
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', lineHeight: '1.3' }}>
                        {a.userId && <div><strong>User:</strong> {a.userId}</div>}
                        {a.createdAt && <div><strong>Created:</strong> {new Date(a.createdAt).toLocaleString()}</div>}
                        {a.updatedAt && <div><strong>Updated:</strong> {new Date(a.updatedAt).toLocaleString()}</div>}
                      </div>
                    </td>
                    <td>
                      <button className="danger-btn" onClick={() => handleDeleteAnomaly(a.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showBaselinePreview && baselineImageURL && (
          <div className="modal-overlay">
            <div className="modal-card preview-card">
              <h3>Baseline Image Preview</h3>
              <img src={baselineImageURL} alt="Baseline Preview" className="preview-image" />
              <button onClick={() => setShowBaselinePreview(false)} className="inspection-cancel-btn">Close</button>
            </div>
          </div>
        )}

        <div className="inspection-modal-buttons" style={{ marginTop: 12 }}>
          <button className="generate-record-btn" onClick={() => setShowRecordForm(true)} disabled={!isAIAnalysisCompleted || anomalies.length === 0} title={!isAIAnalysisCompleted ? 'Run AI analysis first to generate a maintenance record' : (anomalies.length === 0 ? 'No anomalies detected yet' : 'Generate a maintenance record')}>
            Generate Maintenance Record
          </button>
          {progressStatus.aiAnalysis === "Completed" && (
            <button className="inspection-complete-btn" onClick={handleComplete}>Complete Reviewing</button>
          )}
          <button onClick={handleSave} className="inspection-save-btn">Save</button>
          <button onClick={onClose} className="inspection-cancel-btn">Close</button>
        </div>
      </div>
      {showRecordForm && (
        <MaintenanceRecordForm
          transformer={transformer}
          inspection={inspection}
          anomalies={anomalies}
          annotatedImage={displayImageSrc}
          onSaved={() => { /* optional post-save hook */ }}
          onClose={() => setShowRecordForm(false)}
        />
      )}
    </div>
  );
}
