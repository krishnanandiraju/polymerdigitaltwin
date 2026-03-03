#!/usr/bin/env python
"""Run the Manufacturing Digital Twin backend with uvicorn"""

import uvicorn
import os

if __name__ == "__main__":
    # Get the current directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Configure uvicorn to exclude __pycache__ and other files from reload
    config = uvicorn.Config(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[backend_dir],
        reload_includes=["*.py"],
        log_level="info",
    )
    
    server = uvicorn.Server(config)
    server.run()
