import { useState } from "react";
import InspectionModal from "./InspectionModal";
import RecordHistory from "./RecordHistory";
import { createInspectionWithOptionalImage } from "../api/maintenanceApi";
import "../styles/TransformerInspectionsPage.css";

export default function TransformerInspectionsPage({
  transformer,
  inspections = [],
  transformers = [],
  setInspections,
  setFilteredInspections,
  onBack,
  onViewInspection,
  deleteInspection
}) {
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [newInspectionForm, setNewInspectionForm] = useState({
    transformer: transformer.id, // preselect current transformer
    date: "",
    inspector: "",
    notes: "",
    inspectionImage: null,
    maintenanceWeather: "Sunny",
  });
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);
  const [showRecordHistoryModal, setShowRecordHistoryModal] = useState(false);
  const [recordHistoryInspection, setRecordHistoryInspection] = useState(null);

  const getErrorMessage = (error, fallbackMessage) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage
    );
  };

  // --- Helper to get current status based on progress ---
  const getInspectionStatus = (inspection) => {
    const progress = inspection.progressStatus;
    if (progress) {
      const { thermalUpload, aiAnalysis, review } = progress;
      if (aiAnalysis === "Completed" && review === "Completed") return "Completed";
      if (thermalUpload === "Completed") return "In Progress";
    } else if (inspection.maintenanceImage) {
      // fallback if progressStatus is not defined
      return "In Progress";
    }
    return "Pending";
  };

  const handleDeleteInspection = (id) => {
    if (window.confirm("Are you sure you want to delete this inspection?")) {
      deleteInspection(id);
    }
  };

  const handleAddInspection = async () => {
    if (!newInspectionForm.date || !newInspectionForm.inspector || !newInspectionForm.inspectionImage) {
      alert("Please fill in Date, Inspector, and choose an inspection image.");
      return;
    }

    setIsSubmittingInspection(true);
    const inspectionPayload = {
      ...newInspectionForm,
      transformer: transformer.id,
      progressStatus: {
        thermalUpload: "Pending",
        aiAnalysis: "Pending",
        review: "Pending",
      },
    };

    try {
      const response = await createInspectionWithOptionalImage(
        inspectionPayload,
        transformer.id,
      );
      const savedInspection = response.data?.data || response.data;

      setInspections(prev => [...prev, savedInspection]);
      setFilteredInspections(prev => [...prev, savedInspection]);
      setShowAddInspectionModal(false);
      setNewInspectionForm({
        transformer: transformer.id,
        date: "",
        inspector: "",
        notes: "",
        inspectionImage: null,
        maintenanceWeather: "Sunny",
      });
    } catch (err) {
      console.error("Error saving inspection:", err);
      alert(getErrorMessage(err, "Failed to save inspection to server."));
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  const generateInspectionNumber = (transformerNumber, index) => {
    return `${transformerNumber}-INSP${index + 1}`;
  };

  // --- Update an inspection after viewing/modifying in modal ---
  const handleUpdateInspection = (updatedInspection) => {
    setInspections(prev => prev.map(i => i.id === updatedInspection.id ? updatedInspection : i));
    setFilteredInspections(prev => prev.map(i => i.id === updatedInspection.id ? updatedInspection : i));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          Inspections for {transformer.number}
        </h2>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 1px 3px rgba(15,23,42,0.09)', padding: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <button
            className="add-inspection-btn"
            onClick={() => setShowAddInspectionModal(true)}
          >
            + Add Inspection
          </button>
        </div>

      <table className="inspection-table">
        <thead>
          <tr>
            <th>Inspection No</th>
            <th>Maintenance Date</th>
            <th>Maintenance Info</th>
            <th>Status</th>
            <th>Actions</th>
            <th>Records</th>
          </tr>
        </thead>
        <tbody>
          {inspections.length > 0 ? (
            inspections.map((i, index) => (
              <tr key={i.id}>
                <td>{generateInspectionNumber(transformer.number, index)}</td>
                <td>{i.date}</td>
                <td>{i.notes}</td>
                <td>
                  <span className={`status-label ${getInspectionStatus(i).toLowerCase().replace(" ", "-")}`}>
                    {getInspectionStatus(i)}
                  </span>
                </td>
                <td>
                  <button
                    className="inspection-btn view-btn"
                    onClick={() => onViewInspection && onViewInspection(i, handleUpdateInspection)}
                  >
                    View
                  </button>
                  <button
                    className="inspection-btn delete-btn"
                    onClick={() => handleDeleteInspection(i.id)}
                  >
                    Delete
                  </button>
                </td>
                <td>
                  <button
                    className="inspection-btn view-btn"
                    title="View maintenance records for this inspection"
                    onClick={() => { setRecordHistoryInspection(i); setShowRecordHistoryModal(true); }}
                  >
                    Records
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                No inspections found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {showAddInspectionModal && (
        <InspectionModal
          transformers={transformers}
          inspectionForm={newInspectionForm}
          handleInspectionChange={(e) => {
            const { name, value, files } = e.target;
            setNewInspectionForm(prev => ({
              ...prev,
              [name]: files?.[0] || value,
            }));
          }}
          handleScheduleInspection={handleAddInspection}
          isSubmitting={isSubmittingInspection}
          onClose={() => setShowAddInspectionModal(false)}
          disableTransformerSelect={true}
        />
      )}

      {showRecordHistoryModal && recordHistoryInspection && (
        <RecordHistory
          transformer={transformer}
          inspection={recordHistoryInspection}
          onClose={() => { setShowRecordHistoryModal(false); setRecordHistoryInspection(null); }}
        />
      )}
    </div>
  );
}
