# OralVis

OralVis is a full-stack web application for oral health report annotation and management. It consists of a React frontend and a Node.js/Express backend, supporting user authentication, image annotation, report generation, and role-based access. Images and reports are stored securely in AWS S3.

---

## Demo Screenshots
Below are some screenshots demonstrating the application features:

<h3 align="center">Login Page</h3>
<p align="center">
  <img src="Demo_screenshots/1.png" alt="Login Page" width="600" />
</p>

<h3 align="center">Patient Dashboard</h3>
<p align="center">
  <img src="Demo_screenshots/2.png" alt="Patient Dashboard" width="600" />
</p>

<h3 align="center">Admin Dashboard</h3>
<p align="center">
  <img src="Demo_screenshots/3.png" alt="Admin Dashboard" width="600" />
</p>

<h3 align="center">Annotation Page</h3>
<p align="center">
  <img src="Demo_screenshots/4.png" alt="Annotation Page" width="600" />
</p>

<h3 align="center">PDF Report</h3>
<p align="center">
  <img src="Demo_screenshots/5.png" alt="PDF Report" width="600" />
</p>

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Backend API Endpoints](#backend-api-endpoints)
- [Frontend Overview](#frontend-overview)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- User authentication (JWT, roles: admin, patient)
- Image upload and annotation (stored in AWS S3)
- PDF report generation (using Puppeteer and EJS templates)
- Role-based dashboards
- RESTful API
- Modern React UI (Vite, TailwindCSS)

---

## Project Structure
```
OralVis/
├── backend/         # Node.js/Express API
│   ├── controllers/ # Route logic
│   ├── middleware/  # Auth & roles
│   ├── models/      # Mongoose schemas
│   ├── routes/      # API routes
│   ├── templates/   # EJS report template
│   ├── server.js    # Entry point
│   └── package.json # Backend dependencies
├── frontend/        # React client
│   ├── src/         # Source code
│   ├── index.html   # Main HTML
│   └── package.json # Frontend dependencies
├── README.md        # This file
└── .env             # Environment variables
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Clone the Repository
```sh
git clone https://github.com/sameer512100/OralVis-Task.git
cd OralVis
```

### 2. Backend Setup
```sh
cd backend
npm install
```
- Create a `.env` file in `backend/` (see [Environment Variables](#environment-variables)).
- Start the backend server:
```sh
npm run dev
```
- Default port: `3000`

### 3. Frontend Setup
```sh
cd ../frontend
npm install
npm run dev
```
- Default port: `5173`

### 4. Access the App
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000](http://localhost:5000)

---

## Backend API Endpoints

### Auth
- `POST /auth/register` — Register a new user
- `POST /auth/login` — Login and receive JWT

### Submissions
- `POST /submissions` — Patient uploads image
- `GET /submissions/mine` — Patient views own submissions
- `GET /submissions` — Admin views all submissions
- `GET /submissions/:id` — Admin views a specific submission
- `POST /submissions/:id/annotate` — Admin annotates a submission
- `POST /submissions/:id/generate-pdf` — Admin generates PDF report
- `GET /submissions/:id/generated-image` — Get generated image

### File Uploads
- Images and PDF reports are uploaded to AWS S3.

### Middleware
- JWT authentication (`auth.js`)
- Role-based access (`roles.js`)

---

## Frontend Overview
- Built with React, Vite, TailwindCSS
- Pages:
  - `AuthPage.jsx` — Login/Register
  - `PatientDashboard.jsx` — Patient view
  - `AdminDashboard.jsx` — Admin view
  - `AnnotationPage.jsx` — Annotate images
- Context:
  - `AuthContext.jsx` — Auth state
- API:
  - `api/auth.js` — Auth requests
  - `api/submissions.js` — Submission requests

---

## Environment Variables
Create a `.env` file in `backend/`:
```
PORT=3000
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-secret>
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=<your-aws-region>
AWS_S3_BUCKET=<your-s3-bucket>
```

---

## Scripts
### Backend
- `npm run dev` || `npm start` — Start server

### Frontend
- `npm run dev` — Start Vite dev server

---

## Contributing
Pull requests are welcome. For major changes, open an issue first to discuss what you would like to change.

---

## License
MIT