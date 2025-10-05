interface SubjectMark {
  subjectName: string;
  totalMarks: number;
  obtainedMarks: number;
  passingMarks: number;
  isAbsent: boolean;
}

interface TermResult {
  termName: string;
  marks: SubjectMark[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  subjectsFailed: number;
  status: 'pass' | 'fail';
}

export function calculateSubjectResult(
  obtainedMarks: number,
  totalMarks: number,
  passingMarks: number,
  isAbsent: boolean = false
): {
  percentage: number;
  grade: string;
  isPassed: boolean;
} {
  if (isAbsent) {
    return {
      percentage: 0,
      grade: 'ABS',
      isPassed: false,
    };
  }

  const percentage = (obtainedMarks / totalMarks) * 100;
  const isPassed = obtainedMarks >= passingMarks;

  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';
  else if (percentage >= 33) grade = 'E';

  return {
    percentage: Math.round(percentage * 100) / 100,
    grade,
    isPassed,
  };
}

export function calculateTermResult(marks: SubjectMark[]): TermResult {
  let totalMarks = 0;
  let obtainedMarks = 0;
  let subjectsFailed = 0;
  let subjectsAbsent = 0;

  marks.forEach((mark) => {
    totalMarks += mark.totalMarks;
    
    if (mark.isAbsent) {
      subjectsAbsent++;
      // Absent marks count as 0 in total but are tracked separately
    } else {
      obtainedMarks += mark.obtainedMarks;
    }

    if (mark.isAbsent || mark.obtainedMarks < mark.passingMarks) {
      subjectsFailed++;
    }
  });

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  // Excel-based term result logic
  let status: 'pass' | 'fail' = 'pass';
  
  // If 4 or more subjects are absent → Fail
  if (subjectsAbsent >= 4) {
    status = 'fail';
  }
  // If 2 or 3 subjects are absent → Fail
  else if (subjectsAbsent >= 2 && subjectsAbsent <= 3) {
    status = 'fail';
  }
  // If 2 or more subjects are failed → Fail
  else if (subjectsFailed >= 2) {
    status = 'fail';
  }
  // If 1 fail and 1 absent → Fail
  else if (subjectsFailed === 1 && subjectsAbsent === 1) {
    status = 'fail';
  }
  // If overall percentage below 33% → Fail
  else if (percentage < 33) {
    status = 'fail';
  }
  // Else → Pass
  else {
    status = 'pass';
  }

  return {
    termName: '',
    marks,
    totalMarks,
    obtainedMarks,
    percentage: Math.round(percentage * 100) / 100,
    subjectsFailed,
    status,
  };
}

export function calculateFinalResult(
  term1: TermResult | null,
  term2: TermResult | null,
  term3: TermResult | null
): {
  totalMarks: number;
  obtainedMarks: number;
  finalPercentage: number;
  finalGrade: string;
  status: 'pass' | 'fail' | 'promoted' | 'absent';
  remarks: string;
} {
  const terms = [term1, term2, term3].filter((t) => t !== null) as TermResult[];

  if (terms.length === 0) {
    return {
      totalMarks: 0,
      obtainedMarks: 0,
      finalPercentage: 0,
      finalGrade: 'N/A',
      status: 'fail',
      remarks: 'No term results available',
    };
  }

  // Excel-based calculation logic
  let totalMarks = 0;
  let obtainedMarks = 0;
  let totalAbsentSubjects = 0;
  let totalFailedSubjects = 0;
  let hasAbsentInTerm = false;
  let hasFailedInTerm = false;

  // Calculate term-wise averages and track absences/failures
  terms.forEach((term) => {
    totalMarks += term.totalMarks;
    obtainedMarks += term.obtainedMarks;
    
    // Count absent subjects in this term
    const absentInTerm = term.marks.filter(mark => mark.isAbsent).length;
    totalAbsentSubjects += absentInTerm;
    
    // Count failed subjects in this term
    const failedInTerm = term.marks.filter(mark => 
      mark.isAbsent || mark.obtainedMarks < mark.passingMarks
    ).length;
    totalFailedSubjects += failedInTerm;
    
    if (absentInTerm > 0) hasAbsentInTerm = true;
    if (failedInTerm > 0) hasFailedInTerm = true;
  });

  const finalPercentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

  let finalGrade = 'F';
  if (finalPercentage >= 90) finalGrade = 'A+';
  else if (finalPercentage >= 80) finalGrade = 'A';
  else if (finalPercentage >= 70) finalGrade = 'B';
  else if (finalPercentage >= 60) finalGrade = 'C';
  else if (finalPercentage >= 50) finalGrade = 'D';
  else if (finalPercentage >= 33) finalGrade = 'E';

  // Excel-based pass/fail rules
  let status: 'pass' | 'fail' | 'promoted' | 'absent' = 'pass';
  let remarks = 'Passed';

  // Rule 1: If 4 or more subjects are Absent → Final Result = Absent
  if (totalAbsentSubjects >= 4) {
    status = 'absent';
    remarks = 'Absent (4 or more subjects absent)';
  }
  // Rule 2: If 2 or 3 subjects are Absent → Final Result = Fail
  else if (totalAbsentSubjects >= 2 && totalAbsentSubjects <= 3) {
    status = 'fail';
    remarks = 'Failed (2-3 subjects absent)';
  }
  // Rule 3: If 2 or more subjects are Failed → Final Result = Fail
  else if (totalFailedSubjects >= 2) {
    status = 'fail';
    remarks = 'Failed (2 or more subjects failed)';
  }
  // Rule 4: If 1 Fail and 1 Absent → Final Result = Fail
  else if (totalFailedSubjects === 1 && totalAbsentSubjects === 1) {
    status = 'fail';
    remarks = 'Failed (1 fail and 1 absent)';
  }
  // Rule 5: If overall percentage below 33% → Final Result = Fail
  else if (finalPercentage < 33) {
    status = 'fail';
    remarks = 'Failed (Overall percentage below 33%)';
  }
  // Rule 6: Else → Final Result = Pass/Promoted
  else {
    status = 'promoted';
    remarks = 'Promoted to next class';
  }

  return {
    totalMarks,
    obtainedMarks,
    finalPercentage: Math.round(finalPercentage * 100) / 100,
    finalGrade,
    status,
    remarks,
  };
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-700 bg-green-100';
    case 'B':
      return 'text-blue-700 bg-blue-100';
    case 'C':
      return 'text-yellow-700 bg-yellow-100';
    case 'D':
    case 'E':
      return 'text-orange-700 bg-orange-100';
    case 'F':
      return 'text-red-700 bg-red-100';
    case 'ABS':
      return 'text-gray-700 bg-gray-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pass':
    case 'promoted':
      return 'text-green-700 bg-green-100';
    case 'fail':
      return 'text-red-700 bg-red-100';
    case 'absent':
      return 'text-gray-700 bg-gray-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}

// Excel-based averaging functions
export function calculateSecondTermAverage(term1Total: number, term2Total: number): number {
  return (term1Total + term2Total) / 2;
}

export function calculateThirdTermAverage(term1Total: number, term2Total: number, term3Total: number): number {
  return (term1Total + term2Total + term3Total) / 3;
}

// Function to calculate term-wise totals from marks
export function calculateTermTotal(marks: SubjectMark[]): number {
  return marks.reduce((total, mark) => {
    if (mark.isAbsent) {
      return total; // Absent marks don't count in total
    }
    return total + mark.obtainedMarks;
  }, 0);
}

// Function to get all subjects for a class
export function getClassSubjects(marks: SubjectMark[]): string[] {
  return [...new Set(marks.map(mark => mark.subjectName))];
}

// Function to check if student should be promoted based on final result
export function shouldPromoteStudent(finalResult: {
  status: 'pass' | 'fail' | 'promoted' | 'absent';
  finalPercentage: number;
}): boolean {
  return finalResult.status === 'promoted' && finalResult.finalPercentage >= 33;
}

// Function to generate report card data
export function generateReportCardData(
  studentName: string,
  rollNumber: string,
  className: string,
  term1Marks: SubjectMark[],
  term2Marks: SubjectMark[],
  term3Marks: SubjectMark[]
) {
  const term1Result = calculateTermResult(term1Marks);
  const term2Result = calculateTermResult(term2Marks);
  const term3Result = calculateTermResult(term3Marks);
  
  const finalResult = calculateFinalResult(term1Result, term2Result, term3Result);
  
  const term1Total = calculateTermTotal(term1Marks);
  const term2Total = calculateTermTotal(term2Marks);
  const term3Total = calculateTermTotal(term3Marks);
  
  const secondTermAverage = calculateSecondTermAverage(term1Total, term2Total);
  const thirdTermAverage = calculateThirdTermAverage(term1Total, term2Total, term3Total);
  
  return {
    studentInfo: {
      name: studentName,
      rollNumber,
      className
    },
    termResults: {
      term1: {
        total: term1Total,
        percentage: term1Result.percentage,
        status: term1Result.status,
        average: term1Total
      },
      term2: {
        total: term2Total,
        percentage: term2Result.percentage,
        status: term2Result.status,
        average: secondTermAverage
      },
      term3: {
        total: term3Total,
        percentage: term3Result.percentage,
        status: term3Result.status,
        average: thirdTermAverage
      }
    },
    finalResult: {
      totalMarks: finalResult.totalMarks,
      obtainedMarks: finalResult.obtainedMarks,
      percentage: finalResult.finalPercentage,
      grade: finalResult.finalGrade,
      status: finalResult.status,
      remarks: finalResult.remarks,
      promotionStatus: shouldPromoteStudent(finalResult)
    },
    subjectMarks: {
      term1: term1Marks,
      term2: term2Marks,
      term3: term3Marks
    }
  };
}
