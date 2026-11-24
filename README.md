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
- **Username:** `admin`
- **Password:** `Sandeep80055`

### Admin Features
- **Add Custom Projects:** Add new models/projects to the exhibition directly from the Admin Portal.
- **Multi-Student Team Assignment:** Assign single students or entire teams/groups to a single project.
- **Photo Upload:** Upload real photos of the working project once built and ready for exhibition.
- **Awards & Winners Recognition:** Award projects (1st Place Champion, 2nd Place, 3rd Place, Innovation Award, Best Mechanism) with instant public showcase podium and badges.
- **Project Status Tracking:** Mark projects as `Available`, `In Progress`, `Completed`, or `Exhibited`.
- **Exhibition Booths:** Assign physical table and booth numbers for fair setup.
- **Coordinator Notes:** Internal evaluation and setup remarks.
- **Roster Export:** One-click CSV roster export with team members and award recognitions for official records.

---

## 📁 Project Structure

```
├── images/                   # 20 model photographs and diagrams
├── views/
│   └── index.pug             # Single-page Pug template with Tailwind & Alpine.js
├── data.js                   # In-memory hardcoded models data & exhibition guides
├── server.js                 # Express server with PNA and host configuration
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
