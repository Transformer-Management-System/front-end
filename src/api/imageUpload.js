import apiClient from "./axiosConfig";

const URL_REGEX = /^https?:\/\//i;
const DATA_URI_REGEX = /^data:/i;
const BLOB_URL_PREFIX = "blob:";
const DOWNLOAD_URL_CACHE_TTL_MS = 10 * 60 * 1000;

const downloadUrlCache = new Map();
const downloadUrlInFlight = new Map();

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

const isDirectImageSource = (value) =>
  typeof value === "string" &&
  (URL_REGEX.test(value) || DATA_URI_REGEX.test(value) || value.startsWith(BLOB_URL_PREFIX));

const getCachedDownloadUrl = (key) => {
  const cachedEntry = downloadUrlCache.get(key);
  if (!cachedEntry) {
    return null;
  }

  if (Date.now() - cachedEntry.cachedAt > DOWNLOAD_URL_CACHE_TTL_MS) {
    downloadUrlCache.delete(key);
    return null;
  }

  return cachedEntry.url;
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
    throw new TypeError("A valid image file is required for upload.");
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

export async function requestPresignedDownloadUrl({ key }) {
  if (!key) {
    throw new Error("Image key is required.");
  }

  const trimmedKey = key.trim();
  if (!trimmedKey) {
    throw new Error("Image key is required.");
  }

  if (isDirectImageSource(trimmedKey)) {
    return trimmedKey;
  }

  const cachedUrl = getCachedDownloadUrl(trimmedKey);
  if (cachedUrl) {
    return cachedUrl;
  }

  const inFlightRequest = downloadUrlInFlight.get(trimmedKey);
  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = (async () => {
    const { data } = await apiClient.get("/images/generate-download-url", {
      params: {
        key: trimmedKey,
      },
    });

    const payload = data?.data ?? data;
    const downloadUrl = typeof payload === "string"
      ? payload
      : payload?.downloadUrl || payload?.url || payload?.presignedUrl;

    if (!downloadUrl || typeof downloadUrl !== "string") {
      throw new Error("Backend did not return a valid pre-signed download URL.");
    }

    downloadUrlCache.set(trimmedKey, {
      url: downloadUrl,
      cachedAt: Date.now(),
    });

    return downloadUrl;
  })();

  downloadUrlInFlight.set(trimmedKey, request);

  try {
    return await request;
  } catch (error) {
    downloadUrlCache.delete(trimmedKey);
    throw error;
  } finally {
    downloadUrlInFlight.delete(trimmedKey);
  }
}

export async function resolveDisplayImageUrl(source) {
  if (typeof source !== "string") {
    return null;
  }

  const trimmedSource = source.trim();
  if (!trimmedSource) {
    return null;
  }

  if (isDirectImageSource(trimmedSource)) {
    return trimmedSource;
  }

  return requestPresignedDownloadUrl({ key: trimmedSource });
}

export async function uploadFileToS3({ presignedUrl, file }) {
  if (!presignedUrl) {
    throw new Error("Missing pre-signed URL for S3 upload.");
  }

  if (!(file instanceof File)) {
    throw new TypeError("A valid image file is required for S3 upload.");
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
