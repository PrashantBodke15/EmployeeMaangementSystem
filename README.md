<<<<<<< HEAD
# People | Employee Management System

A MERN employee directory with employee registration, search and filters, profile details, editing, and deletion.

## Requirements

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

## Run locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` if you are not using the local default.
2. Install packages with `npm run install:all`.
3. Start the API and React app with `npm run dev`.
4. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

The API runs at `http://localhost:5000`. Vite proxies `/api` requests to it.

## API

- `GET /api/employees` supports `q`, `department`, and `status` query parameters.
- `GET /api/employees/:id` returns one employee.
- `POST /api/employees` registers an employee.
- `PUT /api/employees/:id` updates an employee.
- `DELETE /api/employees/:id` removes an employee.
- `GET /api/health` checks API availability.

Employee records include name, work email, phone, department, job title, location, start date, salary, and employment status. Email addresses are unique.
=======
# EmployeeMaangementSystem
>>>>>>> c8a10b87b737b0f30e1b64e97765a2d966e4dbea
