# 🔬 Science Fair Project Lab – 20 Working Models

A modern, responsive, and minimalist web portal showcasing **20 practical working science models** designed for science exhibitions, fairs, and STEM demonstrations.

Created and owned by **Sandeep Singh** ([@beastSandeep](https://github.com/beastSandeep)).

Each model includes its core scientific principles, required materials, working mechanisms, real-world industry applications, and ready-to-recite presentation scripts.

---

## 👤 Website Owner & Creator

**Sandeep Singh**  
- **GitHub:** [@beastSandeep](https://github.com/beastSandeep)  
- **Repository:** [https://github.com/beastSandeep/science_project_2026.git](https://github.com/beastSandeep/science_project_2026.git)

---

## 🌟 Key Features

- **20 Working Science Models:** Across 6 disciplines: Mechanics, Electricity, Optics, Biology, Chemistry, and Earth & Space.
- **Modern & Minimalist Design:** Built with Tailwind CSS, dark slate aesthetic, glassmorphic cards, and custom scientific accents.
- **Scientific Particle Animation:** Interactive HTML5 canvas with real-time atomic orbits and particle bonds that react to mouse and touch gestures.
- **Scroll Entrance Animations:** Smooth viewport entrance animations that trigger strictly once as visitors scroll down the home page.
- **Mobile Voting & Balloting System (`/rate` & `/rate?projectNo=<id>`):** Mobile-first voting interface where visitors and judges can cast 1-5 star ratings with mandatory voter names and feedback.
- **Single Vote with Modification Memory (`localStorage`):** Voters can only vote once per project, but can adjust their score at any time from their device.
- **Confetti & Medal Celebration:** Multi-burst particle explosion celebration powered by canvas-confetti upon ballot submission.
- **Live Voting Tallies on Admin:** Real-time polling and KPI badges showing live star averages and vote counts on the Admin Dashboard.
- **Project Deletion & Image Cleanup:** Ability to remove any project from the fair, and automatic file cleanup of old uploaded images from disk when superseded.
- **Presentation Scripts:** Ready-to-use spoken scripts for students with 1-click clipboard copy and speech synthesis audio preview.
- **Interactive Materials Checklist:** Check off required parts directly on the interface.
- **Exhibition Blueprint & Judging Rubric:** 4-step presentation formula and standard science fair evaluation criteria.
- **Fully Responsive:** Optimized for desktop, tablets, and mobile smartphones.
- **Private Network Access (PNA):** Open access on local Wi-Fi networks for phone/tablet testing during rehearsals.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/beastSandeep/science_project_2026.git

# Navigate to project folder
cd science_project_2026

# Install dependencies
npm install
```

### Running the Application

```bash
# Start in production mode
npm start

# Start in development mode (with hot-reload watch and PNA unlocked)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔐 Admin Portal & Project Management

The portal includes an administrative management console for event coordinators and teachers:

- **URL:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **First-Time Deployment Setup:** On your first launch, visiting `/admin` (or `/admin/setup`) prompts you to create your master administrator username and password. There are **no hardcoded default passwords**.
- **Change Password Anytime:** An authenticated administrator can update their password at any time directly inside the Admin Dashboard using the **Change Password** control.
- **Cryptographic Security:** Master passwords are dynamically salted with cryptographically secure random bytes and hashed using `scrypt` with constant-time verification.

### Admin Features
- **First-Run Password Setup & Live Password Change:** Choose credentials on deployment without any hardcoded defaults; update credentials anytime.
- **Live Voting Tallies & KPIs:** Real-time metrics showing total submitted votes and average scores across all models with 10-second polling.
- **Delete Any Project:** Delete any project (base template or custom) from the fair with automatic disk cleanup of associated uploaded photos.
- **Project Photo Replacement & Safe Cleanup:** Prominently preview photos in project editing; replaces old photos and automatically deletes the old file from `public/uploads/` on disk strictly upon successful update.
- **Add Custom Projects with Photo & Video:** Add new models/projects to the exhibition directly from the Admin Portal with immediate photo file upload and optional YouTube video link.
- **Multi-Student Team Assignment:** Assign single students or entire teams/groups to a single project.
- **Photo Upload:** Upload real photos of the working project when creating or editing a project.
- **YouTube Video Demonstrations:** Optional YouTube video links for any model with 1-click redirection and card badges.
- **In-Memory Reactive Data Store:** Projects, votes, and assignments are cached in high-performance server memory and saved to disk.
- **Awards & Winners Recognition:** Award projects (1st Place Champion, 2nd Place, 3rd Place, Innovation Award, Best Mechanism) with instant public showcase podium and badges.
- **Project Status Tracking:** Mark projects as `Available`, `In Progress`, `Completed`, or `Exhibited`.
- **Exhibition Booths:** Assign physical table and booth numbers for fair setup.
- **Coordinator Notes:** Internal evaluation and setup remarks.
- **Roster Export:** One-click CSV roster export with team members and award recognitions for official records.

---

## 📁 Project Structure

```
├── images/                   # 20 base model photographs and diagrams
├── public/
│   ├── favicon.svg           # High-resolution vector science favicon
│   └── uploads/              # Uploaded project photo storage (with auto cleanup)
├── views/
│   ├── index.pug             # Single-page Pug template with Tailwind & Alpine.js
│   ├── rate.pug              # Mobile-first voting portal with confetti celebration
│   └── admin/
│       ├── dashboard.pug     # Comprehensive admin control center with live votes
│       ├── login.pug         # Secure glassmorphic admin login
│       └── setup.pug         # First-time master password setup wizard
├── data.js                   # 20 curated baseline scientific models
├── dataManager.js            # In-memory reactive state manager (projects, votes, awards)
├── server.js                 # Express server with PNA, uploads, and voting APIs
├── Science_Fair_20_Models.md # Comprehensive guide and reference documentation
├── package.json              # Project scripts and dependencies
└── README.md                 # Project documentation
```

---

## 🛠️ Built With

- **Backend:** Node.js, Express.js
- **Template Engine:** Pug
- **Styling:** Tailwind CSS (CDN)
- **Interactivity:** Alpine.js
- **Animations:** HTML5 Canvas API

---

## 📄 License

MIT License. Open for educational, classroom, and science fair use.
