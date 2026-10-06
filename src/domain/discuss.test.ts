import { describe, expect, it } from 'vitest';
import { analysisQuestions, hypothesisOptions } from './learning';
import { commonMisconceptions, discussNotes, teacherSheetHtml, tubeOutcomes } from './discuss';

describe('discussion notes, misconceptions and the teacher sheet', () => {
  it('provides a script and probing questions for every slide', () => {
    const all = [discussNotes.intro, discussNotes.hypothesis, discussNotes.outcome, discussNotes.table, ...discussNotes.analysis, discussNotes.misconceptions, discussNotes.conclusion];
    expect(discussNotes.analysis).toHaveLength(analysisQuestions.length);
    expect(all).toHaveLength(6 + analysisQuestions.length);
    for (const note of all) {
      expect(note.script.trim().length).toBeGreaterThan(20);
      expect(note.questions.length).toBeGreaterThan(0);
      expect(note.questions.every(question => question.trim().length > 5)).toBe(true);
    }
  });
  it('lists four common misconceptions with substantial corrections', () => {
    expect(commonMisconceptions).toHaveLength(4);
    for (const item of commonMisconceptions) {
      expect(item.belief.length).toBeGreaterThan(8);
      expect(item.truth.length).toBeGreaterThan(20);
    }
  });
  it('derives the same four demonstration tubes the slides show', () => {
    const outcomes = tubeOutcomes();
    expect(outcomes.map(outcome => outcome.id)).toEqual(['A', 'B', 'C', 'D']);
    expect(outcomes[0].result.germination).toBe(true);
    expect(outcomes.slice(1).every(outcome => outcome.result.germination === false)).toBe(true);
  });
  it('builds a printable sheet with every answer, correction and note', () => {
    const html = teacherSheetHtml();
    expect(html).toContain('Helaian Rujukan Guru');
    expect(html).toContain(hypothesisOptions[1]);
    for (const question of analysisQuestions) {
      expect(html).toContain(question.options[Number(question.answer)]);
      expect(html).toContain(question.explanation);
    }
    for (const item of commonMisconceptions) {
      expect(html).toContain(item.belief);
      expect(html).toContain(item.truth);
    }
    expect(html).toContain(discussNotes.conclusion.script);
    expect(html).toContain(discussNotes.analysis[1].questions[0]);
    expect(html).toContain('PERCAMBAHAN');
    expect(html).toContain('@page');
  });
});
