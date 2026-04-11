/** Heuristic guest-post price bands (INR) from estimated authority score 1–100. */
export function estimatePriceInr(estimatedDa: number): string {
  if (estimatedDa < 20) return "₹500–₹1,500";
  if (estimatedDa < 40) return "₹1,500–₹5,000";
  if (estimatedDa < 60) return "₹5,000–₹15,000";
  return "₹15,000+";
}
