import apiClient from "./axiosConfig";

const URL_REGEX = /^https?:\/\//i;
const DATA_URI_REGEX = /^data:/i;

const deriveFileExtension = (file) => {
  const fileName = file?.name || "";
  const extensionFromName = fileName.includes(".")
    ? fileName.split(".").pop().toLowerCase()
    : "";

  if (extensionFromName) {
    return extensionFromName;
  }

  const mimeType = file?.type || "";
  const mimeTypeParts = mimeType.split("/");
  if (mimeTypeParts.length === 2 && mimeTypeParts[1]) {
    return mimeTypeParts[1].toLowerCase();
  }

  return "bin";
};

export const getExistingObjectKey = (...keyCandidates) => {
  for (const candidate of keyCandidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }

    if (URL_REGEX.test(trimmed) || DATA_URI_REGEX.test(trimmed)) {
      continue;
    }

    return trimmed;
  }

  return null;
};

export async function requestPresignedUploadUrl({ folder, file }) {
  if (!folder) {
    throw new Error("Image upload folder is required.");
  }

  if (!(file instanceof File)) {
    throw new Error("A valid image file is required for upload.");
  }

  const extension = deriveFileExtension(file);
  const { data } = await apiClient.get("/images/generate-upload-url", {
    params: {
      folder,
      extension,
    },
  });

  const payload = data?.data || data;
  const presignedUrl = payload?.uploadUrl || payload?.presignedUrl;
  const objectKey = payload?.objectKey;

  if (!presignedUrl || !objectKey) {
    throw new Error("Backend did not return a valid pre-signed upload URL.");
  }

  return {
    presignedUrl,
    objectKey,
  };
}

export async function uploadFileToS3({ presignedUrl, file }) {
  if (!presignedUrl) {
    throw new Error("Missing pre-signed URL for S3 upload.");
  }

  if (!(file instanceof File)) {
    throw new Error("A valid image file is required for S3 upload.");
  }

  if (!file.type) {
    throw new Error("Selected image has no Content-Type and cannot be uploaded.");
  }

  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
    credentials: "omit",
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => "");
    const shortError = errorText ? ` ${errorText.slice(0, 200)}` : "";
    throw new Error(
      `S3 upload failed with status ${uploadResponse.status}.${shortError}`,
    );
  }
}

export async function uploadImageAndGetObjectKey({ folder, file }) {
  const { presignedUrl, objectKey } = await requestPresignedUploadUrl({ folder, file });
  await uploadFileToS3({ presignedUrl, file });
  return objectKey;
}
