import puppeteer from 'puppeteer';
import { uploadFile } from './s3Service';
import { IAssessment } from '../models/Assessment';
import Settings from '../models/Settings';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Renders the assessment document as HTML and uses Puppeteer to compile it into an A4 PDF.
 * Saves the PDF to S3 and returns the file URL.
 */
export const generateAssessmentPDF = async (assessment: IAssessment): Promise<string> => {
  // Fetch dynamic settings from database
  let schoolName = 'Delhi Public School';
  let schoolAddress = 'Sector-4, Bokaro';
  let subject = assessment.subject || 'Science';
  let className = assessment.className || '8th';

  try {
    const dbSettings = await Settings.findOne();
    if (dbSettings) {
      schoolName = dbSettings.schoolName;
      schoolAddress = dbSettings.schoolAddress;
    }
  } catch (err) {
    console.error('Failed to load settings in pdfService, using defaults:', err);
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Compile dynamic question list
    let sectionsHtml = '';
    assessment.sections.forEach((sec) => {
      let questionsHtml = '';
      sec.questions.forEach((q, index) => {
        const difficultyBadge = `[${q.difficulty}]`;
        const optionsList = q.options && q.options.length > 0
          ? `<ul class="list-none pl-6 grid grid-cols-2 gap-2 mt-1">
               ${q.options.map((opt, i) => `<li class="text-sm font-serif">(${String.fromCharCode(97 + i)}) ${opt}</li>`).join('')}
             </ul>`
          : '';

        questionsHtml += `
          <div class="mb-4 break-inside-avoid">
            <div class="flex justify-between items-start">
              <span class="text-base font-serif font-medium w-full text-justify">
                ${index + 1}. <span class="font-sans text-xs uppercase tracking-wider text-slate-500 font-bold mr-1">${difficultyBadge}</span> ${q.text}
              </span>
              <span class="text-sm font-serif font-semibold whitespace-nowrap ml-4">[${q.marks} Mark${q.marks > 1 ? 's' : ''}]</span>
            </div>
            ${optionsList}
          </div>
        `;
      });

      sectionsHtml += `
        <div class="mb-6 break-inside-avoid-page">
          <h2 class="text-lg font-serif font-bold border-b border-black pb-1 mb-2 mt-4 text-center uppercase tracking-wide">
            ${sec.title}
          </h2>
          <p class="text-xs font-serif italic text-slate-600 mb-3">${sec.instructions}</p>
          <div class="space-y-1">
            ${questionsHtml}
          </div>
        </div>
      `;
    });

    // Compile answer key page
    let answerKeyHtml = '';
    if (assessment.answerKey && assessment.answerKey.length > 0) {
      const answerItemsHtml = assessment.answerKey
        .map(
          (ans) => `
        <div class="mb-4 break-inside-avoid">
          <p class="font-serif font-bold text-sm text-slate-800">${ans.questionIndex}:</p>
          <p class="font-serif text-sm text-slate-700 pl-4 mt-1">${ans.answerText}</p>
        </div>
      `
        )
        .join('');

      answerKeyHtml = `
        <div class="page-break" style="page-break-before: always;"></div>
        <div class="mt-8">
          <h1 class="text-xl font-serif font-bold text-center border-b-2 border-black pb-2 mb-6 tracking-wide uppercase">
            Answer Key & Guidelines
          </h1>
          <div class="space-y-3">
            ${answerItemsHtml}
          </div>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${assessment.title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
          
          body {
            font-family: 'Inter', sans-serif;
            background: white;
            color: black;
          }
          .font-serif {
            font-family: 'Lora', serif;
          }
          .font-header {
            font-family: 'Cinzel', serif;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .break-inside-avoid-page {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body class="p-8 max-w-[800px] mx-auto">
        <!-- School Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-header font-bold tracking-wider text-slate-900">
            ${schoolName}, ${schoolAddress}
          </h1>
          <p class="text-sm uppercase tracking-widest text-slate-600 font-semibold mt-1">
            Subject: ${subject} &bull; Class: ${className}
          </p>
        </div>

        <!-- Exam Parameters -->
        <div class="flex justify-between border-y border-black py-2 mb-6 font-serif font-semibold text-sm">
          <span>Time Allowed: 45 minutes</span>
          <span>Maximum Marks: ${assessment.criteria.totalMarks}</span>
        </div>

        <!-- General Instructions -->
        <div class="mb-6 font-serif text-xs border-b border-dashed border-slate-300 pb-4">
          <p class="font-bold mb-1">General Instructions:</p>
          <ul class="list-disc pl-5 space-y-0.5 text-slate-700">
            <li>All questions are compulsory unless stated otherwise.</li>
            <li>Write your credentials clearly in the provided lines.</li>
            <li>Maintain clean writing and structured margins.</li>
          </ul>
        </div>

        <!-- Student credentials details -->
        <div class="grid grid-cols-3 gap-4 mb-8 font-serif text-sm border border-slate-300 p-4 rounded-md">
          <div class="flex items-center">
            <span class="mr-2">Name:</span>
            <div class="border-b border-black flex-grow h-5"></div>
          </div>
          <div class="flex items-center">
            <span class="mr-2">Roll Number:</span>
            <div class="border-b border-black flex-grow h-5"></div>
          </div>
          <div class="flex items-center">
            <span class="mr-2">Section:</span>
            <div class="border-b border-black flex-grow h-5"></div>
          </div>
        </div>

        <!-- Assessment Body -->
        <div class="assessment-content">
          ${sectionsHtml}
        </div>

        <!-- End of Paper Indicator -->
        <div class="text-center font-serif font-bold text-slate-500 uppercase tracking-widest my-8 border-t border-dashed border-slate-300 pt-4 break-inside-avoid">
          --- End of Question Paper ---
        </div>

        <!-- Answer Key -->
        ${answerKeyHtml}
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate standard PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm'
      },
      printBackground: true
    });

    await browser.close();

    // Upload to S3/local storage fallback
    const pdfUrl = await uploadFile(pdfBuffer, `assessment-${assessment._id}.pdf`, 'application/pdf');

    // Save S3 link back to DB
    assessment.pdfUrl = pdfUrl;
    await assessment.save();

    return pdfUrl;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Puppeteer PDF generation failed:', error);
    throw error;
  }
};
