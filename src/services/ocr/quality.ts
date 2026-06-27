export type OcrBox = { x: number; y: number; width: number; height: number };
export type OcrLine = { id: string; text: string; box?: OcrBox; confidence?: number };
export type OcrQuality = { score: number; label: 'good' | 'fair' | 'poor'; reason: string };

export function estimateOcrQuality(text: string, lines: OcrLine[] = []): OcrQuality {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const shortWordCount = words.filter((word) => word.length <= 2 && !/^\d+[,.]?\d*$/.test(word)).length;
  const oddCharCount = (trimmed.match(/[{}_[\]^~<>\\]/g) ?? []).length;
  const avgConfidence = lines.length
    ? lines.reduce((sum, line) => sum + (line.confidence ?? 0.75), 0) / lines.length
    : 0.7;
  let score = Math.round(avgConfidence * 100);
  if (words.length < 8) score -= 25;
  if (shortWordCount > words.length * 0.25) score -= 20;
  if (oddCharCount > 4) score -= 15;
  score = Math.max(0, Math.min(100, score));

  if (score >= 72) return { score, label: 'good', reason: 'Readable OCR with enough text for reliable menu parsing.' };
  if (score >= 48) return { score, label: 'fair', reason: 'OCR is usable, but some menu lines may need checking.' };
  return { score, label: 'poor', reason: 'OCR looks unreliable. Retake closer, flatter and without glare.' };
}
