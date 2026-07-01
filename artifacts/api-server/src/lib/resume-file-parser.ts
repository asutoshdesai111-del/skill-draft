// Extracts raw text from an uploaded resume file buffer. Operates purely
// in-memory — the caller (route) never writes the upload to disk, so there
// is nothing to "clean up" after extraction; the buffer is simply discarded
// once the request completes.

import mammoth from "mammoth";
import WordExtractor from "word-extractor";

export class UnsupportedFileError extends Error {}
export class FileParseError extends Error {}

export type SupportedExt = "pdf" | "docx" | "doc";

export function detectExtension(filename: string, mimetype: string): SupportedExt | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") || mimetype === "application/pdf") return "pdf";
  if (lower.endsWith(".docx") || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (lower.endsWith(".doc") || mimetype === "application/msword") return "doc";
  return null;
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    // pdf-parse inserts "-- N of M --" page-separator markers between pages,
    // even for single-page documents — strip them so they don't get treated
    // as content during extraction.
    return result.text.replace(/^--\s*\d+\s*of\s*\d+\s*--$/gim, "");
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function parseDoc(buffer: Buffer): Promise<string> {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  return doc.getBody();
}

export async function extractTextFromFile(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  const ext = detectExtension(filename, mimetype);
  if (!ext) {
    throw new UnsupportedFileError("Unsupported file type. Please upload a PDF, DOC, or DOCX file.");
  }

  try {
    switch (ext) {
      case "pdf": return await parsePdf(buffer);
      case "docx": return await parseDocx(buffer);
      case "doc": return await parseDoc(buffer);
    }
  } catch (err) {
    const hint = ext === "doc" ? " Try saving it as .docx or .pdf and uploading again." : "";
    throw new FileParseError(`We couldn't read this file — it may be corrupted, password-protected, or in an unexpected format.${hint}`, { cause: err });
  }
}
