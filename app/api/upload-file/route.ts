import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { PDFDocument } from "pdf-lib";
import mammoth from "mammoth";

const SUPPORTED_FILE_TYPES = {
  images: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ],
};

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log("Starting PDF text extraction...");
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    console.log(`PDF has ${pages.length} pages`);

    // For now, we'll return a basic message since pdf-lib doesn't have built-in text extraction
    // In a production app, you might want to use a service like AWS Textract or Google Document AI
    const extractedText = `PDF document uploaded with ${pages.length} page(s). Content analysis available through vision model.`;

    console.log("PDF processed successfully");
    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "PDF document uploaded. Content analysis available through vision model.";
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    return "";
  }
}

async function extractTextFromTXT(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("Error extracting text from TXT:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Upload File API Request ===");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("No file provided in request");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("File received:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file type
    const allSupportedTypes = [
      ...SUPPORTED_FILE_TYPES.images,
      ...SUPPORTED_FILE_TYPES.documents,
    ];
    if (!allSupportedTypes.includes(file.type)) {
      console.log("Unsupported file type:", file.type);
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log("File too large:", file.size);
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    console.log("File validation passed, converting to buffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("Buffer created, size:", buffer.length);

    console.log("Starting Cloudinary upload...");
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "chatgpt-uploads",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else if (result) {
              console.log("Cloudinary upload success:", result.secure_url);
              resolve(result);
            } else {
              console.error("Cloudinary upload failed: no result");
              reject(new Error("Upload failed"));
            }
          }
        )
        .end(buffer);
    });

    let extractedContent = "";

    // Extract text content for documents
    if (SUPPORTED_FILE_TYPES.documents.includes(file.type)) {
      console.log("Processing document for text extraction...");
      try {
        switch (file.type) {
          case "application/pdf":
            console.log("Extracting text from PDF...");
            extractedContent = await extractTextFromPDF(buffer);
            console.log("PDF text extracted, length:", extractedContent.length);
            break;
          case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          case "application/msword":
            console.log("Extracting text from DOCX...");
            extractedContent = await extractTextFromDOCX(buffer);
            console.log(
              "DOCX text extracted, length:",
              extractedContent.length
            );
            break;
          case "text/plain":
          case "text/markdown":
            console.log("Extracting text from TXT/MD...");
            extractedContent = await extractTextFromTXT(buffer);
            console.log("TXT text extracted, length:", extractedContent.length);
            break;
        }
      } catch (textError) {
        console.error("Text extraction error:", textError);
        // Don't fail the upload if text extraction fails
        extractedContent = "";
      }
    }

    console.log("Upload successful, returning response...");
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      fileName: file.name,
      fileType: file.type,
      extractedContent: extractedContent || undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
