import "../styles/InspectionModal.css";

export default function InspectionModal({
  transformers,
  inspectionForm,
  handleInspectionChange,
  handleScheduleInspection,
  onClose,
  disableTransformerSelect = false, // <-- new prop to control dropdown
}) {
  const isFormValid =
    Boolean(inspectionForm.transformer) &&
    Boolean(inspectionForm.date) &&
    Boolean(inspectionForm.inspector);

  const handleSubmit = (event) => {
    event.preventDefault();
    handleScheduleInspection();
  };

  return (
    <div className="modal inspection-modal-overlay">
      <div className="modal-content inspection-modal-card">
        <h2>Schedule Inspection</h2>

        <form className="inspection-modal-form" onSubmit={handleSubmit}>
          <div className="inspection-modal-grid">
            <div className="inspection-field-group">
              <label htmlFor="inspection-transformer">Transformer</label>
              <select
                id="inspection-transformer"
                name="transformer"
                value={inspectionForm.transformer}
                onChange={handleInspectionChange}
                disabled={disableTransformerSelect} // <-- controlled by prop
              >
                <option value="">Select Transformer</option>
                {transformers.map((transformer) => (
                  <option key={transformer.id} value={transformer.id}>{transformer.number}</option>
                ))}
              </select>
            </div>

            <div className="inspection-field-group">
              <label htmlFor="inspection-date">Date</label>
              <input
                id="inspection-date"
                type="date"
                name="date"
                value={inspectionForm.date}
                onChange={handleInspectionChange}
              />
            </div>

            <div className="inspection-field-group">
              <label htmlFor="inspection-inspector">Inspector</label>
              <input
                id="inspection-inspector"
                type="text"
                name="inspector"
                placeholder="Enter inspector name"
                value={inspectionForm.inspector}
                onChange={handleInspectionChange}
              />
            </div>

            <div className="inspection-field-group inspection-field-span-two">
              <label htmlFor="inspection-notes">Notes</label>
              <textarea
                id="inspection-notes"
                name="notes"
                placeholder="Optional maintenance notes"
                value={inspectionForm.notes}
                onChange={handleInspectionChange}
              />
            </div>
          </div>

          {!isFormValid && (
            <p className="inspection-modal-error">Please select a transformer, date, and inspector.</p>
          )}

          <div className="modal-buttons inspection-modal-actions">
            <button type="button" className="inspection-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="inspection-save-btn" disabled={!isFormValid}>
              Add Inspection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
