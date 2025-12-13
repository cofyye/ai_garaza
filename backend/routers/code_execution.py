"""
Code execution router for running Python code in a sandboxed environment.
"""
import subprocess
import tempfile
import os
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CodeExecutionRequest(BaseModel):
    """Request model for code execution."""
    code: str
    language: str = "python"


class CodeExecutionResponse(BaseModel):
    """Response model for code execution."""
    output: str = ""
    error: str = ""
    execution_time: float = 0.0


@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest):
    """
    Execute Python code and return the output.
    
    Currently only supports Python. Other languages will return an error.
    """
    if request.language != "python":
        return CodeExecutionResponse(
            error=f"Language '{request.language}' is not supported yet. Only Python is currently available."
        )
    
    try:
        # Create a temporary file to store the code
        with tempfile.NamedTemporaryFile(
            mode='w', 
            suffix='.py', 
            delete=False,
            encoding='utf-8'
        ) as f:
            f.write(request.code)
            temp_file = f.name
        
        try:
            # Try to find Python executable (try python3 first, then python)
            python_cmd = None
            for cmd in ['python3', 'python']:
                try:
                    subprocess.run(
                        [cmd, '--version'],
                        capture_output=True,
                        timeout=1
                    )
                    python_cmd = cmd
                    break
                except (FileNotFoundError, subprocess.TimeoutExpired):
                    continue
            
            if not python_cmd:
                return CodeExecutionResponse(
                    error="Python interpreter not found. Please ensure Python is installed."
                )
            
            # Execute the Python code with a timeout
            result = subprocess.run(
                [python_cmd, temp_file],
                capture_output=True,
                text=True,
                timeout=10,  # 10 second timeout
                cwd=tempfile.gettempdir()
            )
            
            output = result.stdout
            error = result.stderr
            
            if result.returncode != 0 and not error:
                error = f"Process exited with code {result.returncode}"
            
            return CodeExecutionResponse(
                output=output,
                error=error
            )
            
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_file):
                os.remove(temp_file)
                
    except subprocess.TimeoutExpired:
        return CodeExecutionResponse(
            error="Execution timed out (10 second limit)"
        )
    except Exception as e:
        return CodeExecutionResponse(
            error=f"Execution failed: {str(e)}"
        )
