import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { createId } from '@/services/ids';
import { extractTextFromImage } from '@/services/ocrService';
import { detectPrices, totalGbp } from '@/services/priceParser';
import { saveScan } from '@/services/scanStorage';
import type { ScanRecord } from '@/types/scan';

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
              quality: 1,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false,
              quality: 1,
            });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const imageUri = result.assets[0].uri;
      const ocr = await extractTextFromImage(imageUri);
      const prices = detectPrices(ocr.text);

      const scanRecord: ScanRecord = {
        id: createId('scan'),
        createdAt: new Date().toISOString(),
        imageUri,
        originalText: ocr.text,
        prices,
        estimatedTotalGbp: totalGbp(prices),
        source,
        ocrStatus: ocr.status,
      };

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
