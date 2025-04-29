// @ts-ignore
import * as htmlToPdf from "html-pdf-node";
import { format } from "date-fns";
import { Resend } from 'resend';
import Epub from 'epub-gen';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { JSDOM } from 'jsdom';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Fallback to console if Resend API key is not available
const sendEmail = async (options: {
  from: string;
  to: string;
  subject: string;
  text: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}) => {
  if (!process.env.RESEND_API_KEY) {
    console.log("No Resend API key provided. Email would be sent with:", options);
    return { id: "dev-mode" };
  }
  
  try {
    // Resend doesn't directly handle raw Buffer attachments the same way nodemailer does,
    // so we convert the Buffer to base64
    const formattedAttachments = options.attachments.map(attachment => ({
      filename: attachment.filename,
      content: attachment.content.toString('base64'),
      type: attachment.contentType
    }));
    
    const response = await resend.emails.send({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      attachments: formattedAttachments,
    });
    
    return response;
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    throw new Error("Failed to send email");
  }
};

// Generate HTML for the newspaper with the new structure
const generateHtml = (articles: any[], options: { username: string; date: string }) => {
  const css = `
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .cover-page {
      text-align: center;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border-bottom: 3px solid #1A2A44;
      page-break-after: always;
    }
    .toc-page {
      padding: 40px 0;
      page-break-after: always;
    }
    .toc-title {
      font-size: 24px;
      font-weight: bold;
      color: #1A2A44;
      margin-bottom: 20px;
      text-align: center;
    }
    .toc-item {
      margin-bottom: 15px;
      font-size: 16px;
    }
    .toc-category {
      color: #666;
      font-size: 14px;
      margin-left: 10px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #1A2A44;
    }
    .date {
      color: #666;
      font-size: 18px;
      margin-top: 5px;
    }
    .title {
      font-size: 42px;
      font-weight: bold;
      color: #1A2A44;
      margin: 20px 0;
    }
    .subtitle {
      font-size: 20px;
      color: #666;
      margin-bottom: 20px;
    }
    .article {
      padding: 30px 0;
      page-break-before: always;
    }
    .article-title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #1A2A44;
    }
    .article-metadata {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
    }
    .article-summary {
      line-height: 1.8;
      font-size: 16px;
    }
    .article-link {
      margin-top: 20px;
      font-size: 14px;
    }
    .article-link a {
      color: #4A90E2;
      text-decoration: none;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #1A2A44;
      font-size: 14px;
      color: #666;
    }
  `;

  // Cover page
  const coverPage = `
    <div class="cover-page">
      <div class="cover-content">
        <div class="title">Inkless News</div>
        <div class="date">${options.date}</div>
        <div class="subtitle">Your Personalized Newspaper</div>
      </div>
    </div>
  `;

  // Table of contents
  const tableOfContents = `
    <div class="toc-page">
      <div class="toc-title">Today's Articles</div>
      <div class="toc-list">
        ${articles.map((article, index) => `
          <div class="toc-item">
            <a href="#article-${index + 1}" style="text-decoration: none; color: inherit;">
              ${index + 1}. ${article.title}
              <span class="toc-category">(${article.category})</span>
            </a>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Articles
  const articlesHtml = articles.map((article, index) => `
    <div id="article-${index + 1}" class="article">
      <div class="article-title">${article.title}</div>
      <div class="article-metadata">
        <span>${article.source}</span>
        <span>${article.category}</span>
      </div>
      <div class="article-summary">${article.summary}</div>
      <div class="article-link">
        <a href="${article.url}">Read the full article</a>
      </div>
    </div>
  `).join('');

  // Footer
  const footer = `
    <div class="footer">
      <p>Inkless News - Curated by AI for ${options.username}</p>
      <p>Generated on ${options.date}</p>
    </div>
  `;

  // Complete HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Inkless News - ${options.date}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="container">
        ${coverPage}
        ${tableOfContents}
        ${articlesHtml}
        ${footer}
      </div>
    </body>
    </html>
  `;

  return html;
};

// Generate a PDF document from HTML
const generatePdf = async (html: string): Promise<Buffer> => {
  const options = {
    format: 'A4',
    margin: { top: 20, bottom: 20, left: 20, right: 20 }
  };
  
  const file = { content: html };
  
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      htmlToPdf.generatePdf(file, options).then((pdfBuffer: Buffer) => {
        resolve(pdfBuffer);
      }).catch((err: Error) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF document");
  }
};

// Generate a MOBI file (for now we'll use PDF as a fallback)
// In a production app, you'd use a conversion library like Calibre or an external service
const generateMobi = async (html: string): Promise<Buffer> => {
  // For now, we'll just generate a PDF
  console.log("MOBI format requested, but generating PDF as fallback");
  return await generatePdf(html);
};

// Generate an EPUB file with proper internal links
const generateEpub = async (html: string): Promise<Buffer> => {
  try {
    // Create a temporary file path for the EPUB
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'inkless-'));
    const epubPath = path.join(tempDir, 'newspaper.epub');

    // Parse HTML using jsdom
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    
    // Get the title and date
    const title = doc.querySelector('title')?.textContent || 'Inkless News';
    const date = doc.querySelector('.date')?.textContent || format(new Date(), "MMMM d, yyyy");
    
    // Extract articles
    const articles = Array.from(doc.querySelectorAll('.article')).map((article: Element, index) => {
      const titleEl = article.querySelector('.article-title');
      const metadataEl = article.querySelector('.article-metadata');
      const summaryEl = article.querySelector('.article-summary');
      const linkEl = article.querySelector('.article-link');
      
      return {
        title: titleEl?.textContent || `Article ${index + 1}`,
        data: `
          <div class="article-metadata">${metadataEl?.innerHTML || ''}</div>
          <div class="article-summary">${summaryEl?.innerHTML || ''}</div>
          <div class="article-link">${linkEl?.innerHTML || ''}</div>
        `
      };
    });

    // Generate EPUB
    const options = {
      title: title,
      author: 'Inkless News',
      publisher: 'Inkless News',
      content: [
        {
          title: 'Cover',
          data: `
            <div class="cover-page">
              <div class="cover-content">
                <div class="title">Inkless News</div>
                <div class="date">${date}</div>
                <div class="subtitle">Your Personalized Newspaper</div>
              </div>
            </div>
          `
        },
        {
          title: 'Table of Contents',
          data: `
            <div class="toc-page">
              <div class="toc-title">Today's Articles</div>
              <div class="toc-list">
                ${articles.map((article, index) => `
                  <div class="toc-item">
                    <a href="chapter_${index + 2}.xhtml">${index + 1}. ${article.title}</a>
                  </div>
                `).join('')}
              </div>
            </div>
          `
        },
        ...articles
      ],
      css: `
        body {
          font-family: 'Merriweather', 'Georgia', serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.8;
          font-size: 1.1rem;
        }
        .cover-page {
          text-align: center;
          padding: 40px 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f8f8;
        }
        .cover-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          border: 1px solid #e0e0e0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .title {
          font-size: 48px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .date {
          color: #666;
          font-size: 24px;
          margin-bottom: 30px;
          font-style: italic;
        }
        .subtitle {
          font-size: 20px;
          color: #666;
          margin-top: 20px;
        }
        .toc-title {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }
        .toc-item {
          margin-bottom: 15px;
          font-size: 16px;
        }
        .toc-item a {
          color: #666;
          text-decoration: none;
          border-bottom: 1px solid #666;
        }
        .article-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #333;
        }
        .article-metadata {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
          color: #666;
        }
        .article-summary {
          line-height: 1.8;
          font-size: 16px;
          margin-bottom: 20px;
          color: #333;
        }
        .article-link a {
          color: #666;
          text-decoration: none;
          border-bottom: 1px solid #666;
        }
      `
    };

    // Create the EPUB file
    await new Epub(options, epubPath).promise;
    
    // Read the generated EPUB file
    const epubContent = await fs.readFile(epubPath);
    
    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true });
    
    return epubContent;
  } catch (error) {
    console.error("Error generating EPUB:", error);
    throw new Error("Failed to generate EPUB document");
  }
};

// Generate the news document in the requested format
export const generateNewsDocument = async (
  articles: any[],
  options: { username: string; date: string; format: "pdf" | "mobi" | "epub" }
): Promise<Buffer> => {
  const html = generateHtml(articles, options);
  
  if (options.format === "mobi") {
    return await generateMobi(html);
  } else if (options.format === "epub") {
    return await generateEpub(html);
  } else {
    return await generatePdf(html);
  }
};

// Send the email with attachment to Kindle using Resend
export const sendEmailToKindle = async (
  options: { to: string; name: string; document: Buffer; format: "pdf" | "mobi" | "epub" }
): Promise<void> => {
  try {
    const date = format(new Date(), "yyyy-MM-dd");
    const fileName = `inkless_news_${date}.${options.format}`;
    
    const fromEmail = process.env.EMAIL_FROM || "newsletter@jaybuildsthings.com";
    
    // Determine the correct content type for the attachment
    let contentType = "application/pdf";
    if (options.format === "mobi") {
      contentType = "application/x-mobipocket-ebook";
    } else if (options.format === "epub") {
      contentType = "application/epub+zip";
    }
    
    const mailOptions = {
      from: fromEmail,
      to: options.to,
      subject: `Inkless News - ${date}`,
      text: `Your personalized newspaper for ${date}. Open the attached ${options.format.toUpperCase()} file on your Kindle device or app.`,
      attachments: [
        {
          filename: fileName,
          content: options.document,
          contentType: contentType
        }
      ]
    };
    
    const response = await sendEmail(mailOptions);
    // Response can be either a Resend CreateEmailResponse or our fallback { id: string }
    console.log("Email sent successfully with Resend:", 
      'id' in response ? response.id : 'dev-mode');
  } catch (error) {
    console.error("Error sending email to Kindle:", error);
    throw new Error("Failed to send email to Kindle");
  }
};
