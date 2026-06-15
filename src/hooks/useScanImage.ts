import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { extractTextFromImage } from '@/services/ocr';
import { processScanInput } from '@/services/scan/processScan';
import { uploadOcrImageToSupabase } from '@/services/supabase/storage';
import { saveScan } from '@/storage/scans';

type PickSource = 'camera' | 'library';

export function useScanImage() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async (source: PickSource) => {
    setError(null);
    setIsScanning(true);

    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        throw new Error(source === 'camera' ? 'Camera permission was denied.' : 'Photo library permission was denied.');
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: false,
              base64: true,
              quality: 0.65,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              base64: true,
              quality: 0.65,
            });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const asset = result.assets[0];
      const imageUri = asset.uri;
      const upload = await uploadOcrImageToSupabase({
        uri: imageUri,
        base64: asset.base64 ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
      const ocr = await extractTextFromImage({
        uri: imageUri,
        imageUrl: upload.input.imageUrl,
        base64: upload.input.imageUrl ? undefined : asset.base64 ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
      const scanRecord = await processScanInput({
        text: ocr.text,
        imageUri: upload.input.imageUrl ?? imageUri,
        source,
        ocrStatus: ocr.status,
      });

      await saveScan(scanRecord);
      router.push({ pathname: '/results', params: { id: scanRecord.id } });
    } catch (scanError) {
      const message = scanError instanceof Error ? scanError.message : 'Could not scan image.';
      setError(message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    isScanning,
    error,
    scanFromCamera: useCallback(() => scan('camera'), [scan]),
    scanFromLibrary: useCallback(() => scan('library'), [scan]),
  };
}
