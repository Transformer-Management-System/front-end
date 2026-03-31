import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Tabs from "./components/Tabs";
import TransformerList from "./components/TransformerList";
import TransformerModal from "./components/TransformerModal";
import InspectionList from "./components/InspectionList";
import InspectionModal from "./components/InspectionModal";
import InspectionViewModal from "./components/InspectionViewModal";
import TransformerInspectionsPage from "./components/TransformerInspectionsPage";
import SettingsPage from "./components/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import apiClient from "./api/axiosConfig";
import {
  createInspectionWithOptionalImage,
  saveTransformerWithOptionalImage,
} from "./api/maintenanceApi";

import "./App.css";

function App() {
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState("page1");
  const [activeTab, setActiveTab] = useState("details");

  const [transformers, setTransformers] = useState([]);
  const [filteredTransformers, setFilteredTransformers] = useState([]);
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [showTransformerModal, setShowTransformerModal] = useState(false);
  const [transformerForm, setTransformerForm] = useState({
    id: null,
    number: "",
    pole: "",
    region: "",
    type: "Bulk",
    baselineImage: null,
    baselineUploadDate: null,
    weather: "",
    location: "",
  });
  const [isSubmittingTransformer, setIsSubmittingTransformer] = useState(false);
  const [searchFieldDetails, setSearchFieldDetails] = useState("number");
  const [searchQueryDetails, setSearchQueryDetails] = useState("");

  const [inspections, setInspections] = useState([]);
  const [filteredInspections, setFilteredInspections] = useState([]);
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [showViewInspectionModal, setShowViewInspectionModal] = useState(false);
  const [viewInspectionData, setViewInspectionData] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({
    transformer: "",
    date: "",
    inspector: "",
    notes: "",
    inspectionImage: null,
    maintenanceUploadDate: null,
    maintenanceWeather: "Sunny",
  });
  const [isSubmittingInspection, setIsSubmittingInspection] = useState(false);
  const [searchFieldInspection, setSearchFieldInspection] = useState("");
  const [searchQueryInspection, setSearchQueryInspection] = useState("");

  const [showTransformerInspectionsPage, setShowTransformerInspectionsPage] = useState(false);
  const [selectedTransformerForPage, setSelectedTransformerForPage] = useState(null);

  const getErrorMessage = (error, fallbackMessage) => {
    return (
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage
    );
  };

  // --- Load all data from backend on startup ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transformersRes, inspectionsRes] = await Promise.all([
          apiClient.get('/transformers'),
          apiClient.get('/inspections'),
        ]);
        setTransformers(transformersRes.data?.data || transformersRes.data);
        setInspections(inspectionsRes.data?.data || inspectionsRes.data);
      } catch (error) {
        console.error("Failed to fetch data from backend:", error);
        alert("Could not connect to the backend. Please ensure it is running.");
      }
    };
    fetchData();
  }, []);


  // --- Filtering ---
  useEffect(() => {
    setFilteredTransformers(
      transformers.filter(t => {
        if (!searchQueryDetails) return true;
        const value = t[searchFieldDetails]?.toString().toLowerCase() || "";
        return value.includes(searchQueryDetails.toLowerCase());
      })
    );
  }, [searchQueryDetails, searchFieldDetails, transformers]);

  useEffect(() => {
    setFilteredInspections(
      inspections.filter(i => {
        if (!searchQueryInspection) return true;
        const value =
          searchFieldInspection === "transformer"
            ? transformers.find(t => t.id === i.transformer)?.number?.toString().toLowerCase() || ""
            : i[searchFieldInspection]?.toString().toLowerCase() || "";
        return value.includes(searchQueryInspection.toLowerCase());
      })
    );
  }, [searchQueryInspection, searchFieldInspection, inspections, transformers]);

  // --- Transformer handlers ---
  const handleTransformerChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "baselineImage" && files?.[0]) {
      setTransformerForm(prev => ({
        ...prev,
        baselineImage: files[0],
        baselineUploadDate: new Date().toLocaleString(),
      }));
      return;
    }

    setTransformerForm(prev => ({ ...prev, [name]: value }));
  };

  const openTransformerModal = (t = null) => {
    if (t) setTransformerForm({ ...t });
    else setTransformerForm({ id: null, number: "", pole: "", region: "", type: "Bulk", baselineImage: null, baselineUploadDate: null, weather: "", location: "" });
    setShowTransformerModal(true);
  };

  const handleAddTransformer = async () => {
    setIsSubmittingTransformer(true);
    try {
      const response = await saveTransformerWithOptionalImage(transformerForm);
      const savedTransformer = response.data?.data || response.data;
      setTransformers(prev => {
        const exists = prev.some(t => t.id === savedTransformer.id);
        if (exists) {
          return prev.map(t => t.id === savedTransformer.id ? savedTransformer : t);
        } else {
          return [...prev, savedTransformer];
        }
      });
      setShowTransformerModal(false);
    } catch (error) {
      console.error("Failed to save transformer:", error);
      alert(getErrorMessage(error, "Failed to save transformer."));
    } finally {
      setIsSubmittingTransformer(false);
    }
  };

  const handleDeleteTransformer = async (transformerId) => {
    try {
      await apiClient.delete(`/transformers/${transformerId}`);
      setTransformers(prev => prev.filter(t => t.id !== transformerId));
    } catch (error) {
      console.error("Failed to delete transformer:", error);
    }
  };

  // --- Inspection handlers ---
  const handleInspectionChange = (e) => {
    const { name, value, files } = e.target;
    if (files?.[0]) {
      setInspectionForm(prev => ({ ...prev, [name]: files[0] }));
      return;
    }

    setInspectionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleInspection = async () => {
    if (!inspectionForm.transformer || !inspectionForm.date || !inspectionForm.inspector || !inspectionForm.inspectionImage) {
      alert("Please select a transformer, fill in the Date and Inspector fields, and choose an inspection image.");
      return;
    }

    const transformerId = Number.parseInt(inspectionForm.transformer, 10);
    setIsSubmittingInspection(true);
    try {
      const response = await createInspectionWithOptionalImage(
        {
          ...inspectionForm,
          progressStatus: { thermalUpload: "Pending", aiAnalysis: "Pending", review: "Pending" },
        },
        transformerId,
      );
      const savedInspection = response.data?.data || response.data;
      setInspections(prev => [...prev, savedInspection]);
      setShowAddInspectionModal(false);
      setInspectionForm({
        transformer: "",
        date: "",
        inspector: "",
        notes: "",
        inspectionImage: null,
        maintenanceUploadDate: null,
        maintenanceWeather: "Sunny",
      });
    } catch (error) {
      console.error("Failed to schedule inspection:", error);
      alert(getErrorMessage(error, "Failed to schedule inspection."));
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  const handleDeleteInspection = async (inspectionId) => {
    try {
      await apiClient.delete(`/inspections/${inspectionId}`);
      setInspections(prev => prev.filter(i => i.id !== inspectionId));
    } catch (error) {
      console.error("Failed to delete inspection:", error);
    }
  };

  const handleViewInspection = (inspection) => { setViewInspectionData(inspection); setShowViewInspectionModal(true); };
  const handleUpdateInspection = async (updatedInspection) => {
    await apiClient.put(`/inspections/${updatedInspection.id}`, updatedInspection);
    setInspections(inspections.map(i => (i.id === updatedInspection.id ? updatedInspection : i)));
  };
  const handleUpdateTransformer = async (updatedTransformer) => {
    await apiClient.post('/transformers', updatedTransformer);
    setTransformers(prev => prev.map(t => (t.id === updatedTransformer.id ? updatedTransformer : t)));
  };

  // --- Full-page inspection handlers ---
  const handleOpenTransformerInspectionsPage = (transformer) => { setSelectedTransformerForPage(transformer); setShowTransformerInspectionsPage(true); };
  const handleBackToMain = () => { setSelectedTransformerForPage(null); setShowTransformerInspectionsPage(false); };
  
  return (
    <ProtectedRoute>
    <div className="app">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={logout} />
      <div className="content">
        {activePage === "page2" ? (
          <SettingsPage />
        ) : showTransformerInspectionsPage && selectedTransformerForPage ? (
          <TransformerInspectionsPage
            transformer={selectedTransformerForPage}
            inspections={inspections.filter(i => i.transformer === selectedTransformerForPage.id)}
            setInspections={setInspections}
            setFilteredInspections={setFilteredInspections}
            transformers={transformers}
            onBack={handleBackToMain}
            onViewInspection={handleViewInspection}
            deleteInspection={handleDeleteInspection}
          />
        ) : (
          <>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === "details" && (
              <TransformerList
                transformers={transformers}
                filteredTransformers={filteredTransformers}
                setTransformers={setTransformers}
                deleteTransformer={handleDeleteTransformer}
                selectedTransformer={selectedTransformer}
                setSelectedTransformer={setSelectedTransformer}
                searchFieldDetails={searchFieldDetails}
                setSearchFieldDetails={setSearchFieldDetails}
                searchQueryDetails={searchQueryDetails}
                setSearchQueryDetails={setSearchQueryDetails}
                setShowModal={openTransformerModal}
                onViewInspections={handleOpenTransformerInspectionsPage}
              />
            )}
            {activeTab === "inspection" && (
              <InspectionList
                filteredInspections={filteredInspections}
                transformers={transformers}
                inspections={inspections}
                setInspections={setInspections}
                setFilteredInspections={setFilteredInspections}
                searchFieldInspection={searchFieldInspection}
                setSearchFieldInspection={setSearchFieldInspection}
                searchQueryInspection={searchQueryInspection}
                setSearchQueryInspection={setSearchQueryInspection}
                openAddInspectionModal={() => setShowAddInspectionModal(true)}
                onViewInspections={handleOpenTransformerInspectionsPage}
                deleteInspection={handleDeleteInspection}
              />
            )}
          </>
        )}
      </div>

      {showTransformerModal && (
        <TransformerModal
          formData={transformerForm}
          handleInputChange={handleTransformerChange}
          handleAddTransformer={handleAddTransformer}
          isSubmitting={isSubmittingTransformer}
          onClose={() => setShowTransformerModal(false)}
        />
      )}

      {showAddInspectionModal && !showTransformerInspectionsPage && (
        <InspectionModal
          transformers={transformers}
          inspectionForm={inspectionForm}
          handleInspectionChange={handleInspectionChange}
          handleScheduleInspection={handleScheduleInspection}
          isSubmitting={isSubmittingInspection}
          onClose={() => setShowAddInspectionModal(false)}
          disableTransformerSelect={false}
        />
      )}

      {showViewInspectionModal && viewInspectionData && (
        <InspectionViewModal
          inspection={viewInspectionData}
          transformers={transformers}
          onClose={() => setShowViewInspectionModal(false)}
          updateInspection={handleUpdateInspection}
          updateTransformer={handleUpdateTransformer}
        />
      )}
    </div>
    </ProtectedRoute>
  );
}

export default App
