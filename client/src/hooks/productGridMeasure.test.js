import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  columnsFromTemplate,
  columnsFromWidth,
  parseGridMinCardPx,
  resolveFetchLimit,
  rowsForViewport,
  splitCssTracks
} from './productGridMeasure.js';

describe('splitCssTracks', () => {
  it('splits resolved pixel tracks', () => {
    assert.deepEqual(splitCssTracks('171.5px 171.5px'), ['171.5px', '171.5px']);
  });

  it('keeps nested minmax() as one token', () => {
    assert.deepEqual(
      splitCssTracks('repeat(auto-fill, minmax(150px, 1fr))'),
      ['repeat(auto-fill, minmax(150px, 1fr))']
    );
  });
});

describe('columnsFromTemplate', () => {
  const mobileWidth = 343;
  const mobileGap = 12;

  it('counts resolved tracks when the browser expanded auto-fill', () => {
    assert.equal(columnsFromTemplate('160px 160px', mobileWidth, mobileGap, 260), 2);
  });

  it('uses minmax() from an unresolved repeat() instead of the 260px fallback', () => {
    const template = 'repeat(auto-fill, minmax(150px, 1fr))';
    assert.equal(columnsFromTemplate(template, mobileWidth, mobileGap, 260), 2);
    assert.equal(parseGridMinCardPx(template, 260), 150);
  });

  it('reproduces the old bug when falling back to 260px on a 2-col mobile grid', () => {
    assert.equal(columnsFromWidth(mobileWidth, 260, mobileGap), 1);
    assert.equal(columnsFromWidth(mobileWidth, 150, mobileGap), 2);
  });

  it('matches a desktop lg minmax(260px) grid', () => {
    const template = 'repeat(auto-fill, minmax(260px, 1fr))';
    assert.equal(columnsFromTemplate(template, 1200, 24, 260), 4);
  });

  it('uses ProductsPage xs minmax(160px) rather than LIST_CARD_MIN 220', () => {
    const template = 'repeat(auto-fill, minmax(160px, 1fr))';
    assert.equal(columnsFromTemplate(template, 360, 12, 220), 2);
    assert.equal(columnsFromWidth(360, 220, 12), 1);
  });
});

describe('rowsForViewport', () => {
  it('honours minRows when not filling the viewport', () => {
    assert.equal(rowsForViewport({ fillViewport: false, minRows: 1, maxRows: 6 }), 1);
    assert.equal(rowsForViewport({ fillViewport: false, minRows: 3, maxRows: 4 }), 3);
  });

  it('clamps fitted rows between min and max', () => {
    assert.equal(rowsForViewport({
      fillViewport: true,
      minRows: 3,
      maxRows: 4,
      availableHeight: 2000,
      rowGap: 20,
      cardHeight: 420
    }), 4);
  });
});

describe('resolveFetchLimit', () => {
  it('locks the first-page size for subsequent pages', () => {
    const locked = { current: 0 };
    assert.equal(resolveFetchLimit(1, 6, locked), 6);
    assert.equal(locked.current, 6);
    assert.equal(resolveFetchLimit(2, 1, locked), 6);
  });
});
