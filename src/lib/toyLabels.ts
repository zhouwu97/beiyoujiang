/**
 * 玩具领域标签：刺激等级 / 分类 → 中文（仅展示用，不改 API 语义）。
 * 榜单、详情、相似条目共用一份，避免三处各自维护。
 */

export const STIMULATION_LABELS: Record<string, string> = {
  ENTRY: '慢玩入门',
  ADVANCED: '进阶训练',
  HIGH: '超高刺激',
  EXTREME: '榨汁玩具',
};

export const CATEGORY_LABELS: Record<string, string> = {
  CUP: '杯子',
  LARGE_MOLD: '大型倒模',
  HALF_BODY: '半身',
  SMALL_MOLD: '杯酱名器',
};

export function stimulationLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return STIMULATION_LABELS[value] ?? value;
}

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return '未分类';
  return CATEGORY_LABELS[value] ?? value;
}
