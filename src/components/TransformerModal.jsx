import "../styles/TransformerModal.css";

export default function TransformerModal({
  formData,
  handleInputChange,
  handleAddTransformer,
  isSubmitting = false,
  onClose,
}) {
  if (!formData) return null;

  const isFormValid =
    formData.number &&
    formData.pole &&
    formData.region &&
    formData.type &&
    (formData.id ? true : formData.baselineImage) && // baselineImage is only required for new transformers
    formData.weather &&
    formData.location;

  const isEditing = formData.id !== null;
  let baselineStatus = "No file selected";
  if (formData.baselineImage instanceof File) {
    baselineStatus = formData.baselineImage.name;
  } else if (formData.baselineImage) {
    baselineStatus = isEditing ? "Baseline image uploaded" : "Image selected";
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isFormValid && !isSubmitting) {
      handleAddTransformer();
    }
  };

  return (
    <div className="modal transformer-modal-overlay">
      <div className="modal-content transformer-modal-card">
        <h2>{isEditing ? "Edit Transformer" : "Add Transformer"}</h2>

        <form className="transformer-modal-form" onSubmit={handleSubmit}>
          <div className="transformer-modal-grid">
            <div className="transformer-field-group">
              <label htmlFor="transformer-number">Transformer Number</label>
              <input
                id="transformer-number"
                name="number"
                placeholder="Enter transformer number"
                value={formData.number}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </div>

            <div className="transformer-field-group">
              <label htmlFor="transformer-region">Region</label>
              <input
                id="transformer-region"
                name="region"
                placeholder="Enter region"
                value={formData.region}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </div>

            <div className="transformer-field-group">
              <label htmlFor="transformer-pole">Pole Number</label>
              <input
                id="transformer-pole"
                name="pole"
                placeholder="Enter pole number"
                value={formData.pole}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </div>

            <div className="transformer-field-group">
              <label htmlFor="transformer-type">Type</label>
              <select
                id="transformer-type"
                name="type"
                value={formData.type}
                disabled={isSubmitting}
                onChange={handleInputChange}
              >
                <option value="Bulk">Bulk</option>
                <option value="Distribution">Distribution</option>
              </select>
            </div>

            <div className="transformer-field-group">
              <label htmlFor="transformer-baseline-image">Baseline Image</label>
              <div className="transformer-file-upload">
                <input
                  id="transformer-baseline-image"
                  className="transformer-file-input"
                  type="file"
                  name="baselineImage"
                  accept="image/*"
                  disabled={isSubmitting}
                  onChange={handleInputChange}
                />
                <label htmlFor="transformer-baseline-image" className="transformer-file-button">
                  {formData.baselineImage ? "Replace File" : "Browse Files"}
                </label>
                <span className="transformer-file-name">{baselineStatus}</span>
              </div>
            </div>

            <div className="transformer-field-group">
              <label htmlFor="transformer-weather">Weather</label>
              <select
                id="transformer-weather"
                name="weather"
                value={formData.weather || ""}
                disabled={isSubmitting}
                onChange={handleInputChange}
              >
                <option value="">Select Weather</option>
                <option value="Sunny">Sunny</option>
                <option value="Rainy">Rainy</option>
                <option value="Cloudy">Cloudy</option>
              </select>
            </div>

            <div className="transformer-field-group transformer-field-span-two">
              <label htmlFor="transformer-location">Location</label>
              <input
                id="transformer-location"
                type="text"
                name="location"
                placeholder="Enter transformer location"
                value={formData.location || ""}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {!isFormValid && (
            <p className="transformer-modal-error">Please fill in all required fields.</p>
          )}

          <div className="modal-buttons transformer-modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="save-btn" type="submit" disabled={!isFormValid || isSubmitting}>
              <span className="transformer-save-label">
                {isSubmitting && <span className="transformer-button-spinner" aria-hidden="true" />}
                {isSubmitting ? "Saving..." : "Save"}
              </span>
            </button>
          </div>
        </form>

        {isEditing && formData.baselineImage && (
          <p className="transformer-modal-note">Uploading a new baseline image will replace the existing one.</p>
        )}
      </div>
    </div>
  );
}
