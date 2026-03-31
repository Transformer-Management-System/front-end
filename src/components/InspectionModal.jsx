import "../styles/InspectionModal.css";

export default function InspectionModal({
  transformers,
  inspectionForm,
  handleInspectionChange,
  handleScheduleInspection,
  isSubmitting = false,
  onClose,
  disableTransformerSelect = false, // <-- new prop to control dropdown
}) {
  const hasInspectionImage =
    inspectionForm.inspectionImage instanceof File ||
    Boolean(inspectionForm.inspection_image_key) ||
    Boolean(inspectionForm.inspectionImageKey);

  const isFormValid =
    Boolean(inspectionForm.transformer) &&
    Boolean(inspectionForm.date) &&
    Boolean(inspectionForm.inspector) &&
    hasInspectionImage;

  let inspectionImageStatus = "No file selected";
  if (inspectionForm.inspectionImage instanceof File) {
    inspectionImageStatus = inspectionForm.inspectionImage.name;
  } else if (hasInspectionImage) {
    inspectionImageStatus = "Image selected";
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isSubmitting) {
      handleScheduleInspection();
    }
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
                disabled={disableTransformerSelect || isSubmitting} // <-- controlled by prop
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                onChange={handleInspectionChange}
              />
            </div>

            <div className="inspection-field-group inspection-field-span-two">
              <label htmlFor="inspection-image">Inspection Image</label>
              <div className="inspection-file-upload">
                <input
                  id="inspection-image"
                  className="inspection-file-input"
                  type="file"
                  name="inspectionImage"
                  accept="image/*"
                  disabled={isSubmitting}
                  onChange={handleInspectionChange}
                />
                <label htmlFor="inspection-image" className="inspection-file-button">
                  {hasInspectionImage ? "Replace File" : "Browse Files"}
                </label>
                <span className="inspection-file-name">{inspectionImageStatus}</span>
              </div>
            </div>

            <div className="inspection-field-group inspection-field-span-two">
              <label htmlFor="inspection-notes">Notes</label>
              <textarea
                id="inspection-notes"
                name="notes"
                placeholder="Optional maintenance notes"
                value={inspectionForm.notes}
                disabled={isSubmitting}
                onChange={handleInspectionChange}
              />
            </div>
          </div>

          {!isFormValid && (
            <p className="inspection-modal-error">Please select a transformer, date, inspector, and inspection image.</p>
          )}

          <div className="modal-buttons inspection-modal-actions">
            <button type="button" className="inspection-cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="inspection-save-btn" disabled={!isFormValid || isSubmitting}>
              <span className="inspection-save-label">
                {isSubmitting && <span className="inspection-button-spinner" aria-hidden="true" />}
                {isSubmitting ? "Saving..." : "Add Inspection"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
