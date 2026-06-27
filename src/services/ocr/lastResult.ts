type OcrMetadata = {
  text: string;
  lines?: any[];
  quality?: any;
  warnings?: string[];
};

let latestOcrMetadata: OcrMetadata | null = null;

export function setLatestOcrMetadata(metadata: OcrMetadata) {
  latestOcrMetadata = metadata;
}

export function getLatestOcrMetadata() {
  return latestOcrMetadata;
}

export function clearLatestOcrMetadata() {
  latestOcrMetadata = null;
}
