import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** STEEL 체적중량 계산 (kg) */
export function calcSteelWeight(
  density: number, w: number, l: number, h: number
): number {
  return density * w * l * h / 1_000_000;
}

/** STEEL 건당 단가 계산 (원) */
export function calcSteelPrice(weightKg: number, pricePerKg: number): number {
  return Math.round(weightKg * pricePerKg);
}

/** STEEL 태그 번호 자동 생성 */
export function generateSteelTagNo(
  steelGrade: string,
  sequence: number,
  date?: Date
): string {
  const d = date || new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(3, '0');
  return `${steelGrade}-${yy}${mm}-${seq}`;
}

/** 발주 수량(EA) → 총 중량(KG) 환산 */
export function calcTotalWeight(qtyEa: number, weightPerEa: number): number {
  return Math.round(qtyEa * weightPerEa * 100) / 100;
}

/** 총 중량(KG) → 발주 금액 계산 */
export function calcSteelOrderAmount(totalWeightKg: number, pricePerKg: number): number {
  return Math.round(totalWeightKg * pricePerKg);
}
