import { useCallback, useEffect, useState } from 'react';
import { getSavedScans, saveScan } from '@/services/scanStorage';
import type { ScanRecord } from '@/types/scan';

export function useScans() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const saved = await getSavedScans();
    setScans(saved);
    setIsLoading(false);
  }, []);

  const persistScan = useCallback(async (scan: ScanRecord) => {
    const next = await saveScan(scan);
    setScans(next);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    scans,
    isLoading,
    refresh,
    persistScan,
  };
}
