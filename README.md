# Prana Clinical Management System

**Vercel Link:** [Link Space - Insert URL Here]()

## Aim
The primary aim of Prana is to digitize and streamline the clinical workflow for healthcare professionals. It provides a secure, reliable, and user-friendly interface to formally document patient history, clinical findings, investigations, and treatment plans for easy retrieval and automated prescription printing.

## Project Description
Prana is a modern Clinical Management System designed with a focus on simplicity, security, and medical logic flow. It enables doctors to rapidly log patient data (including chief complaints, co-morbidities, and examination findings), specify diagnostic investigations, and prescribe detailed treatment plans. The application supports an elegantly formatted printing layout that features the practicing physician's seal, signature block, and dynamically adjusts to long treatment lists securely. The stack utilizes a React-based frontend powered by Vite, and a secure Node.js/Express backend communicating with MongoDB. 

## Project Structure
```text
Prana/
|-- backend/
|   |-- models/
|   |   |-- Patient.js
|   |   |-- User.js
|   |   |-- resetPassword.html
|   |-- apiControllers.js
|   |-- apiRoutes.js
|   |-- index.js
|   |-- verifyUser.js
|   |-- package.json
|   |-- .env
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- utils/
|   |   |-- index.css
|   |   |-- main.jsx
|   |-- package.json
|   |-- vite.config.js
|-- Makefile
|-- README.md
|-- LICENSE
```

## Local System Running Steps

Follow these steps to set up and run the application on your local machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB (Running locally or a MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Prana
```

### 2. Configure Environment Variables
Inside the `backend/` directory, create a `.env` file and add the following configuration:

```env
PORT=<your-backend-port-number>
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret-string>
FE_URL=<your-frontend-url>
EMAIL_USER=<your-email-address>
EMAIL_PASS=<your-app-password>
```

### 3. Install Dependencies
You need to install packages for both the backend and frontend separately.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Run the Application
- **Backend:** `cd backend` then `npm run dev`
- **Frontend:** `cd frontend` then `npm run dev`

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.