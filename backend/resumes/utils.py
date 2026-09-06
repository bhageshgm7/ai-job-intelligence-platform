import io
import re
from pypdf import PdfReader
from rest_framework.exceptions import ValidationError

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def validate_pdf_file(file_obj):
    """Validates file extension and size limit."""
    filename = getattr(file_obj, 'name', '')
    if not filename.lower().endswith('.pdf'):
        raise ValidationError("Only PDF files are supported. Please upload a file with a .pdf extension.")

    if file_obj.size > MAX_FILE_SIZE_BYTES:
        raise ValidationError(f"File size exceeds maximum limit of 10MB (file size: {file_obj.size / (1024 * 1024):.1f}MB).")


def extract_text_from_pdf(file_obj) -> str:
    """Extracts text content from a PDF file using pypdf."""
    validate_pdf_file(file_obj)

    try:
        # Seek to beginning in case file pointer was moved
        file_obj.seek(0)
        reader = PdfReader(file_obj)

        if reader.is_encrypted:
            try:
                reader.decrypt('')
            except Exception:
                raise ValidationError("The uploaded PDF is password-protected. Please upload an unprotected PDF.")

        text_parts = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text() or ''
            if page_text.strip():
                text_parts.append(page_text)

        full_text = "\n\n".join(text_parts).strip()

        # Clean null bytes and normalize whitespace
        full_text = full_text.replace('\x00', '')
        full_text = re.sub(r'[ \t]+', ' ', full_text)
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)

        # Reset pointer for saving to storage
        file_obj.seek(0)

        if not full_text:
            # Not an error, but let user know if PDF is scanned or image-based
            full_text = "(Scanned or image-based PDF. Minimal textual content extracted.)"

        return full_text

    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(f"Failed to extract text from PDF: {str(e)}")
