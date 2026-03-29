import "../styles/Tabs.css";

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="tabs-container">
      <div className="tabs-button-row" role="tablist" aria-label="Dashboard sections">
        <button
          onClick={() => setActiveTab("details")}
          role="tab"
          aria-selected={activeTab === "details"}
          className={`tab-button ${activeTab === "details" ? "active" : ""}`}
        >
          Transformers
        </button>
        <button
          onClick={() => setActiveTab("inspection")}
          role="tab"
          aria-selected={activeTab === "inspection"}
          className={`tab-button ${activeTab === "inspection" ? "active" : ""}`}
        >
          Inspection
        </button>
      </div>
    </div>
  );
}
