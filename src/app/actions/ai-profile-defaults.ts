export type AiProfileType = 'running' | 'gym';

export type ProfileItem = {
  item_id: string;
  item_label: string;
  item_value: string;
  item_order: number;
};

export const DEFAULT_RUNNING_PROFILE: ProfileItem[] = [
  {
    item_id: 'running_goal',
    item_label: '러닝 목표',
    item_value: '10km 49:59',
    item_order: 1,
  },
  {
    item_id: 'running_current_level',
    item_label: '현재 러닝 수준',
    item_value: '5km 기준 약 5:50/km, 10km는 base-building 단계',
    item_order: 2,
  },
  {
    item_id: 'running_structure',
    item_label: '선호 훈련 구조',
    item_value: '주 4회: Fast Track 1회, Easy Run 2회, Long Run 1회',
    item_order: 3,
  },
  {
    item_id: 'running_constraints',
    item_label: '주의점',
    item_value: '헬스/테니스와 병행하므로 과도한 인터벌은 피하고, easy run은 페이스보다 대화 가능 강도 우선',
    item_order: 4,
  },
];

export const DEFAULT_GYM_PROFILE: ProfileItem[] = [
  {
    item_id: 'gym_goal',
    item_label: '헬스 목표',
    item_value: '근비대와 체지방 감량을 병행',
    item_order: 1,
  },
  {
    item_id: 'gym_structure',
    item_label: '운동 구조',
    item_value: 'Pull / Running / Push / Leg 순환',
    item_order: 2,
  },
  {
    item_id: 'gym_intensity',
    item_label: '강도 기준',
    item_value: '메인 리프트 1–2 RIR, 하체 메인 리프트는 실패지점 금지, 보조운동 마지막 세트는 0–1 RIR 가능',
    item_order: 3,
  },
  {
    item_id: 'gym_constraints',
    item_label: '주의점',
    item_value: '근육통이 4일 이상 지속되면 다음 세션 볼륨 또는 강도 조절',
    item_order: 4,
  },
];
