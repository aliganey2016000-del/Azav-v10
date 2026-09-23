import assert from 'node:assert/strict';
import { JourneyService } from '../services/journey.service.js';
import { JourneyMilestone, JourneyStageKey as Key, JourneyStageStatus as Status, JourneyStageAction as Action } from '../models/JourneyMilestone.js';
import { Student } from '../models/Student.js';
import { Application } from '../models/Application.js';
import { TrainingBatch } from '../models/TrainingBatch.js';
import { AuditLog } from '../models/Notification.js';
import { UserRole } from '../types/index.js';

async function run() {
  const originals = [JourneyService.getJourney, JourneyMilestone.findOne, Student.findById, Application.findOne, TrainingBatch.findOne, AuditLog.create];
  const actor: any = { userId: 'actor', email: 'staff@example.test', roles: [UserRole.AZAAM_STAFF] };
  let milestone: any;
  let application: any;
  let selectedBatch: any;
  let batchFilter: any;
  const audits: any[] = [];
  let saved = 0;
  const reset = () => {
    milestone = { _id: 'review', status: Status.COMPLETED, order: 0, history: [], save: async () => { saved++; } };
    application = { _id: 'application', batchId: 'old', save: async () => {} };
    selectedBatch = { _id: 'new', batchNumber: 'NEW' };
    audits.length = 0; saved = 0;
  };
  try {
    JourneyService.getJourney = (async () => ({ stages: [] })) as any;
    JourneyMilestone.findOne = (async () => milestone) as any;
    Student.findById = (() => ({ select: () => ({ lean: async () => ({ universityId: 'university' }) }) })) as any;
    Application.findOne = (() => ({ sort: async () => application })) as any;
    TrainingBatch.findOne = ((filter: any) => { batchFilter = filter; return { lean: async () => selectedBatch }; }) as any;
    AuditLog.create = (async (audit: any) => { audits.push(audit); }) as any;
    for (const action of [Action.REJECT, Action.REQUEST_CORRECTION]) {
      reset();
      await JourneyService.actOnStage('student', Key.AZAAM_REVIEW, action, 'Updated decision', undefined, actor);
      assert.equal(milestone.status, action === Action.REJECT ? Status.REJECTED : Status.CORRECTION_REQUESTED);
      assert.equal(milestone.history[0].fromStatus, Status.COMPLETED);
      assert.equal(audits[0].before.status, Status.COMPLETED);
      assert.equal(saved, 1);
    }
    reset();
    await assert.rejects(() => JourneyService.actOnStage('student', Key.AZAAM_REVIEW, Action.REJECT, '', undefined, actor), /reason\/comment/);
    await assert.rejects(() => JourneyService.actOnStage('student', Key.AZAAM_REVIEW, Action.REJECT, 'Reason', undefined, { ...actor, roles: [UserRole.UNIVERSITY_ADMIN] }), /Only AZAAM/);
    await JourneyService.actOnStage('student', Key.AZAAM_REVIEW, Action.APPROVE, undefined, 'new', actor);
    assert.equal(application.batchId, 'new');
    assert.equal(batchFilter.universityId, 'university');
    assert.equal(batchFilter.status, 'OPEN');
    assert.equal(saved, 0, 'Batch-only edits must preserve completed milestone history');
    reset(); selectedBatch = null;
    await assert.rejects(() => JourneyService.actOnStage('student', Key.AZAAM_REVIEW, Action.APPROVE, undefined, 'invalid', actor), /unavailable/);
    assert.equal(application.batchId, 'old');
    reset(); selectedBatch = { _id: 'old', batchNumber: 'OLD', status: 'CLOSED' };
    await JourneyService.actOnStage('student', Key.AZAAM_REVIEW, Action.APPROVE, undefined, 'old', actor);
    assert.equal(batchFilter.status, undefined, 'Existing closed batch may be retained');
    assert.equal(audits.length, 0);
    reset(); milestone.status = Status.LOCKED;
    await assert.rejects(() => JourneyService.actOnStage('student', Key.AZAAM_REVIEW, Action.APPROVE, undefined, 'new', actor), /not currently actionable/);
    console.log('Journey review edit tests passed: decisions, history, roles, batch scope and locked stages.');
  } finally {
    [JourneyService.getJourney, JourneyMilestone.findOne, Student.findById, Application.findOne, TrainingBatch.findOne, AuditLog.create] = originals as any;
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
