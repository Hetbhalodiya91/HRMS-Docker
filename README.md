# HRMS - Dockerized Human Resource Management System

A full-stack Human Resource Management System containerized using Docker and Docker Compose.

## 🚀 Technologies Used

### Frontend
- React
- Vite
- Axios
- Nginx

### Backend
- Java
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA

### Database
- MySQL

### DevOps
- Docker
- Docker Compose
- Nginx

---

## 🏗️ Architecture

```text
Browser
   |
   v
Nginx + React
   |
   v
Spring Boot
   |
   v
MySQL

Browser
   |
   | localhost:3000
   v
Frontend Container
(Nginx + React)
   |
   | /api
   v
Backend Container
(Spring Boot)
   |
   v
MySQL Container

📁 Project Structure
HRMS-Docker/
│
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md

.env.example
MYSQL_ROOT_PASSWORD=your_password
MYSQL_DATABASE=hrms_db1
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_app_password
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
