import { Alert } from "react-native";
import gigService from "@/services/gigService";

export const handleRephrase = async (formData: any, setRephrasingField: any, updateField: any, field: 'description' | 'termsAndConditions') => {
    const text = formData[field];
    if (!text || text.length < 5) {
        Alert.alert("Input Required", "Please enter some text to rephrase.");
        return;
    }

    setRephrasingField(field);
    try {
        const result = await gigService.rephraseText(text);
        if (result && result.rephrased) {
            updateField(field, result.rephrased);
        }
    } catch (error: any) {
        console.error("Rephrase failed:", error);
        Alert.alert("Error", "Failed to rephrase text. Please try again.");
    } finally {
        setRephrasingField(null);
    }
};