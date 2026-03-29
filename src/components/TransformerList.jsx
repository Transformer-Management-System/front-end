import { useEffect, useState } from "react";
import placeholderImage from "../assets/transformer.jpg";
import "../styles/TransformerList.css";

export default function TransformerList({
  filteredTransformers = [],
  selectedTransformer,
  setSelectedTransformer,
  searchFieldDetails,
  setSearchFieldDetails,
  searchQueryDetails,
  setSearchQueryDetails,
  setShowModal,
  deleteTransformer,
}) {
  const [imageURL, setImageURL] = useState(null);

  useEffect(() => {
    if (selectedTransformer?.baselineImage) {
      const file = selectedTransformer.baselineImage;
      if (typeof file === "string") {
        setImageURL(file);
      } else {
        const url = URL.createObjectURL(file);
        setImageURL(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setImageURL(null);
    }
  }, [selectedTransformer]);

  const handleEdit = (transformer) => {
    setSelectedTransformer(transformer);
    setShowModal(transformer);
  };

  const handleDelete = (transformer) => {
    if (window.confirm("Are you sure you want to delete this transformer?")) {
      if (selectedTransformer?.id === transformer.id) {
        setSelectedTransformer(null);
      }
      deleteTransformer(transformer.id);
    }
  };

  return (
    <div className="transformer-container">
      <h1 className="page-title">Transformers</h1>

      <div className="transformer-card">
        <div className="transformer-toolbar">
          <button className="add-transformer-btn" onClick={() => setShowModal()}>
            + Add Transformer
          </button>

          <div className="search-bar transformer-search">
            <select
              value={searchFieldDetails}
              name="searchFieldDetails"
              onChange={(e) => setSearchFieldDetails(e.target.value)}
              className="search-select"
            >
              <option value="number">Transformer #</option>
              <option value="pole">Pole #</option>
              <option value="region">Region</option>
              <option value="type">Type</option>
            </select>
            <input
              type="text"
              placeholder="Search transformers"
              name="searchQueryDetails"
              value={searchQueryDetails}
              onChange={(e) => setSearchQueryDetails(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {selectedTransformer && (
          <div className="selected-transformer">
            <div className="selected-info">
              {["number", "pole", "region", "type"].map((field) => (
                <div key={field} className="info-card">
                  <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>
                  <div>{selectedTransformer[field]}</div>
                </div>
              ))}

              <button className="danger-btn" onClick={() => setSelectedTransformer(null)}>
                Close
              </button>
            </div>

            <div className="selected-image-container">
              <strong className="image-title">Baseline Image</strong>
              <img src={imageURL || placeholderImage} alt="Transformer" className="selected-image" />
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table className="transformer-table">
            <thead>
              <tr className="table-header">
                <th>Transformer #</th>
                <th>Pole #</th>
                <th>Region</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransformers.map((transformer) => (
                <tr key={transformer.id}>
                  <td>{transformer.number}</td>
                  <td>{transformer.pole}</td>
                  <td>{transformer.region}</td>
                  <td>{transformer.type}</td>
                  <td className="transformer-actions">
                    <button className="view-btn" onClick={() => setSelectedTransformer(transformer)}>View</button>
                    <button className="edit-btn" onClick={() => handleEdit(transformer)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(transformer)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
