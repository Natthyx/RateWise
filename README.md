# 🧠 Rately Backend

**Rately** is a smart, Firebase-powered feedback and rating platform that enables businesses to **collect, analyze, and act on real-time customer satisfaction data** — empowering staff improvement and service quality monitoring.  

This repository contains the **backend APIs and admin logic** for managing services, staff, feedback, and analytics, built with **TypeScript, Express.js, and Firebase**.

---

## 🚀 Features

- 🔐 **JWT Authentication** — secure role-based access for Admins and Staff.  
- 🧭 **Service & Sub-Service Management** — create, update, and organize service hierarchies.  
- 👥 **Staff Management** — onboard staff with auto-generated secure PINs.  
- ⭐ **Customer Feedback** — collect ratings tied to staff and service sessions (anonymous).  
- 📊 **Analytics Dashboard Support** — aggregate insights on performance and satisfaction.  
- ☁️ **Cloud Storage Integration** — handle image uploads and public file URLs via Firebase Storage.  
- 🧾 **Swagger Documentation** — explore and test all endpoints with live API docs.  

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Runtime** | Node.js + Express |
| **Language** | TypeScript |
| **Database** | Firebase Firestore |
| **Storage** | Firebase Storage |
| **Authentication** | Firebase Admin + JWT |
| **Docs** | Swagger (OpenAPI 3.0) |
| **UUID Generation** | uuid v4 |

---

## 🗂️ Project Structure

```
rately-backend/
├── src/
│   ├── config/
│   │   └── firebase.ts
│   │   └── swagger.ts
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── utils/
│   └── server.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📘 API Documentation

Once the server is running locally:  
👉 **Swagger UI:** [`http://localhost:4000/api-docs`](http://localhost:4000/api-docs)

For production deployment, update the server URL in `swagger.ts`:

```ts
servers: [
  { url: "https://api.rately.app", description: "Production Server" },
  { url: "http://localhost:4000", description: "Development Server" },
]
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone [https://github.com/natthyx/rately-backend.git](https://github.com/Natthyx/Rately.git)
cd rately-backend
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Add environment variables  
Create a `.env` file in the root directory:

```
PORT=4000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_API_KEY=your_api_key
GOOGLE_APPLICATION_CREDENTIALS=your_firebase_serviceKey
FIREBASE_STORAGE_BUCKET=your_storage_bucket
JWT_SECRET=your_jwt_secret
```

### 4️⃣ Run the development server
```bash
npm start or npx ts-node src/server.ts
```

---

## 🧪 Example Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| `POST` | `auth/register` | Register new admin |
| `POST` | `auth/staff/login` | Staff joins with PIN |
| `GET` | `/services` | Get all services |
| `GET` | `/analytics/top-staff` | Get top performer staff |

---

## 🛡️ Security

- 🔒 Role-based access using **JWT** and Firebase Admin verification.  
- 🚫 All sensitive operations protected by middleware (`verifyAdmin`, `verifyStaff`).  
- 🧩 Automatic token decoding — no IDs exposed in URLs.  

---

## 📈 Roadmap

- [ ] Add advanced analytics with chart-ready data  
- [ ] Integrate AI-powered sentiment analysis for open feedback  
- [ ] Multi-location and branch support  
- [ ] Admin dashboard web app (Next.js + Tailwind)  

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to open a PR or issue to improve **Rately**.

---

## 🧑‍💻 Author

**Natannan Zeleke**  
📧 natannanz16@gmail.com 
💼 [LinkedIn](https://www.linkedin.com/in/natannan-zeleke/) | 🌐 [Portfolio](https://natannan-zeleke-portfolio.vercel.app/)

---

## 📜 License

This project is licensed under the **MIT License** — free for commercial and personal use.
