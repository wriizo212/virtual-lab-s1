import { describe, expect, it } from 'vitest';
import { createSession } from './model';
import { computeBadges, certificateHtml } from './badges';

function base() {
  let session = createSession('individual', 'Aina', '1 Bestari', []);
  session = { ...session, hypothesis: 1, predictionMade: true, prediction: ['A'], completedSteps: [0, 1, 2, 3, 4, 5, 6, 7],
    explanationAnswers: { water: '1', oxygen: '2', temperature: '2', conditions: '3' },
    analysisFirstAnswers: { water: '1', oxygen: '2', temperature: '2', conditions: '3' },
    resultsCheck: { correct: 16, total: 16 }, hintsUsed: 0,
    scores: { hypothesis: 2, setup: 8, observation: 4, results: 8, analysis: 4, conclusion: 4, bonus: 0 },
    completedAt: new Date(Date.parse(session.createdAt) + 10 * 60 * 1000).toISOString(), resultCode: 'SCI1-GERM-TEST01' };
  return session;
}

describe('pupil badges and certificate', () => {
  it('awards badges for a complete, quick, precise run', () => {
    const badges = computeBadges(base());
    const byId = Object.fromEntries(badges.map(badge => [badge.id, badge.earned]));
    expect(byId.penyiasat).toBe(true);
    expect(byId.kilat).toBe(true);
    expect(byId.tepat).toBe(true);
    expect(byId.mata).toBe(true);
    expect(byId.hemat).toBe(true);
    expect(byId.peneroka).toBe(false);
  });
  it('locks speed and tip-free badges when the run was slow or hinted', () => {
    const session = base();
    const slow = { ...session, completedAt: new Date(Date.parse(session.createdAt) + 40 * 60 * 1000).toISOString(), hintsUsed: 3 };
    const byId = Object.fromEntries(computeBadges(slow).map(badge => [badge.id, badge.earned]));
    expect(byId.kilat).toBe(false);
    expect(byId.hemat).toBe(false);
    expect(byId.penyiasat).toBe(true);
  });
  it('locks precision badges when first answers were wrong', () => {
    const session = base();
    const messy = { ...session, analysisFirstAnswers: { water: '0', oxygen: '2', temperature: '1', conditions: '3' }, resultsCheck: { correct: 14, total: 16 } };
    const byId = Object.fromEntries(computeBadges(messy).map(badge => [badge.id, badge.earned]));
    expect(byId.tepat).toBe(false);
    expect(byId.mata).toBe(false);
  });
  it('builds a printable certificate with the name, class, score and badges', () => {
    const html = certificateHtml(base());
    expect(html).toContain('SIJIL PENYIASAT MUDA');
    expect(html).toContain('Aina');
    expect(html).toContain('1 Bestari');
    expect(html).toContain('30 / 30 markah');
    expect(html).toContain('Penyiasat Muda');
    expect(html).toContain('Guru Sains');
    expect(html).toContain('SCI1-GERM-TEST01');
    expect(html).toContain('@page');
  });
  it('escapes pupil names in the certificate', () => {
    const session = { ...base(), name: 'Aina <hebat> & Co' };
    const html = certificateHtml(session);
    expect(html).toContain('Aina &lt;hebat&gt; &amp; Co');
    expect(html).not.toContain('Aina <hebat>');
  });
});
