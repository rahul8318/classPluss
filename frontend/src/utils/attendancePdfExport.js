import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates an official, publication-quality ClassPulse Attendance PDF Report
 * 
 * @param {Object} params
 * @param {Object} params.course - Course object with title, code, term, teacher name
 * @param {Array} params.report - Array of student attendance performance items
 * @param {Array} params.records - Array of attendance records / sessions
 * @param {Number} params.totalClasses - Total number of sessions
 */
export function exportAttendancePdf({ course, report, records, totalClasses }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [79, 70, 229]; // Indigo / Brand #4F46E5
  const darkSlate = [30, 41, 59];
  const mutedSlate = [100, 116, 139];
  const accentRed = [225, 29, 72];
  const accentGreen = [16, 185, 129];

  // Document Dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Top Decorative Brand Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 6, 'F');

  // 2. Institution / Header Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text('ClassPulse', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedSlate);
  doc.text('Interactive Classroom & AI Learning Platform', margin, 23);

  // Report Title (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkSlate);
  doc.text('OFFICIAL ATTENDANCE REGISTER', pageWidth - margin, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedSlate);
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${generatedDate}`, pageWidth - margin, 23, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 26, pageWidth - margin, 26);

  // 3. Course Information Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 29, pageWidth - (margin * 2), 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkSlate);
  doc.text(course?.title || 'Course Attendance Report', margin + 4, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedSlate);
  doc.text(`Course Code: ${course?.code || 'N/A'}    |    Term: ${course?.term || 'Fall 2026'}    |    Subject: ${course?.subject || 'General'}`, margin + 4, 42);
  doc.text(`Instructor: ${course?.teacherId?.name || 'Dr. Jane Smith'}    |    Total Sessions Held: ${totalClasses || 0}`, margin + 4, 48);

  // 4. Summary Metric Cards
  const avgAttendance = report && report.length > 0
    ? Math.round(report.reduce((acc, curr) => acc + (curr.stats.attendancePercentage || 0), 0) / report.length)
    : 100;
  const lowAttendanceCount = report ? report.filter((r) => r.stats.isLowAttendance).length : 0;

  const cardWidth = (pageWidth - (margin * 2) - 9) / 4;
  const cardY = 56;
  const cardHeight = 16;

  const metrics = [
    { label: 'TOTAL STUDENTS', value: `${report?.length || 0}`, color: darkSlate },
    { label: 'SESSIONS RECORDED', value: `${totalClasses || 0}`, color: primaryColor },
    { label: 'COURSE AVG ATTENDANCE', value: `${avgAttendance}%`, color: accentGreen },
    { label: 'AT-RISK (<75%)', value: `${lowAttendanceCount}`, color: lowAttendanceCount > 0 ? accentRed : accentGreen },
  ];

  metrics.forEach((m, idx) => {
    const x = margin + (idx * (cardWidth + 3));
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedSlate);
    doc.text(m.label, x + 3, cardY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...m.color);
    doc.text(m.value, x + 3, cardY + 12);
  });

  // 5. Section Heading: Student Performance Roster
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkSlate);
  doc.text('Student Attendance Performance & Roster', margin, 78);

  // 6. Student Roster Table
  const tableData = (report || []).map((item, index) => {
    const statusText = item.stats.isLowAttendance ? 'CRITICAL (<75%)' : 'REGULAR';
    return [
      (index + 1).toString(),
      item.student?.name || 'Student',
      item.student?.email || 'N/A',
      item.stats.presentCount.toString(),
      item.stats.lateCount.toString(),
      item.stats.absentCount.toString(),
      item.stats.excusedCount.toString(),
      `${item.stats.attendancePercentage}%`,
      statusText,
    ];
  });

  autoTable(doc, {
    startY: 81,
    margin: { left: margin, right: margin },
    head: [['#', 'Student Name', 'Email Address', 'Present', 'Late', 'Absent', 'Excused', 'Rate %', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      textColor: darkSlate,
      cellPadding: 2.2,
      lineColor: [241, 245, 249],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      8: { halign: 'center', cellWidth: 26 },
    },
    didParseCell: (data) => {
      // Color rate and status column
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'CRITICAL (<75%)') {
          data.cell.styles.textColor = accentRed;
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = accentGreen;
        }
      }
    },
  });

  // 7. Recent Sessions Summary Table (if space permits or on subsequent section)
  const currentY = doc.lastAutoTable.finalY + 10;
  if (currentY < pageHeight - 50) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...darkSlate);
    doc.text('Recorded Class Sessions Log', margin, currentY);

    const sessionData = (records || []).slice(0, 8).map((rec, i) => [
      (i + 1).toString(),
      rec.classDate || 'N/A',
      rec.title || 'Class Session',
      `${rec.records?.length || 0} Students`,
      rec.isConfirmed ? 'Verified Official' : 'Draft / Live Session',
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      margin: { left: margin, right: margin },
      head: [['#', 'Date', 'Session Title / Topic', 'Attendance Count', 'Audit Status']],
      body: sessionData,
      theme: 'striped',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        textColor: darkSlate,
        cellPadding: 2,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 24 },
        3: { halign: 'center', cellWidth: 28 },
        4: { halign: 'center', cellWidth: 32 },
      },
    });
  }

  // 8. Security & Anti-Proxy Notice and Signature Line
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : pageHeight - 35;

  if (finalY < pageHeight - 25) {
    // Anti-Proxy Verification Stamp
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, finalY, 110, 16, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.text('AUTHENTICATED INSTITUTIONAL RECORD', margin + 3, finalY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedSlate);
    doc.text('Anti-Proxy Security: Unique device fingerprints & IP collision detection active.', margin + 3, finalY + 8.5);
    doc.text('Duplicate attendance submissions and proxy check-ins strictly prohibited by system policy.', margin + 3, finalY + 12);

    // Instructor Signature Line
    const sigX = pageWidth - margin - 55;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.4);
    doc.line(sigX, finalY + 10, pageWidth - margin, finalY + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...darkSlate);
    doc.text('Instructor Signature / Certification', sigX, finalY + 14);
  }

  // 9. Footer with Page Numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mutedSlate);
    doc.text(
      `ClassPulse Official Academic Register — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Save the PDF with standardized filename
  const safeCode = (course?.code || 'COURSE').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];
  doc.save(`ClassPulse_Attendance_${safeCode}_${safeDate}.pdf`);
}
