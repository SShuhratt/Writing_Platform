import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCohort,
  createCohortAssignment,
  joinCohortByCode,
  listStudentCohorts,
} from '@/lib/b2b-repository';
import { OFFICIAL_PROMPTS_DATABASE } from '@/lib/prompts-database';

test('listStudentCohorts fails closed on empty student identifier and isolates student memberships', async () => {
  const emptyRes = await listStudentCohorts('', '');
  assert.deepEqual(emptyRes, []);

  const cohortA = await createCohort({
    name: 'Cohort Alpha',
    schoolName: 'Academy Alpha',
    teacherId: 'teacher-alpha',
    teacherName: 'Teacher Alpha',
  });

  const cohortB = await createCohort({
    name: 'Cohort Beta',
    schoolName: 'Academy Beta',
    teacherId: 'teacher-beta',
    teacherName: 'Teacher Beta',
  });

  const joined = await joinCohortByCode({
    joinCode: cohortA.joinCode,
    studentId: 'student-alpha-1',
    studentName: 'Student Alpha',
    studentEmail: 'alpha@student.test',
  });
  assert.equal(joined.success, true);

  const alphaCohorts = await listStudentCohorts('student-alpha-1', 'alpha@student.test');
  assert.equal(alphaCohorts.length, 1);
  assert.equal(alphaCohorts[0].cohort.id, cohortA.id);

  // Other student does not see Cohort Alpha or Beta
  const otherCohorts = await listStudentCohorts('student-unrelated', 'other@student.test');
  assert.equal(otherCohorts.length, 0);

  // Cross-teacher cohort assignment guard
  const assignForbidden = await createCohortAssignment({
    cohortId: cohortA.id,
    requesterId: cohortB.teacherId,
    isAdmin: false,
    prompt: OFFICIAL_PROMPTS_DATABASE[0],
  });
  assert.equal(assignForbidden.status, 'FORBIDDEN');
});

