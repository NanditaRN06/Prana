# Prana Clinical Management System

## Aim
The primary aim of Prana is to digitize and streamline the clinical workflow for healthcare professionals. It provides a secure, reliable, and user-friendly interface to formally document patient history, clinical findings, investigations, and treatment plans for easy retrieval and automated prescription printing.

## Project Description
Prana is a modern Clinical Management System designed with a focus on simplicity, security, and medical logic flow. It enables doctors to rapidly log patient data (including chief complaints, co-morbidities, and examination findings), specify diagnostic investigations, and prescribe detailed treatment plans. The application supports an elegantly formatted printing layout that features the practicing physician's seal, signature block, and dynamically adjusts to long treatment lists securely. The stack utilizes a React-based frontend powered by Vite, and a secure Node.js/Express backend communicating with MongoDB. 

## Project Structure
```text
Prana/
|-- .github/
|   |-- workflows/             # ci/cd workflows
|-- backend/
|   |-- controllers/           # contains logic for handling requests and responses
|   |-- middlewares/           # contains middleware functions
|   |-- models/                # contains database models
|   |-- routes/                # contains API routes
|   |-- services/              # contains business logic
|   |-- templates/             # contains templates for email and other documents
|   |-- validators/            # contains validation logic
|   |-- eslint.config.js       # eslint configuration file
|   |-- .env                   # environment variables
|   |-- index.js               # entry point of the backend application
|   |-- package.json           # package.json file
-- docs/
|   |-- tests/ 
|   |   |-- frontend/          # contains frontend test documents
|   |   |-- backend/           # contains backend test documents
-- frontend/
|   |-- public/                # public directory 
|   |-- src/
|   |   |-- components/        # reusable components
|   |   |-- layout/            # layout components
|   |   |-- pages/
|   |   |   |-- auth/          # authentication pages
|   |   |   |-- dashboard/     # dashboard pages
|   |   |   |-- admin/         # admin pages
|   |   |-- services/          # services
|   |   |-- utils/             # utility functions
|   |   |-- App.jsx            # main application component
|   |   |-- index.css          # global styles
|   |   |-- main.jsx           # entry point of the frontend application
|   |-- .env.development       # environment variables for development
|   |-- .env.production        # environment variables for production
|   |-- eslint.config.js       # eslint configuration file
|   |-- index.html             # html template
|   |-- package.json           # package.json file
|   |-- postcss.config.js      # postcss configuration file
|   |-- tailwind.config.js     # tailwind configuration file
|   |-- vercel.json            # vercel configuration file
|   |-- vite.config.js         # vite configuration file
|-- tests/                     
|   |-- e2e/                   # e2e tests
|   |-- integration/           # integration tests
|   |-- setup/                 # Setup for running tests
|   |-- system/                # system tests
|   |-- unit/                  # unit tests
|   |-- .env.test              # environment variables for testing
|   |-- jest.config.js         # jest configuration file
|   |-- package.json           # package.json file
|   |-- vitest.config.js       # vitest configuration file
|-- .gitignore                 # gitignore file
|-- LICENSE                    # license file
|-- README.md                  # readme file
```

## Local System Running Steps

Follow these steps to set up and run the application on your local machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB (Running locally or a MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/NanditaRN06/Prana
cd Prana
```

### 2. Configure Environment Variables
Inside the `backend/` directory, create a `.env` file and add the following configuration:

```env
PORT=<your-backend-port-number>
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret-string>
EMAIL_USER=<your-email-address>
EMAIL_PASS=<your-app-password>
```

For testing, inside the `tests/` directory, create a `.env.test` file and add the following configuration:
```env
NODE_ENV=test
PORT=<port-number>
JWT_SECRET=<your-jwt-secret>
LOG_LEVEL=error
MONGODB_URI=<your-mongodb-uri>
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