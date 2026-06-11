# 🚀 CodeSandboxer

> **A secure, multi-language code execution platform for developers, coding platforms, AI agents, online judges, and educational products.**

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Python-3-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Java-17-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" />
</p>

<p align="center">
  <b>Execute code safely. Scale effortlessly. Integrate anywhere.</b>
</p>

---

## ✨ Features

### 🌍 Multi-Language Support

* 🐍 Python 3
* 🟨 JavaScript (Node.js)
* ☕ Java (OpenJDK 17)

### ⚡ High Performance

* Fast execution pipeline
* Lightweight REST API
* Stateless architecture
* Easy horizontal scaling

### 🔒 Security First

* Docker sandbox support
* Resource limits
* Execution timeouts
* Output size limits
* Temporary isolated workspaces

### 🧩 Plug & Play

Perfect for:

* 🏆 Competitive Programming Platforms
* 🤖 AI Coding Agents
* 🎓 Educational Platforms
* 💼 Technical Interview Systems
* 📚 Automated Grading Systems
* 🧪 Online Code Runners
* 🛠 Internal Developer Tools

---

# 🏗 Architecture

```text
                ┌─────────────────┐
                │     Client      │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ CodeSandboxer   │
                │      API        │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │    Executor     │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Runner Factory  │
                └───────┬─────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
 ┌─────────────────┐         ┌─────────────────┐
 │   Local Runner  │         │ Docker Runner   │
 └─────────────────┘         └─────────────────┘
```

---

# 🌟 Why CodeSandboxer?

Most code execution engines are tightly coupled to a single platform.

CodeSandboxer is built as a **standalone execution service**.

That means:

✅ Works with coding platforms

✅ Works with AI agents

✅ Works with interview systems

✅ Works with educational products

✅ Works with internal tooling

One service. Infinite use cases.

---

# 📡 API

## Execute Code

### Request

```http
POST /execute
Content-Type: application/json
```

```json
{
  "language": "python",
  "sourceCode": "print('Hello World')"
}
```

### Response

```json
{
  "status": "Accepted",
  "stdout": "Hello World\n",
  "stderr": "",
  "executionTimeMs": 24
}
```

---

# ❤️ Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

---

# 🏷 Version Endpoint

```http
GET /version
```

Response:

```json
{
  "service": "CodeSandboxer",
  "version": "1.0.0"
}
```

---

# ⚙️ Execution Modes

## 🖥 Local Mode

Perfect for:

* Development
* Testing
* MVP Deployments
* Render Deployments

```env
EXECUTION_MODE=local
```

---

## 🐳 Docker Mode

Recommended for production.

```env
EXECUTION_MODE=docker
```

Benefits:

* 🔒 Better Isolation
* 🚫 No Network Access
* 🧱 Stronger Sandboxing
* 📈 Production Ready

---

# 🛡 Security Features

## Docker Security

Containers launch with:

```bash
--network none
--memory 256m
--cpus 1
--pids-limit 64
--read-only
--cap-drop ALL
--security-opt no-new-privileges
```

---

## Runtime Protection

### ⏱ Timeout Protection

```text
Maximum Execution Time: 5 seconds
```

---

### 📏 Output Protection

```text
Maximum stdout: 1 MB
Maximum stderr: 1 MB
```

---

### 🧹 Automatic Cleanup

Each submission:

```text
/tmp/<uuid>
```

gets automatically deleted after execution.

---

# 📂 Project Structure

```text
src/
├── routes/
│   └── execute.js
│
├── services/
│   ├── executor.js
│   ├── runnerFactory.js
│   ├── localRunner.js
│   ├── dockerRunner.js
│   └── languageRunner.js
│
├── utils/
│   └── tempFiles.js
│
└── server.js
```

---

# 🚀 Getting Started

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/codesandboxer.git

cd codesandboxer
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment

```env
PORT=3000
EXECUTION_MODE=local
```

---

## 4️⃣ Start Service

```bash
npm start
```

---

# 🧪 Example Integration

```javascript
const response = await fetch(
  "https://your-domain.com/execute",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      language: "python",
      sourceCode: "print('Hello World')"
    })
  }
);

const result = await response.json();

console.log(result);
```

---

# 🎯 Supported Use Cases

| Use Case                | Supported |
| ----------------------- | --------- |
| 🏆 Coding Platforms     | ✅         |
| 🤖 AI Agents            | ✅         |
| 🎓 Learning Platforms   | ✅         |
| 💼 Technical Interviews | ✅         |
| 📚 Automated Grading    | ✅         |
| 🛠 Internal Tools       | ✅         |
| ⚡ Online Code Runners   | ✅         |

---

# 🛣 Roadmap

### Languages

* [ ] C++
* [ ] Go
* [ ] Rust
* [ ] TypeScript

### Infrastructure

* [ ] Memory Tracking
* [ ] Distributed Workers
* [ ] Submission Queues
* [ ] Multi-File Projects
* [ ] Kubernetes Backend

### Features

* [ ] Custom Resource Profiles
* [ ] Execution Analytics
* [ ] Web Dashboard
* [ ] Admin Panel

---

# 📊 Current Status

```text
Version: 1.0.0
Status : MVP Ready 🚀
```

---

# 🤝 Contributing

Contributions are welcome!

Feel free to:

* 🐛 Report Bugs
* 💡 Suggest Features
* 🔧 Submit Pull Requests
* ⭐ Star The Repository

---

# 📜 License

MIT License

---

<p align="center">
  Built with ❤️ for developers, educators, coding platforms, and AI systems.
</p>
