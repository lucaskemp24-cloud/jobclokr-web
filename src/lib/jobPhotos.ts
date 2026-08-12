export type JobPhoto = {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  imageData: string;
  fileName: string;
  note: string;
  createdAt: string;
};

const JOB_PHOTOS_STORAGE_KEY = "jobclokr-job-photos";

export function loadJobPhotos(): JobPhoto[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedPhotos = window.localStorage.getItem(
    JOB_PHOTOS_STORAGE_KEY
  );

  if (!savedPhotos) {
    return [];
  }

  try {
    const parsedPhotos = JSON.parse(savedPhotos);

    if (!Array.isArray(parsedPhotos)) {
      return [];
    }

    return parsedPhotos as JobPhoto[];
  } catch {
    return [];
  }
}

export function saveJobPhotos(photos: JobPhoto[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    JOB_PHOTOS_STORAGE_KEY,
    JSON.stringify(photos)
  );
}

export function getProjectPhotos(
  projectId: number
): JobPhoto[] {
  return loadJobPhotos()
    .filter((photo) => photo.projectId === projectId)
    .sort(
      (firstPhoto, secondPhoto) =>
        new Date(secondPhoto.createdAt).getTime() -
        new Date(firstPhoto.createdAt).getTime()
    );
}

export function deleteJobPhoto(photoId: number) {
  const remainingPhotos = loadJobPhotos().filter(
    (photo) => photo.id !== photoId
  );

  saveJobPhotos(remainingPhotos);

  return remainingPhotos;
}