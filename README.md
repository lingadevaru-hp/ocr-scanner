# 📄 OCR Scanner

A modern AI-powered OCR (Optical Character Recognition) web application that extracts text from images and scanned documents. Users can upload images or PDFs, process them with Tesseract OCR, preview the extracted text, and download the results in multiple formats.

## ✨ Features

- 📷 Drag & Drop image upload
- 🔍 OCR using Tesseract
- ⚡ OpenCV image preprocessing
- 📄 Export as Plain Text (.txt)
- 📑 Export as hOCR (.html)
- 📕 Export as Searchable PDF
- 👀 Live OCR result preview
- 🎨 Modern responsive UI
- 🌙 Light/Dark mode ready
- 🚀 FastAPI REST API
- ⚛️ React + TypeScript frontend

---

# 🛠 Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- Axios
- React Dropzone

### Backend

- FastAPI
- Python
- Tesseract OCR
- pytesseract
- OpenCV
- Pillow
- Uvicorn

---

# 📂 Project Structure

```text
ocr-scanner/
│
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

# 🚀 Local Installation

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/ocr-scanner.git

cd ocr-scanner
```

---

# Backend Setup

## Create Virtual Environment

### Windows

```powershell
cd backend

python -m venv venv

venv\Scripts\activate
```

### Linux / macOS

```bash
cd backend

python3 -m venv venv

source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

## Install Tesseract OCR

### Windows

Download and install

https://github.com/UB-Mannheim/tesseract/wiki

Example installation path

```
C:\Program Files\Tesseract-OCR
```

Add it to your PATH environment variable.

---

### Ubuntu

```bash
sudo apt update

sudo apt install tesseract-ocr
```

---

### macOS

```bash
brew install tesseract
```

---

## Run Backend

```bash
uvicorn app.main:app --reload --port 8000
```

Backend URL

```
http://localhost:8000
```

Swagger API

```
http://localhost:8000/docs
```

---

# Frontend Setup

Open another terminal

```bash
cd frontend

npm install

npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

# API

## POST `/api/scan`

Uploads an image or PDF and performs OCR.

### Form Data

| Field | Type | Required |
|-------|------|----------|
| file | File | ✅ |
| formats | txt, hocr, pdf | ✅ |

Example Response

```json
{
  "filename": "invoice.png",
  "text": "...",
  "hocr": "...",
  "pdf_base64": "..."
}
```

---

# Supported Formats

| Input | Supported |
|--------|-----------|
| PNG | ✅ |
| JPG | ✅ |
| JPEG | ✅ |
| WEBP | ✅ |
| BMP | ✅ |
| TIFF | ✅ |
| PDF | ✅ |

---

# Deployment

## Backend (Render)

Build Command

```bash
pip install -r requirements.txt
```

Start Command

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Frontend (Netlify)

Base Directory

```
frontend
```

Build Command

```bash
npm run build
```

Publish Directory

```
dist
```

Environment Variable

```
VITE_API_URL=https://your-render-backend.onrender.com
```

---

# Environment Variables

Frontend

```
VITE_API_URL=http://localhost:8000
```

Production

```
VITE_API_URL=https://your-render-backend.onrender.com
```

---

# Future Improvements

- Multiple language OCR
- Batch document processing
- OCR history
- Authentication
- Cloud storage
- AI document summarization
- Table extraction
- Handwriting recognition

---

# Author

**Aman Gupta**

B.Sc. Information Technology Student

Full Stack Developer

GitHub:
https://github.com/yourusername

LinkedIn:
https://linkedin.com/in/yourprofile

---

# License

This project is released under the MIT License.