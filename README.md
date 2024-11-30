# GitNest 🌳

> Visualize GitHub repository structures with an elegant, interactive tree view.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://git-nest.vercel.app)
[![GitHub stars](https://img.shields.io/github/stars/pratikpaudel/gitnest.svg)](https://github.com/pratikpaudel/gitnest/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![GitNest Demo](demo.gif)

## 🌟 Features

- **Interactive Tree View**: Explore repository structures with an expandable, intuitive interface
- **Real-time Updates**: Instantly visualize any public GitHub repository
- **Copy Structure**: One-click copy of the repository structure for documentation or sharing
- **Branch Support**: View structure from any branch of the repository
- **Repository Stats**: Quick overview of stars, forks, and description
- **Responsive Design**: Seamless experience across all devices

## 🎯 Use Cases

### 1. Learning & Understanding
- **Project Architecture Study**: Quickly grasp the structure of popular open-source projects
- **Best Practices**: Learn how successful projects organize their codebases

### 2. Code Review & Collaboration
- **Structure Verification**: Easily verify if your project follows team conventions
- **Onboarding**: Help new team members understand project organization

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pratikpaudel/gitnest.git
cd gitnest
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Backend (.env)
GITHUB_TOKEN=your_github_token
PORT=8000

# Frontend (.env)
VITE_API_URL=http://localhost:8000
```

5. Start the development servers:
```bash
# Backend
python main.py

# Frontend (in another terminal)
npm run dev
```

## 🛠️ Tech Stack

### Frontend
- React.js
- TailwindCSS
- Lucide Icons
- Vite

### Backend
- FastAPI
- PyGithub
- Uvicorn

## 📖 API Documentation

### Base URL
```
https://gitnest-185c.onrender.com/api
```

### Endpoints

#### Get Repository Structure
```http
POST /structure
Content-Type: application/json

{
    "url": "https://github.com/username/repository"
}
```

#### Health Check
```http
GET /health
```

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

Pratik Paudel - [@pratikpaudel](https://github.com/pratikpaudel)

Project Link: [https://github.com/pratikpaudel/gitnest](https://github.com/pratikpaudel/gitnest)

---
⭐️ Star this repo if you find it useful! ⭐️
