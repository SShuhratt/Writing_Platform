import { jsPDF } from 'jspdf';
import { SubmissionReport } from '@/types/ielts';

/**
 * Generates an official-grade IELTS Test Report Form (TRF) style PDF document
 * and triggers immediate client-side download.
 */
export function generateIELTSReportPDF(report: SubmissionReport, candidateName?: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let cursorY = margin;

  // Helper to ensure text fits on the page or adds a new page
  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 5;
      renderPageHeader();
    }
  };

  const renderPageHeader = () => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, cursorY, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('IELTS WRITING PLATFORM • OFFICIAL ASSESSMENT REPORT (CONTINUED)', margin + 3, cursorY + 5.5);
    cursorY += 12;
  };

  // --- PAGE 1: OFFICIAL ASSESSMENT CERTIFICATE & CRITERIA BREAKDOWN ---
  
  // 1. Top Decorative Brand Banner
  doc.setFillColor(30, 27, 75); // indigo-950
  doc.rect(margin, cursorY, contentWidth, 24, 'F');

  // Accent band color bar
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(margin, cursorY + 23, contentWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('IELTS WRITING EVALUATION REPORT', margin + 6, cursorY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Dual-Layer Socratic & Examiner Assessment • Aligned with Cambridge IELTS Rubrics', margin + 6, cursorY + 16);

  cursorY += 28;

  // 2. Candidate & Task Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, cursorY, contentWidth, 26, 2, 2, 'FD');

  const col1X = margin + 5;
  const col2X = margin + 70;
  const col3X = margin + 130;

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CANDIDATE NAME:', col1X, cursorY + 6);
  doc.text('DATE & TIME:', col2X, cursorY + 6);
  doc.text('ASSISTANCE MODE:', col3X, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(candidateName || 'IELTS Candidate', col1X, cursorY + 11);
  doc.text(new Date(report.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), col2X, cursorY + 11);
  doc.text(report.modeAtSubmission === 'ACTIVE_ASSISTANT' ? 'Active Socratic Mentor' : 'Focus Exam Mode', col3X, cursorY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TASK PROMPT:', col1X, cursorY + 18);
  doc.text('WORD COUNT:', col3X, cursorY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const promptTruncated = doc.splitTextToSize(report.taskPrompt.title, 110);
  doc.text(promptTruncated[0] || report.taskPrompt.title, col1X, cursorY + 23);
  doc.text(`${report.wordCount} words (Min ${report.taskPrompt.minWordCount})`, col3X, cursorY + 23);

  cursorY += 30;

  // 3. Overall Band Score & Target Alignment Badge Section
  const overallBand = report.layer1ExaminerReport.overallBand;
  const targetBandNum = parseFloat(report.targetBandAtSubmission);
  const status = report.layer2AlignmentReport.targetStatus;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

  // Left Score Badge
  doc.setFillColor(245, 158, 11); // amber-500
  doc.roundedRect(margin + 4, cursorY + 3, 28, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(overallBand.toFixed(1), margin + 18, cursorY + 15, { align: 'center' });

  // Score Details
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Official IELTS Overall Band Score: ${overallBand.toFixed(1)}`, margin + 36, cursorY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Selected Target: Band ${report.targetBandAtSubmission} • Standard 4-Criteria Half-Band Rounding Applied`, margin + 36, cursorY + 15);

  // Status Chip on Right
  let statusText = 'TARGET ACHIEVED';
  let statusBg = [16, 185, 129]; // emerald
  if (status === 'EXCEEDED_TARGET') {
    statusText = `EXCEEDED TARGET (+${(overallBand - targetBandNum).toFixed(1)})`;
    statusBg = [147, 51, 234]; // purple
  } else if (status === 'TARGET_NOT_MET') {
    statusText = `TARGET NOT MET (-${(targetBandNum - overallBand).toFixed(1)})`;
    statusBg = [217, 119, 6]; // amber
  }

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(pageWidth - margin - 52, cursorY + 6, 48, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, pageWidth - margin - 28, cursorY + 11.5, { align: 'center' });

  cursorY += 28;

  // 4. Layer 1: 4 Criteria Breakdown Grid (2x2)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Layer 1: Official IELTS Criteria Evaluation', margin, cursorY);
  cursorY += 4;

  const cardW = (contentWidth - 4) / 2;
  const cardH = 34;

  const criteria = [
    {
      title: 'Task Achievement / Response',
      score: report.layer1ExaminerReport.taskResponse.score,
      comment: report.layer1ExaminerReport.taskResponse.commentary,
      strengths: report.layer1ExaminerReport.taskResponse.keyStrengths,
      weaknesses: report.layer1ExaminerReport.taskResponse.keyWeaknesses
    },
    {
      title: 'Coherence & Cohesion',
      score: report.layer1ExaminerReport.coherenceCohesion.score,
      comment: report.layer1ExaminerReport.coherenceCohesion.commentary,
      strengths: report.layer1ExaminerReport.coherenceCohesion.keyStrengths,
      weaknesses: report.layer1ExaminerReport.coherenceCohesion.keyWeaknesses
    },
    {
      title: 'Lexical Resource',
      score: report.layer1ExaminerReport.lexicalResource.score,
      comment: report.layer1ExaminerReport.lexicalResource.commentary,
      strengths: report.layer1ExaminerReport.lexicalResource.keyStrengths,
      weaknesses: report.layer1ExaminerReport.lexicalResource.keyWeaknesses
    },
    {
      title: 'Grammatical Range & Accuracy',
      score: report.layer1ExaminerReport.grammaticalAccuracy.score,
      comment: report.layer1ExaminerReport.grammaticalAccuracy.commentary,
      strengths: report.layer1ExaminerReport.grammaticalAccuracy.keyStrengths,
      weaknesses: report.layer1ExaminerReport.grammaticalAccuracy.keyWeaknesses
    }
  ];

  criteria.forEach((c, idx) => {
    const isRight = idx % 2 === 1;
    const isBottom = idx >= 2;
    const cX = isRight ? margin + cardW + 4 : margin;
    const cY = isBottom ? cursorY + cardH + 4 : cursorY;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cX, cY, cardW, cardH, 1.5, 1.5, 'FD');

    // Criteria Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(c.title, cX + 3, cY + 5.5);

    // Pill
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(cX + cardW - 20, cY + 2.5, 17, 5, 1, 1, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Band ${c.score.toFixed(1)}`, cX + cardW - 11.5, cY + 6, { align: 'center' });

    // Commentary
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const commentLines = doc.splitTextToSize(c.comment, cardW - 6);
    doc.text(commentLines.slice(0, 2), cX + 3, cY + 11.5);

    // Strengths
    if (c.strengths && c.strengths[0]) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('Key Strength: ', cX + 3, cY + 23);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const strText = doc.splitTextToSize(c.strengths[0], cardW - 24);
      doc.text(strText[0] || c.strengths[0], cX + 22, cY + 23);
    }

    // Weaknesses
    if (c.weaknesses && c.weaknesses[0]) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text('Focus Area: ', cX + 3, cY + 29);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const wText = doc.splitTextToSize(c.weaknesses[0], cardW - 22);
      doc.text(wText[0] || c.weaknesses[0], cX + 20, cY + 29);
    }
  });

  cursorY += (cardH * 2) + 8;

  // 5. Examiner Summary Callout
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text('EXAMINER SYNTHESIS:', margin + 4, cursorY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const examinerLines = doc.splitTextToSize(report.layer1ExaminerReport.examinerSummary, contentWidth - 8);
  doc.text(examinerLines.slice(0, 3), margin + 4, cursorY + 10.5);

  cursorY += 22;

  // 6. Layer 2: Gap Analysis & Actionable Roadmap
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Layer 2: Target Alignment & Roadmap', margin, cursorY);
  cursorY += 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`ALIGNMENT AUDIT (TARGET: BAND ${report.targetBandAtSubmission}):`, margin + 4, cursorY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const gapLines = doc.splitTextToSize(report.layer2AlignmentReport.gapAnalysis, contentWidth - 8);
  doc.text(gapLines.slice(0, 2), margin + 4, cursorY + 10.5);

  if (report.layer2AlignmentReport.actionableRoadmap && report.layer2AlignmentReport.actionableRoadmap.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Action Roadmap: 1. ' + (report.layer2AlignmentReport.actionableRoadmap[0] || ''), margin + 4, cursorY + 19);
  }

  cursorY += 30;

  // --- PAGE 2: FULL ESSAY TRANSCRIPT & DETAILED PARAGRAPH AUDIT ---
  doc.addPage();
  cursorY = margin;

  // Header on Page 2
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, contentWidth, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('CANDIDATE SUBMISSION TRANSCRIPT & PARAGRAPH AUDIT', margin + 4, cursorY + 8);
  cursorY += 16;

  // Prompt Full Text Reference Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 18, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('OFFICIAL PROMPT QUESTION:', margin + 3, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const questionLines = doc.splitTextToSize(report.taskPrompt.questionText, contentWidth - 6);
  doc.text(questionLines.slice(0, 2), margin + 3, cursorY + 10);
  cursorY += 22;

  // Paragraph-by-Paragraph Alignment Breakdown
  if (report.layer2AlignmentReport.paragraphAudits && report.layer2AlignmentReport.paragraphAudits.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Paragraph Alignment Breakdown', margin, cursorY);
    cursorY += 4;

    report.layer2AlignmentReport.paragraphAudits.forEach((audit) => {
      checkPageBreak(14);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, contentWidth, 11, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Paragraph ${audit.paragraphNumber}:`, margin + 3, cursorY + 4.5);

      let pStatusColor = [16, 185, 129];
      if (audit.status === 'EXCEEDED') pStatusColor = [147, 51, 234];
      if (audit.status === 'BELOW') pStatusColor = [217, 119, 6];

      doc.setFillColor(pStatusColor[0], pStatusColor[1], pStatusColor[2]);
      doc.roundedRect(margin + contentWidth - 25, cursorY + 2, 22, 4.5, 0.8, 0.8, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(audit.status === 'MET' ? 'Target Met' : audit.status === 'EXCEEDED' ? 'Exceeded' : 'Below Target', margin + contentWidth - 14, cursorY + 5.2, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      const auditLines = doc.splitTextToSize(audit.analysis, contentWidth - 34);
      doc.text(auditLines[0] || audit.analysis, margin + 26, cursorY + 4.5);

      cursorY += 13;
    });
  }

  cursorY += 2;
  checkPageBreak(30);

  // Full Essay Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Submitted Essay Text (${report.wordCount} words)`, margin, cursorY);
  cursorY += 4;

  const essayParas = report.essayText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  essayParas.forEach((pText) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const wrapped = doc.splitTextToSize(pText.trim(), contentWidth - 6);
    const paraHeight = (wrapped.length * 3.8) + 4;

    checkPageBreak(paraHeight);

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, paraHeight, 1, 1, 'FD');

    doc.text(wrapped, margin + 3, cursorY + 3.8);
    cursorY += paraHeight + 2.5;
  });

  // Footer Certificate Seal on Bottom of Page
  checkPageBreak(12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated by IELTS Writing Assistant Platform • Verification Timestamp: ${new Date(report.timestamp).toISOString()}`, margin, pageHeight - margin + 2);

  // Trigger browser download
  const filename = `IELTS_Assessment_Band_${overallBand.toFixed(1)}_${report.taskPrompt.type}_${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Builds a Telegram share URL and rich text payload for instant one-click sharing
 */
export function generateTelegramShareData(report: SubmissionReport, candidateName?: string): {
  shareUrl: string;
  shareText: string;
} {
  const overall = report.layer1ExaminerReport.overallBand.toFixed(1);
  const target = report.targetBandAtSubmission;
  const status = report.layer2AlignmentReport.targetStatus;
  
  let statusEmoji = '🎯';
  let statusLabel = 'Target Achieved!';
  if (status === 'EXCEEDED_TARGET') {
    statusEmoji = '🏆';
    statusLabel = 'Exceeded Target Band!';
  } else if (status === 'TARGET_NOT_MET') {
    statusEmoji = '📈';
    statusLabel = 'In Progress (Target Not Yet Met)';
  }

  const appUrl = 'https://writing-platform-git-main-sshuhratts-projects.vercel.app/workspace';

  const shareText = `🎓 *IELTS Writing Assessment Result*
━━━━━━━━━━━━━━━━━━━━
👤 *Candidate:* ${candidateName || 'Student'}
📝 *Task:* ${report.taskPrompt.title} (${report.taskPrompt.type === 'TASK_2_ESSAY' ? 'Task 2 Essay' : 'Task 1'})
🎯 *Target Band:* Band ${target}
${statusEmoji} *Achieved Score:* *Band ${overall}* (${statusLabel})

📊 *Official Criteria Breakdown:*
• Task Achievement / Response: Band ${report.layer1ExaminerReport.taskResponse.score.toFixed(1)}
• Coherence & Cohesion: Band ${report.layer1ExaminerReport.coherenceCohesion.score.toFixed(1)}
• Lexical Resource: Band ${report.layer1ExaminerReport.lexicalResource.score.toFixed(1)}
• Grammatical Accuracy: Band ${report.layer1ExaminerReport.grammaticalAccuracy.score.toFixed(1)}

✍️ *Length:* ${report.wordCount} words
⏱️ *Mode:* ${report.modeAtSubmission === 'ACTIVE_ASSISTANT' ? 'Active Socratic Mentor' : 'Focus Exam Mode'}
━━━━━━━━━━━━━━━━━━━━
✨ *Practice & Assessment on IELTS Mentor:*
${appUrl}`;

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;

  return { shareUrl, shareText };
}
