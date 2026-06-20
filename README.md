# Intern Area

Intern Area is a full-stack career platform inspired by Internshala that helps students discover internships, apply for jobs, build professional resumes, connect with peers, and manage their career journey in one place.

## Features

### Authentication

* Email & Password Login
* Google Authentication
* JWT-based Authorization
* Login History Tracking
* Forgot Password with Email Recovery
* OTP Verification for Sensitive Actions

### Internship Module

* Browse Internships
* View Internship Details
* Apply for Internships
* Application Tracking
* Prevent Duplicate Applications

### Job Module

* Browse Jobs
* View Job Details
* Apply for Jobs
* Application Management

### Resume Builder

* Premium Resume Generation
* Razorpay Payment Integration
* Resume Storage in Database
* Automatic Resume Attachment to Profile
* Resume Linked During Applications

### Subscription Plans

* Free Plan (1 Application / Month)
* Bronze Plan (3 Applications / Month)
* Silver Plan (5 Applications / Month)
* Gold Plan (Unlimited Applications)
* Razorpay Payment Gateway
* Invoice Email via Brevo

### Public Space

* Create Posts
* Social Feed
* Friend Requests
* Accept / Reject Requests
* Remove Friends
* Friend Network Management

### Multi-language Support

Supported Languages:

* English
* Hindi
* French
* Spanish
* Portuguese
* Chinese

Language changes require OTP verification through email.

### Email Services

Powered by Brevo:

* OTP Emails
* Password Recovery Emails
* Subscription Confirmation Emails
* Invoice Emails

## Tech Stack

### Frontend

* Next.js
* React.js
* TypeScript
* Tailwind CSS
* Redux Toolkit
* Axios
* React Toastify
* i18next

### Backend

* Node.js
* Express.js
* JWT Authentication
* Multer
* Brevo Email API
* Razorpay

### Database

* MongoDB Atlas
* Mongoose

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=

JWT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

BREVO_API_KEY=
FROM_EMAIL=

EMAIL=
EMAIL_PASSWORD=
```

## Installation

### Clone Repository

```bash
git clone https://github.com/FIDHA819/intern-area.git
```

### Install Dependencies

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
npm install
```

### Run Frontend

```bash
npm run dev
```

### Run Backend

```bash
npm start
```

## Project Structure

```text
frontend/
 ├── app/
 ├── components/
 ├── redux/
 ├── public/
 └── i18n/

backend/
 ├── Routes/
 ├── Model/
 ├── Middleware/
 ├── uploads/
 ├── Config/
 └── index.js
```

## Security Features

* JWT Protected Routes
* Password Hashing using bcrypt
* OTP Verification
* Razorpay Signature Verification
* Application Limit Enforcement
* Duplicate Application Prevention

## Future Improvements

* AI Resume Analysis
* AI Cover Letter Generator
* AI Interview Preparation
* Real-time Chat
* Company Dashboard
* Applicant Tracking System (ATS)
* Resume PDF Generation

## Author

Fidha Fathima

Full Stack Developer

Built using MERN Stack, Next.js, Razorpay, Brevo, MongoDB, and React.
