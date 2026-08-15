import sys
import os
from dotenv import load_dotenv

# Define the path to your project
project_folder = '/home/0848189789/backend'

if project_folder not in sys.path:
    sys.path.append(project_folder)

# Load environment variables (if any)
load_dotenv(os.path.join(project_folder, '.env'))

# Import the Flask app
from app import app as application
