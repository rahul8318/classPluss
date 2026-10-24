class AutoGradeService {
  /**
   * Auto-grade an assessment attempt based on assessment questions
   * @param {Array<object>} assessmentQuestions - Questions defined on the Assessment
   * @param {Array<object>} submittedAnswers - Answers submitted by student
   * @returns {{ scoredAnswers: Array<object>, totalScore: number, maxScore: number, isFullyGraded: boolean }}
   */
  static gradeAttempt(assessmentQuestions, submittedAnswers = []) {
    let totalScore = 0;
    let maxScore = 0;
    let hasSubjectiveQuestions = false;

    const scoredAnswers = [];

    // Map answers by questionId
    const answerMap = new Map();
    for (const ans of submittedAnswers) {
      answerMap.set(String(ans.questionId), ans);
    }

    for (let i = 0; i < assessmentQuestions.length; i++) {
      const q = assessmentQuestions[i];
      const qId = String(q._id || i);
      const studentAns = answerMap.get(qId) || {
        selectedOptionId: '',
        textAnswer: '',
      };

      const points = q.points || 1;
      maxScore += points;

      let isCorrect = null;
      let pointsAwarded = 0;

      if (q.questionType === 'mcq') {
        const correctOpt = q.options.find(opt => opt.isCorrect);
        const expectedId = correctOpt ? correctOpt.id : q.answerKey;
        const studentSelected = studentAns.selectedOptionId || studentAns.textAnswer;

        if (studentSelected && expectedId && String(studentSelected).trim() === String(expectedId).trim()) {
          isCorrect = true;
          pointsAwarded = points;
          totalScore += points;
        } else {
          isCorrect = false;
          pointsAwarded = 0;
        }
      } else if (q.questionType === 'true_false') {
        const correctOpt = q.options.find(opt => opt.isCorrect);
        const expectedId = correctOpt ? correctOpt.id : q.answerKey;
        const studentSelected = studentAns.selectedOptionId || studentAns.textAnswer;

        if (
          studentSelected &&
          (String(studentSelected).toLowerCase() === String(expectedId).toLowerCase() ||
           String(studentSelected).toLowerCase() === (correctOpt?.text || '').toLowerCase())
        ) {
          isCorrect = true;
          pointsAwarded = points;
          totalScore += points;
        } else {
          isCorrect = false;
          pointsAwarded = 0;
        }
      } else {
        // short_answer or open_ended requires teacher grading
        hasSubjectiveQuestions = true;
        isCorrect = null;
        pointsAwarded = 0;
      }

      scoredAnswers.push({
        questionId: qId,
        questionType: q.questionType,
        selectedOptionId: studentAns.selectedOptionId || '',
        textAnswer: studentAns.textAnswer || '',
        isCorrect,
        pointsAwarded,
        teacherComment: '',
      });
    }

    return {
      scoredAnswers,
      totalScore,
      maxScore,
      isFullyGraded: !hasSubjectiveQuestions,
    };
  }
}

module.exports = AutoGradeService;
