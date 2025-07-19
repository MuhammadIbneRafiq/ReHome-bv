import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Helper function to get condition label for marketplace items
export const getConditionLabel = (condition?: string): string => {
  if (!condition) return '';
  
  const conditionLabels: Record<string, string> = {
    '1': 'Like New - Almost no signs of use, very well maintained',
    '2': 'Excellent - Minimal wear, barely noticeable imperfections',
    '3': 'Good - Visible signs of wear (scratches, small dents), but fully functional',
    '4': 'Fair - Heavily used with noticeable wear, may need minor repairs',
    '5': 'Poor/Broken - Significant damage or functional issues, may require major repairs',
  };
  
  return conditionLabels[condition] || condition;
};
