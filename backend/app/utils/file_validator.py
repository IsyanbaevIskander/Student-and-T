# app/utils/file_validator.py
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import settings
import filetype


class FileValidator:
    """Validator for uploaded files"""
    
    @staticmethod
    async def validate_pdf(file: UploadFile) -> bytes:
        """
        Validate PDF file and return its content
        
        Args:
            file: Uploaded file
            
        Returns:
            bytes: File content
            
        Raises:
            HTTPException: If file validation fails
        """
        # Check filename
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Filename is required"
            )
        
        # Check file extension
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file extension. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Check if file is empty
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="File is empty"
            )
        
        # Check file size
        if len(content) > settings.MAX_FILE_SIZE:
            max_size_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {max_size_mb:.1f}MB"
            )
        
        # Check MIME type using filetype (pure Python, no system dependencies)
        kind = filetype.guess(content)
        if kind is None:
            raise HTTPException(
                status_code=400,
                detail="Cannot determine file type"
            )
        
        if kind.mime != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {kind.mime}. Only PDF is allowed"
            )
        
        # Additional check: PDF magic bytes
        if not content.startswith(b'%PDF'):
            raise HTTPException(
                status_code=400,
                detail="File is not a valid PDF document"
            )
        
        return content
    
    @staticmethod
    def generate_filename(user_id: int) -> str:
        """Generate unique filename for resume"""
        from datetime import datetime
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')
        return f"resume_{user_id}_{timestamp}.pdf"