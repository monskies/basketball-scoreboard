<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
![basketball-scoreboard](https://github.com/user-attachments/assets/dd3f48ae-0b34-4a63-9747-5949430522c4)
# Basketball Scoreboard React App

A full-screen, real-time basketball scoreboard built with React, featuring:

* **User Authentication**: Login system with sessions.
* **Admin Dashboard**: Administrators can manage game sessions, team names, fouls, timeouts, clock settings (24s/14s), and more.
* **Session-Based Access**: Each user’s view and permissions are tied to their current session.
* **Responsive Fullscreen UI**: Optimized for both desktop and mobile screens, designed for live league use.

---

## 🔑 Features

* **Secure Login & Sessions**

  * Email/password authentication.
  * JWT-based sessions stored in HttpOnly cookies.
  * Session persistence: users remain logged in until they log out or session expires.

* **Admin Panel**

  * Create, edit, and delete game sessions (date, teams, quarter settings).
  * Start/pause/play/reset main and shot clocks per session.
  * Adjust team scores, fouls, and timeouts.
  * Dynamic 24s/14s shot‑clock configuration.

* **Scoreboard UI**

  * Editable event name, team names, and possession arrow.
  * Big, clear digital-style clocks and scores with tenths precision.
  * Clickable score and stat labels to increment/decrement.
  * Full-screen mode for stadium displays.

* **Responsive Design**

  * Grid layout for home, center, and visitor sections.
  * No whitespace edges — takes up the entire viewport.
  * Large touch targets for mobile use.

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v14+)
* npm or yarn
* A running backend API (e.g. Node/Express or Django REST) that supports:

  * `/auth/login`, `/auth/logout`, `/auth/session` endpoints
  * `/admin/sessions` CRUD endpoints

### Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/yourusername/basketball-scoreboard.git
   cd basketball-scoreboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**
   Create a `.env` file in `/frontend`:

   ```env
   REACT_APP_API_URL=https://api.yourdomain.com
   ```

4. **Start the app**

   ```bash
   npm start
   # or
   yarn start
   ```

   Runs on `http://localhost:3000` by default.

---

## 🛠️ Admin Usage

1. **Login** as an administrator.
2. Navigate to the **Admin Dashboard** tab.
3. Create or edit a **Game Session**:

   * Set event name, date, team names.
   * Configure maximum quarters, shot‑clock defaults (24s/14s).
4. **Launch** the session to open the live scoreboard view for users.
5. During live play, use the controls to:

   * Start/Pause/Play the main and shot clocks.
   * Increment/decrement scores, fouls, timeouts.
   * Change possession arrow and quarter.
   * Reset clocks or entire session.

---

## 👤 User Usage

1. **Login** with valid credentials.
2. The app will **automatically load** the active session tied to your user.
3. You can view the live scoreboard; most controls are **disabled** for non‑admins.

---

## 🔧 Configuration & Customization

* **Shot‑Clock Defaults**: Modify `customShot24` and `customShot14` state in `BasketballTimer.jsx`.
* **Styling**: Override `BasketballTimer.css` for custom branding and color themes.
* **Auth**: Swap out the authentication provider by updating `AuthContext` and login endpoints.

---

## 📦 Build & Deployment

```bash
npm run build
# or
yarn build
```

Deploy the `/build` folder to any static host (Netlify, Vercel, GitHub Pages), ensuring your backend API is reachable under `REACT_APP_API_URL`.

---

## ⚖️ License

MIT © monskies

---

Feel free to contribute via pull requests or file issues for bugs/features!

>>>>>>> ceb989d440f1728eb76356416d98dca144461edd
