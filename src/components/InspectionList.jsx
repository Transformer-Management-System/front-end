import "../App.css";

export default function InspectionList({
  transformers = [],
  inspections = [],
  setInspections,
  filteredInspections,
  setFilteredInspections,
  searchFieldInspection,
  setSearchFieldInspection,
  searchQueryInspection,
  setSearchQueryInspection,
  openAddInspectionModal,
  onViewInspections,
  deleteInspection,
}) {

  const handleDeleteInspection = (inspectionId) => {
    deleteInspection(inspectionId);
  };

  const handleViewTransformerInspections = (transformer) => {
    if (typeof onViewInspections === "function") {
      onViewInspections(transformer);
    }
  };

  const transformerRows = transformers.map((t) => {
    const tInspections = inspections.filter(i => Number(i.transformerId ?? i.transformer) === Number(t.id));

    // Prefer latestInspection attached to transformer (from backend) for persisted data
    let latestInspectedDate;
    let latestMaintenanceDate;
    if (t.latestInspection) {
      latestInspectedDate = t.latestInspection.inspectedDate || "-";
      latestMaintenanceDate = t.latestInspection.date || "-";
    } else {
      // Fallback to computing from local inspections list
      const completed = tInspections.filter(i => i.inspectedDate);
      const latestCompleted = completed.reduce((latest, curr) =>
        !latest || new Date(curr.inspectedDate) > new Date(latest.inspectedDate) ? curr : latest
      , null);
      latestInspectedDate = latestCompleted?.inspectedDate || "-";

      const pending = tInspections.filter(i => !i.inspectedDate);
      const latestPending = pending.reduce((latest, curr) =>
        !latest || new Date(curr.date) > new Date(latest.date) ? curr : latest
      , null);
      latestMaintenanceDate = latestPending?.date || "-";
    }


    return {
      ...t,
      inspections: tInspections,
      latestMaintenanceDate,
      latestInspectedDate
    };
  });

  return (
    <div className="inspection-list-container">
      <h1 className="page-title">All Inspections</h1>

      <div className="inspection-list-card">
        <div className="inspection-list-header">
          <button className="schedule-btn" onClick={openAddInspectionModal}>
            + Schedule Inspection
          </button>

          <div className="inspection-search-row">
            <select
              className="inspection-search-select"
              value={searchFieldInspection}
              name="searchFieldInspection"
              onChange={(e) => setSearchFieldInspection(e.target.value)}
            >
              <option value="">Select Field</option>
              <option value="transformer">Transformer Number</option>
              <option value="date">Inspection Date</option>
              <option value="inspector">Inspector Name</option>
              <option value="notes">Notes</option>
            </select>
            <input
              className="inspection-search-input"
              type="text"
              placeholder="Search inspections"
              name="searchQueryInspection"
              value={searchQueryInspection}
              onChange={(e) => setSearchQueryInspection(e.target.value)}
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="inspection-summary-table">
            <thead>
              <tr>
                <th>Transformer</th>
                <th>Maintenance Date</th>
                <th>Last Inspected Date</th>
                <th>Total Inspections</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transformerRows.map((t) => (
                <tr key={t.id || t.number}>
                  <td>{t.number}</td>
                  <td>{t.latestMaintenanceDate}</td>
                  <td>{t.latestInspectedDate}</td>
                  <td>{t.inspections.length}</td>
                  <td>
                    <div className="inspection-actions">
                      <button
                        className="inspection-btn view-btn"
                        onClick={() => handleViewTransformerInspections(t)}
                      >
                        View
                      </button>
                      <button
                        className="inspection-btn delete-btn"
                        onClick={() => t.inspections.forEach(i => handleDeleteInspection(i.id))}
                      >
                        Delete All
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transformerRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-empty">
                    No transformers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
