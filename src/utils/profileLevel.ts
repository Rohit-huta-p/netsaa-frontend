// src/utils/profileLevel.ts

interface ProfileLevel {
    label: string;
    color: string;
}

export function getProfileLevel(score: number): ProfileLevel {
    if (score >= 90) return { label: "Featured Ready", color: "#10B981" };
    if (score >= 70) return { label: "Professional", color: "#8B5CF6" };
    if (score >= 40) return { label: "Rising", color: "#FF8C42" };
    return { label: "Beginner", color: "#FF6B35" };
}
