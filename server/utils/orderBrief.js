const clip = (value, max) => String(value || '').trim().slice(0, max);

const briefOf = (raw = {}) => ({
  neededBy: clip(raw.neededBy, 80),
  fitNote: clip(raw.fitNote, 400),
  colorNote: clip(raw.colorNote, 400),
  occasion: clip(raw.occasion, 200),
  extra: clip(raw.extra, 800)
});

const briefHasText = (brief = {}) => Object.values(brief).some((value) => String(value || '').trim());

const noteTextOf = (value) => clip(value, 1000);

module.exports = { briefOf, briefHasText, noteTextOf };
