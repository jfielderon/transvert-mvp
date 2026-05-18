import TextRecognition from 'expo-text-recognition';

export async function runOCR(uri: string): Promise<string> {
  const result = await TextRecognition.recognize(uri);
  if (!result?.length) return '';
  return result.join('\n');
}
