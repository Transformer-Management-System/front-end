import apiClient from "./axiosConfig";
import { getExistingObjectKey, uploadImageAndGetObjectKey } from "./imageUpload";

const DEFAULT_UI_PROGRESS_STATUS = {
  thermalUpload: "Pending",
  aiAnalysis: "Pending",
  review: "Pending",
};

const IN_PROGRESS_UI_PROGRESS_STATUS = {
  thermalUpload: "Completed",
  aiAnalysis: "In Progress",
  review: "In Progress",
};

const COMPLETED_UI_PROGRESS_STATUS = {
  thermalUpload: "Completed",
  aiAnalysis: "Completed",
  review: "Completed",
};

const serializeInspectionAnomalies = (anomalies) => {
  if (typeof anomalies === "string") {
    return anomalies;
  }

  if (Array.isArray(anomalies)) {
    return JSON.stringify(anomalies);
  }

  return JSON.stringify([]);
};

const normalizeInspectionAnomalies = (anomalies) => {
  if (Array.isArray(anomalies)) {
    return anomalies;
  }

  if (typeof anomalies === "string") {
    try {
      const parsedAnomalies = JSON.parse(anomalies);
      return Array.isArray(parsedAnomalies) ? parsedAnomalies : [];
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeInspectionProgressStatus = (inspection) => {
  const progressStatus = inspection?.progressStatus;

  if (progressStatus && typeof progressStatus === "object") {
    return progressStatus;
  }

  if (typeof progressStatus === "string") {
    const normalizedStatus = progressStatus.trim().toUpperCase();

    if (normalizedStatus === "DONE" || normalizedStatus === "COMPLETED") {
      return COMPLETED_UI_PROGRESS_STATUS;
    }

    if (normalizedStatus === "IN_PROGRESS" || normalizedStatus === "IN PROGRESS") {
      return IN_PROGRESS_UI_PROGRESS_STATUS;
    }
  }

  if (inspection?.maintenanceImage) {
    return IN_PROGRESS_UI_PROGRESS_STATUS;
  }

  return DEFAULT_UI_PROGRESS_STATUS;
};

const normalizeInspectionForUi = (inspection) => {
  if (!inspection || typeof inspection !== "object") {
    return inspection;
  }

  return {
    ...inspection,
    progressStatus: normalizeInspectionProgressStatus(inspection),
    anomalies: normalizeInspectionAnomalies(inspection.anomalies),
  };
};

const buildInspectionPayload = ({ inspectionForm, maintenanceImage }) => {
  const inspectionDate = inspectionForm?.date || "";

  return {
    date: inspectionDate,
    inspectedDate: inspectionDate || undefined,
    inspector: inspectionForm?.inspector,
    notes: inspectionForm?.notes || "",
    status: inspectionForm?.status || "PENDING",
    maintenanceUploadDate: inspectionForm?.maintenanceUploadDate || inspectionDate || undefined,
    maintenanceWeather: inspectionForm?.maintenanceWeather || "Sunny",
    maintenanceImage,
    anomalies: serializeInspectionAnomalies(inspectionForm?.anomalies),
    progressStatus:
      typeof inspectionForm?.progressStatus === "string" && inspectionForm.progressStatus.trim()
        ? inspectionForm.progressStatus.trim().toUpperCase()
        : "PENDING",
  };
};

export async function saveTransformerWithOptionalImage(transformerForm) {
  const baselineImageFile = transformerForm.baselineImage instanceof File
    ? transformerForm.baselineImage
    : null;

  if (!transformerForm.id && !baselineImageFile) {
    throw new Error("Please choose a baseline image before saving the transformer.");
  }

  const uploadedBaselineKey = baselineImageFile
    ? await uploadImageAndGetObjectKey({
        folder: "transformers/base",
        file: baselineImageFile,
      })
    : null;

  const baselineImageKey = uploadedBaselineKey || getExistingObjectKey(
    transformerForm.baseline_image_key,
    transformerForm.baselineImageKey,
    transformerForm.baselineImage,
  );

  const payload = {
    id: transformerForm.id ?? undefined,
    number: transformerForm.number,
    pole: transformerForm.pole,
    region: transformerForm.region,
    type: transformerForm.type,
    weather: transformerForm.weather,
    location: transformerForm.location,
    baselineUploadDate: transformerForm.baselineUploadDate,
    baselineImage: baselineImageKey,
  };

  if (!payload.id) {
    delete payload.id;
  }

  if (!payload.baselineImage) {
    delete payload.baselineImage;
  }

  if (payload.id) {
    return apiClient.put(`/transformers/${payload.id}`, payload);
  }

  return apiClient.post("/transformers", payload);
}

export async function createInspectionWithOptionalImage(inspectionForm, transformerId) {
  const parsedTransformerId = Number(transformerId ?? inspectionForm.transformer);
  if (!Number.isInteger(parsedTransformerId) || parsedTransformerId <= 0) {
    throw new Error("Please select a valid transformer before scheduling an inspection.");
  }

  const inspectionImageFile = inspectionForm.inspectionImage instanceof File
    ? inspectionForm.inspectionImage
    : null;

  const existingInspectionKey = getExistingObjectKey(
    inspectionForm.maintenanceImage,
    inspectionForm.inspection_image_key,
    inspectionForm.inspectionImageKey,
  );

  if (!inspectionImageFile && !existingInspectionKey) {
    throw new Error("Please choose an inspection image before scheduling inspection.");
  }

  const uploadedInspectionKey = inspectionImageFile
    ? await uploadImageAndGetObjectKey({
        folder: "inspections",
        file: inspectionImageFile,
      })
    : null;

  const payload = buildInspectionPayload({
    inspectionForm,
    maintenanceImage: uploadedInspectionKey || existingInspectionKey,
  });

  const response = await apiClient.post(`/transformers/${parsedTransformerId}/inspections`, payload);
  const responseData = response.data?.data ?? response.data;

  if (!responseData || typeof responseData !== "object") {
    return response;
  }

  const normalizedInspection = normalizeInspectionForUi(responseData);

  if (response.data && Object.hasOwn(response.data, "data")) {
    return {
      ...response,
      data: {
        ...response.data,
        data: normalizedInspection,
      },
    };
  }

  return {
    ...response,
    data: normalizedInspection,
  };
}
