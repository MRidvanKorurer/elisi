export const BRIEF_FIELDS = [
  { key: 'neededBy', label: 'Ne zaman elinde olsun?', placeholder: 'Örn. 12 Ekim düğünü', max: 80 },
  { key: 'fitNote', label: 'Ölçü veya kalıp', placeholder: 'Omuz 38 cm, sap biraz daha kısa olsun', max: 400 },
  { key: 'colorNote', label: 'Renk, sap, astar', placeholder: 'Bej keten, iç astar koyu olsun', max: 400 },
  { key: 'occasion', label: 'Kime, hangi gün?', placeholder: 'Anneme, doğum günü hediyesi', max: 200 },
  { key: 'extra', label: 'Atölyeye ek not', placeholder: 'İçine küçük bir cep isterim', max: 800, multiline: true }
];

export const emptyBrief = () => Object.fromEntries(BRIEF_FIELDS.map((field) => [field.key, '']));

export const briefLines = (brief = {}) => BRIEF_FIELDS
  .map((field) => ({ ...field, value: String(brief[field.key] || '').trim() }))
  .filter((field) => field.value);

export const lineKey = (item) => `${item.product?._id || item.product || item.id || item.name}-${item.color || ''}-${item.size || ''}`;
