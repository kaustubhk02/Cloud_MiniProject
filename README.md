# ReimbursePro — Role-Based Employee Reimbursement System

A full-stack MERN application for managing employee expense reimbursements with JWT authentication and strict role-based access control.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS      |
| State      | Redux Toolkit                       |
| Backend    | Node.js + Express.js                |
| Database   | MongoDB + Mongoose                  |
| Auth       | JWT + bcryptjs                      |
| Uploads    | Multer                              |
| Validation | express-validator                   |

---

## Project Structure

```
reimbursement-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Register, login, getMe
│   │   └── reimbursementController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + role authorize
│   │   ├── errorHandler.js        # Global error handler
│   │   ├── validate.js            # express-validator rules
│   │   └── upload.js              # Multer file upload
│   ├── models/
│   │   ├── User.js                # User schema (bcrypt)
│   │   └── Reimbursement.js       # Reimbursement schema
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   └── reimbursements.js      # /api/reimbursements/*
│   ├── utils/
│   │   └── generateToken.js       # JWT generator
│   ├── uploads/                   # Uploaded attachments (gitignored)
│   ├── seed.js                    # Demo data seeder
│   ├── app.js                     # Express app setup
│   ├── server.js                  # Entry point
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx  # Auth + role guard
    │   │   ├── StatusBadge.jsx     # Pending/Approved/Rejected badge
    │   │   ├── StatCard.jsx        # Dashboard stat card
    │   │   ├── FilterBar.jsx       # Search + filter controls
    │   │   ├── Pagination.jsx      # Page navigation
    │   │   ├── ConfirmModal.jsx    # Delete confirm dialog
    │   │   └── Spinner.jsx         # Loading indicators
    │   ├── layouts/
    │   │   └── AppLayout.jsx       # Sidebar + mobile nav layout
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── EmployeeDashboard.jsx
    │   │   ├── SubmitRequest.jsx   # Create + Edit form
    │   │   ├── MyRequests.jsx      # Employee request list
    │   │   ├── ManagerDashboard.jsx
    │   │   ├── ManagerRequests.jsx # All requests + approve/reject
    │   │   └── NotFound.jsx
    │   ├── redux/
    │   │   ├── store.js
    │   │   └── slices/
    │   │       ├── authSlice.js
    │   │       └── reimbursementsSlice.js
    │   ├── services/
    │   │   └── api.js              # Axios instance + interceptors
    │   ├── utils/
    │   │   └── helpers.js          # Formatters + constants
    │   ├── App.jsx                 # Routes
    │   ├── main.jsx
    │   └── index.css               # Tailwind + custom classes
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    ├── .gitignore
    └── package.json
```

---

## API Reference

### Auth
| Method | Endpoint            | Access  | Description       |
|--------|---------------------|---------|-------------------|
| POST   | /api/auth/register  | Public  | Create account    |
| POST   | /api/auth/login     | Public  | Login & get token |
| GET    | /api/auth/me        | Private | Get current user  |

### Reimbursements
| Method | Endpoint                        | Access           | Description            |
|--------|---------------------------------|------------------|------------------------|
| POST   | /api/reimbursements             | Employee         | Submit request         |
| GET    | /api/reimbursements             | Both             | List (role-filtered)   |
| GET    | /api/reimbursements/stats       | Both             | Dashboard stats        |
| GET    | /api/reimbursements/:id         | Both             | Get single request     |
| PUT    | /api/reimbursements/:id         | Employee (owner) | Edit pending request   |
| DELETE | /api/reimbursements/:id         | Employee (owner) | Delete pending request |
| PUT    | /api/reimbursements/:id/approve | Manager          | Approve request        |
| PUT    | /api/reimbursements/:id/reject  | Manager          | Reject request         |

### Query Parameters (GET /api/reimbursements)
- `status` — pending | approved | rejected | all
- `category` — travel | food | medical | accommodation | office_supplies | training | other
- `startDate`, `endDate` — ISO date strings
- `search` — search description/category/name
- `page`, `limit` — pagination
- `sort` — field sort (e.g. `-createdAt`)

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd reimbursement-system
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

**.env** (backend):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/reimbursement_db
JWT_SECRET=your_super_secret_key_minimum_32_chars
JWT_EXPIRE=1d
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create environment file
cp .env.example .env
```

**.env** (frontend):
```
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed Demo Data (Optional but Recommended)
```bash
cd backend
node seed.js
```

This creates:
- `employee@demo.com` / `password123` (Employee)
- `manager@demo.com` / `password123` (Manager)
- `carol@demo.com` / `password123` (Employee)
- 7 sample reimbursement requests with various statuses

### 5. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Role-Based Access Control

| Feature                      | Employee | Manager |
|------------------------------|----------|---------|
| Register / Login             | ✅       | ✅      |
| Submit reimbursement         | ✅       | ❌      |
| View own requests            | ✅       | ❌      |
| Edit pending own request     | ✅       | ❌      |
| Delete pending own request   | ✅       | ❌      |
| View ALL requests            | ❌       | ✅      |
| Filter by employee/status    | ❌       | ✅      |
| Approve requests             | ❌       | ✅      |
| Reject requests              | ❌       | ✅      |
| Add manager comments         | ❌       | ✅      |
| View dashboard stats         | ✅ (own) | ✅ (all)|

---

## Security Features

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- JWT tokens with configurable expiry
- Role-based middleware on every protected route
- File upload validation (type + size limits)
- Input validation via **express-validator**
- Global error handler (no stack traces in production)
- Auto logout on 401 via Axios interceptor
- Frontend route guards via `ProtectedRoute` component

---

## Production Deployment

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your static host (Vercel, Netlify, etc.)
```

Update `VITE_API_URL` in frontend `.env` to your production API URL before building.

---

## Sample Test Data (Post-Seed)

| Email               | Role     | Password    |
|---------------------|----------|-------------|
| employee@demo.com   | Employee | password123 |
| manager@demo.com    | Manager  | password123 |
| carol@demo.com      | Employee | password123 |
