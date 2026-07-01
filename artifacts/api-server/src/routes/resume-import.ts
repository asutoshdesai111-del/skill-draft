import { Router } from "express";
import multer from "multer";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { extractTextFromFile, UnsupportedFileError, FileParseError } from "../lib/resume-file-parser";
import { extractResumeData } from "../lib/resume-extractor";

const router = Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Memory storage only — the file buffer lives in process memory for the
// duration of this request and is discarded once the response is sent.
// Nothing is ever written to disk, so there's no temp file to clean up and
// no path-traversal/orphaned-file risk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowedExt = /\.(pdf|docx?|DOCX?|PDF)$/i;
    const allowedMime = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
    if (allowedExt.test(file.originalname) || allowedMime.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("UNSUPPORTED_FILE_TYPE"));
    }
  },
});

// POST /resumes/import — upload a resume file, extract text, parse into
// structured fields, and return the result. Does NOT persist anything; the
// frontend shows extracted data in an editable review step and only saves
// via the existing resume/section creation endpoints once the user confirms.
router.post("/resumes/import", requireAuth, (req: AuthRequest, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File is too large. Maximum size is 5MB." });
        return;
      }
      res.status(400).json({ error: "Upload failed. Please try again." });
      return;
    }
    if (err) {
      res.status(400).json({ error: "Unsupported file type. Please upload a PDF, DOC, or DOCX file." });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file was uploaded." });
      return;
    }

    try {
      const text = await extractTextFromFile(file.buffer, file.originalname, file.mimetype);
      const data = extractResumeData(text);
      res.json(data);
    } catch (parseErr) {
      if (parseErr instanceof UnsupportedFileError) {
        res.status(400).json({ error: parseErr.message });
        return;
      }
      if (parseErr instanceof FileParseError) {
        res.status(422).json({ error: parseErr.message });
        return;
      }
      logger.error({ err: parseErr }, "Resume import error");
      res.status(500).json({ error: "Something went wrong while processing your file. Please try again." });
    }
  });
});

export default router;
