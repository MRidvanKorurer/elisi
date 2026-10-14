import i18n from '../i18n';

const field = (key, label, placeholder, max, extra = {}) => ({
  key,
  max,
  ...extra,
  get label() {
    return i18n.t(`brief.${key}.label`, { ns: 'checkout', defaultValue: label });
  },
  get placeholder() {
    return i18n.t(`brief.${key}.placeholder`, { ns: 'checkout', defaultValue: placeholder });
  }
});

export const BRIEF_FIELDS = [
  field('neededBy', 'Ne zaman elinde olsun?', 'Örn. 12 Ekim düğünü', 80),
  field('fitNote', 'Ölçü veya kalıp', 'Omuz 38 cm, sap biraz daha kısa olsun', 400),
  field('colorNote', 'Renk, sap, astar', 'Bej keten, iç astar koyu olsun', 400),
  field('occasion', 'Kime, hangi gün?', 'Anneme, doğum günü hediyesi', 200),
  field('extra', 'Atölyeye ek not', 'İçine küçük bir cep isterim', 800, { multiline: true })
];

export const emptyBrief = () => Object.fromEntries(BRIEF_FIELDS.map((item) => [item.key, '']));

export const briefLines = (brief = {}) => BRIEF_FIELDS
  .map((item) => ({ key: item.key, max: item.max, label: item.label, placeholder: item.placeholder, value: String(brief[item.key] || '').trim() }))
  .filter((item) => item.value);

export const lineKey = (item) => `${item.product?._id || item.product || item.id || item.name}-${item.color || ''}-${item.size || ''}`;
