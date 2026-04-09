# 🔧 AutoParts Hub

A full-stack web application for managing scrap auto parts — connecting scrap dealers with customers. Built with **Next.js**, **TypeScript**, and **MariaDB/MySQL**.

## Features

- **Customer Portal**: Search parts, book appointments, manage wishlist
- **Dealer Portal**: Manage inventory, handle bookings, maintain part catalog
- **Database Triggers**: Auto-booking, wishlist notifications, booking status updates
- **Persistent Storage**: All data stored in MariaDB/MySQL (not in-memory)

---

## 🚀 Quick Setup

### Prerequisites

- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **pnpm** — Install with: `npm install -g pnpm`
- **MariaDB** or **MySQL** — Either one works!
  - **Windows**: Download [MySQL Installer](https://dev.mysql.com/downloads/installer/) or [MariaDB MSI](https://mariadb.org/download/)
  - **Mac**: `brew install mysql` or `brew install mariadb`
  - **Linux**: `sudo apt install mariadb-server` or `sudo dnf install mariadb-server`

### Step 1: Clone the repo

```bash
git clone <your-repo-url>
cd DBMS
```

### Step 2: Install dependencies

```bash
pnpm install
```

### Step 3: Set up the database

1. Make sure your MySQL/MariaDB server is **running**:
   - **Windows**: Open Services app → find MySQL/MariaDB → Start
   - **Linux**: `sudo systemctl start mariadb` or `sudo systemctl start mysql`
   - **Mac**: `brew services start mysql` or `brew services start mariadb`

2. Run the setup script to create the database, tables, triggers, and sample data:

   **On Linux/Mac:**
   ```bash
   mysql -u root -p < setup.sql
   ```

   **On Windows (Command Prompt):**
   ```cmd
   mysql -u root -p < setup.sql
   ```

   **On Windows (PowerShell):**
   ```powershell
   Get-Content setup.sql | mysql -u root -p
   ```

   It will ask for your MySQL/MariaDB root password. Enter it and press Enter.

### Step 4: Configure environment variables

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

   **On Windows (Command Prompt):**
   ```cmd
   copy .env.example .env
   ```

2. Open `.env` and set your database password:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_actual_password_here
   DB_NAME=AutoPartsDB
   ```

### Step 5: Run the app

```bash
pnpm dev
```

Open **http://localhost:3000** in your browser. Done! 🎉

---

## 🧪 Demo Accounts

| Name | Role | Notes |
|------|------|-------|
| Menka Devi | Customer | Active customer from Delhi |
| Savitri Devi | Customer | Active customer from Mumbai |
| Mewa Singh | Customer | Active customer from Jaipur |
| Meera Bai | Customer | Active customer from Ahmedabad |
| Ramachandra | Dealer | Has 2 garages in Delhi |
| Mohandas | Dealer | Has 1 garage in Mumbai |
| Bhaskar | Dealer | Has 1 garage in Jaipur |

---

## 📁 Project Structure

```
DBMS/
├── app/
│   ├── api/              # Backend API routes (talk to MariaDB)
│   │   ├── auth/login/   # POST - user authentication
│   │   ├── bookings/     # GET/POST/PUT - booking management
│   │   ├── catalogs/     # GET/POST - part catalog
│   │   ├── customers/    # GET - customer list
│   │   ├── dealers/      # GET - dealer list
│   │   ├── garages/      # GET - garage list
│   │   ├── parts/        # GET/POST/PUT - parts inventory
│   │   └── wishlist/     # GET/POST/DELETE - wishlist
│   ├── customer/         # Customer-facing pages
│   └── dealer/           # Dealer-facing pages
├── components/           # Reusable React components
├── lib/
│   ├── db.ts             # Database connection pool
│   ├── data.ts           # TypeScript interfaces & helpers
│   └── store.ts          # Auth state (Zustand)
├── setup.sql             # Database schema + sample data
├── .env.example          # Template for environment variables
└── package.json
```

---

## 🗄️ Database Schema

The app uses 7 tables and 3 triggers:

**Tables:** `SCRAP_DEALER`, `GARAGE`, `PART_CATALOG`, `PART_ITEM`, `CUSTOMER`, `BOOKING`, `WISHLIST`

**Triggers:**
- `Auto_Book_Part_Item` — Marks part as "Booked" when a booking is created
- `Update_Part_On_Booking_Status` — Updates part status when booking is completed/cancelled
- `Notify_Wishlist_On_Availability` — Notifies wishlist when a matching part becomes available

---

## ❓ Troubleshooting

### "Access denied for user 'root'"
→ Check your password in `.env`. Make sure it matches your MySQL/MariaDB root password.

### "Can't connect to MySQL server"
→ Make sure MySQL/MariaDB is running. On Windows, check the Services app. On Linux: `sudo systemctl status mariadb`.

### "Unknown database 'AutoPartsDB'"
→ You forgot to run `setup.sql`. Run: `mysql -u root -p < setup.sql`

### MySQL vs MariaDB?
→ Both work identically. MariaDB is a fork of MySQL. The SQL syntax is the same.
