# 🛠 Developer Guidelines (Must Read)

To ensure consistency, maintainable code, and efficient collaboration, your submission **must strictly follow these mandatory technical guidelines**. Submissions that do not meet these standards will not be approved or considered.

---

Develop a **pixel-perfect UI/UX clone of [ChatGPT](https://chat.openai.com)** using the **Vercel AI SDK** for responses, equipped with **advanced capabilities** including:

- Chat memory
- Image/file upload support
- Message editing
- Long-context handling
- And more

The final product must demonstrate engineering excellence, complete user experience parity with ChatGPT, and seamless backend integration.

---

## 📋 Functional Requirements

### ✅ Core Chat Interface (UI/UX)

- **Match ChatGPT UI exactly** — replicate layout, spacing, fonts, animations, scrolling behavior, modals, etc.
- Ensure full **mobile responsiveness** and accessibility (ARIA-compliant).
- **Edit Message**: User must be able to edit previously submitted messages with seamless regeneration behavior.

---

### 🤖 Chat Functionality (Vercel AI SDK)

- Integrate **Vercel AI SDK** for handling chat responses.
- Include **context window handling** logic: segment or trim historical messages for models with limited context size.
- Implement **message streaming** with graceful UI updates.

---

### 🧠 Memory / Conversation Context

- Add memory capability using [mem0](https://sdk.vercel.ai/docs/memory).

---

### 🗂 File & Image Upload Support

Support uploading:

- 🖼 Images: PNG, JPG, etc.
- 📄 Documents: PDF, DOCX, TXT, etc.

---

## 🏗 Backend Specifications

### 🧬 API Architecture

- Use a **Next.js** backend.
- Handle token limits based on model constraints (e.g., GPT-4-turbo context window).

---

### 🗄 File Storage

- Use **Cloudinary** or **Uploadcare** for secure storage.

---

### 🔗 Webhook Support

- Support **external service callbacks** (e.g., background processors or file transformation triggers).

---

## ✅ Deliverables Checklist

- ✅ Pixel-perfect ChatGPT clone UI
- ✅ Fully functional chat using Vercel AI SDK
- ✅ Chat memory, file/image upload, message editing
- ✅ Backend with MongoDB, Cloudinary integration
- ✅ Deployed on **Vercel**
- ✅ Complete README and environment setup
- ✅ Well-documented, maintainable, modular codebase
