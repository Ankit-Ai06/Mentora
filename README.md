# Mentora – Students & Professionals Networking Platform

## 🚀 Overview

Mentora is a full-stack web application designed to bridge the gap between students and professionals. The platform enables users to connect, chat, seek career guidance, collaborate on projects, and build meaningful professional relationships.

The goal of Mentora is to provide a dedicated space where students can receive mentorship, career advice, interview preparation support, and networking opportunities directly from experienced professionals.

---

## ✨ Features

### 👤 User Authentication

* User Registration & Login
* JWT-based Authentication
* Email OTP Verification
* Secure Password Management

### 👥 User Profiles

* Personal Profile Management
* Education Details
* Experience Information
* Achievements & Skills
* Profile Picture Upload

### 💬 Real-Time Chat

* One-to-One Messaging
* Real-Time Communication using Socket.io
* Chat Search Functionality
* Online User Interaction

### 🤝 Networking

* Connect Students and Professionals
* Discover Potential Mentors
* Expand Professional Network
* Build Career-Oriented Connections

### 🔍 User Discovery

* Search Users
* View Public Profiles
* Explore Skills and Interests

### 📱 Responsive Design

* Mobile Friendly Interface
* Modern UI/UX
* Smooth User Experience

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* Axios
* React Router DOM
* React Icons
* Framer Motion
* Socket.io Client

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Socket.io
* Multer

### Cloud & Deployment

* Vercel (Frontend)
* Render (Backend)
* MongoDB Atlas (Database)
* Resend (Email Service)

---

## 📂 Project Structure

```bash
Mentora/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Ankit-Ai06/Mentora
cd mentora
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_email
```

Start Backend:

```bash
npm start
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security Features

* JWT Authentication
* Password Hashing
* Protected Routes
* Email Verification via OTP
* Input Validation
* Secure API Communication

---

## 📸 Screenshots
### Login Page
![alt text](<Screenshot 2026-06-05 123107.png>)

### Registration Page
![alt text](<Screenshot 2026-06-05 131606.png>)

### Home Page
![alt text](<Screenshot 2026-06-05 124217.png>)

### Profile Page
![alt text](<Screenshot 2026-06-05 131804.png>)

### Chat System
![alt text](<Screenshot 2026-06-05 132144.png>)

### Settings
![alt text](<Screenshot 2026-06-05 132257.png>)

### Connect People
![alt text](<Screenshot 2026-06-05 131905.png>)

### Notifications
![alt text](<Screenshot 2026-06-05 131958.png>)

### Post
![alt text](<Screenshot 2026-06-05 124259.png>)

## 🎯 Future Enhancements

* AI-Based Career Recommendations
* Video Calling
* Group Discussions
* Mentor Booking System
* Job & Internship Portal
* Project Collaboration Rooms
* AI Resume Review

---

## 👨‍💻 Author

**Ankit Badhautiya**

B.Tech Computer Science Engineering Student

### Skills

* MERN Stack Development
* Web Development
* Java
* Data Structures & Algorithms
* MongoDB
* REST APIs

---

## 📄 License

This project is developed for educational and learning purposes.
