import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { HabitWithEntry } from '@/types/habit';

export function generateHabitReport(habit: HabitWithEntry, rate: number, monthDone: number, monthRate: number) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(22);
  doc.setTextColor(50, 50, 50);
  doc.text(`Habit Report: ${habit.name}`, 14, 20);

  // Description
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const descriptionText = habit.description || 'No notes provided.';
  doc.text(descriptionText, 14, 30, { maxWidth: 180 });

  let currentY = 35;
  if (habit.description) {
    // estimate height of text
    const splitText = doc.splitTextToSize(descriptionText, 180);
    currentY += splitText.length * 5 + 5;
  }

  // Stats
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('Key Statistics', 14, currentY);

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Current Streak', 'Longest Streak', '30-Day Rate', 'Total Done']],
    body: [
      [`${habit.current_streak} days`, `${habit.longest_streak} days`, `${rate}%`, `${habit.total_completions}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || currentY + 5;

  doc.text('Monthly Overview', 14, finalY + 15);
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Month Completions', 'Month Rate']],
    body: [
      [`${monthDone}`, `${monthRate}%`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const dateStr = new Date().toLocaleDateString();
  doc.text(`Generated on ${dateStr}`, 14, pageHeight - 10);

  doc.save(`${habit.name.toLowerCase().replace(/\s+/g, '-')}-report.pdf`);
}
