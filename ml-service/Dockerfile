# Use Python 3.13 base image
FROM python:3.13


# Set working directory
WORKDIR /app

# Copy requirements (if you have one)
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy source code and model
COPY . .

# Expose port
EXPOSE 5001

# Start Flask app
CMD ["python", "ml_service.py"]