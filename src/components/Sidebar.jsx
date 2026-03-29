import corefourLogo from "../assets/corefour.jpg";
import "../styles/Sidebar.css"

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={corefourLogo} alt="CoreFour Logo" />
        <h2>CoreFour</h2>
      </div>

      <button
        className={activePage === "page1" ? "active" : ""}
        onClick={() => setActivePage("page1")}
      >
        Transformers
      </button>
      <button
        className={activePage === "page2" ? "active" : ""}
        onClick={() => setActivePage("page2")}
      >
        Settings
      </button>
    </div>
  );
}
