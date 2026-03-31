import apiClient from "./axiosConfig";
import { getExistingObjectKey, uploadImageAndGetObjectKey } from "./imageUpload";

const DEFAULT_PROGRESS_STATUS = {
  thermalUpload: "Pending",
  aiAnalysis: "Pending",
  review: "Pending",
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
    baseline_image_key: baselineImageKey,
  };

  if (!payload.id) {
    delete payload.id;
  }

  if (!payload.baseline_image_key) {
    delete payload.baseline_image_key;
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

  const payload = {
    transformer: parsedTransformerId,
    date: inspectionForm.date,
    inspector: inspectionForm.inspector,
    notes: inspectionForm.notes || "",
    maintenanceWeather: inspectionForm.maintenanceWeather || "Sunny",
    progressStatus: inspectionForm.progressStatus || DEFAULT_PROGRESS_STATUS,
    inspection_image_key: uploadedInspectionKey || existingInspectionKey,
  };

  return apiClient.post("/inspections", payload);
}
