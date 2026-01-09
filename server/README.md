# Abelov Hub Records - Backend

Node.js + Express + MongoDB backend for the Abelov Hub Records management system.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root of the project with the following (or use the existing one if you have it):
    ```env
    NODE_ENV=development
    PORT=4000
    MONGODB_URI=mongodb://localhost:27017/abelov_hub_records
    AUTH_SECRET=your-secret-key-here
    CORS_ORIGIN=http://localhost:5173
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## API Endpoints

- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/login` - Login and get token
- `GET /api/v1/auth/me` - Get current user profile
- `GET /api/v1/requests` - List all hub records
- `POST /api/v1/requests` - Create a new record
- `GET /api/v1/requests/:id` - Get record by ID
- `PUT /api/v1/requests/:id` - Update record
- `DELETE /api/v1/requests/:id` - Delete record
- `GET /api/v1/requests/stats/:userId` - Get user statistics
- `GET /api/v1/admin/stats` - Global system stats (Admin only)
- `GET /api/v1/admin/users` - List all users (Admin only)
