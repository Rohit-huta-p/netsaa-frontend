// src/features/contract-pdf/hooks/useContractPdf.ts
//
// Generates a contract PDF on the device via expo-print, returns a local
// file URI + a share helper. The HTML template is deterministic — same
// input data yields bit-identical PDFs.

import { useCallback, useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { renderContractHtml } from '../templates/contractTemplate';
import type { ContractPdfData } from '../utils/buildContractData';

type State = {
    isGenerating: boolean;
    uri: string | null;
    error: Error | null;
};

export function useContractPdf() {
    const [state, setState] = useState<State>({ isGenerating: false, uri: null, error: null });

    const generate = useCallback(async (data: ContractPdfData): Promise<string | null> => {
        setState({ isGenerating: true, uri: null, error: null });
        try {
            const html = renderContractHtml(data);
            const result = await Print.printToFileAsync({ html, base64: false });
            setState({ isGenerating: false, uri: result.uri, error: null });
            return result.uri;
        } catch (err: any) {
            setState({ isGenerating: false, uri: null, error: err });
            return null;
        }
    }, []);

    const share = useCallback(async (uri: string, dialogTitle = 'Share contract') => {
        const can = await Sharing.isAvailableAsync();
        if (!can) {
            throw new Error('Sharing not available on this device');
        }
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle,
        });
    }, []);

    const generateAndShare = useCallback(async (data: ContractPdfData) => {
        const uri = await generate(data);
        if (uri) await share(uri);
        return uri;
    }, [generate, share]);

    return { ...state, generate, share, generateAndShare };
}
