# ⏳ Time Capsule: A Digital Memory Vault

**Time Capsule** is a full-stack web application designed as a digital vault for users to create, store, and securely share personal and collaborative "time capsules" with friends and family. This project moves beyond a simple note-taking app by implementing a robust, secure sharing system with nuanced data privacy rules.

**[Live Demo](https://time-capsule-ashen.vercel.app/)**

## ✨ Core Features

This project is built around three core feature sets: a personal space ("My Capsule"), a collaborative group space ("Shared Space"), and a 1-to-1 sharing mechanism ("Inbox").

### My Capsule (Personal)

* **Journal:** Create, read, update, and delete personal journal entries with optional image uploads.
* **Future Letters:** Write letters to your future self that are "locked" until a specified unlock date.
* **Bucket List & Favorites:** Track personal goals and lists of favorite media.
* **"Soft Delete" Logic:** Deleting an item from "My Capsule" only flags it as `is_deleted` in the database. This hides it from the user's personal view but **preserves it** for any user it has been shared with in the Inbox.
* **Share 1-to-1:** Securely share any item from "My Capsule" with another user via the Inbox.

### 👥 Shared Space (Collaborative)

* **Create Capsules:** Users can create new collaborative "capsules" and invite friends by email.
* **Shared Content:** All members can add and view shared journal entries (with images) and shared future letters.
* **"Hard Delete" Logic:** Any member can delete an item, which permanently removes it from the database for *everyone* in that capsule.
* **Locked Letter Rule:** To protect the capsule's integrity, future-dated letters *cannot* be deleted by anyone until their unlock date has passed.

### 📬 Inbox & Sharing System

* **Share 1-to-1:** Users can send any "My Capsule" item (journal, letter) to another user.
* **Edge Function:** A Supabase Edge Function is used to securely find a recipient's User ID from their email without exposing user data to the client.
* **"Sent" & "Received" Tabs:** A fully functional inbox that shows all items a user has sent or received.
* **"Per-User Soft Delete":** Deleting an item from the "Sent" or "Received" tab only flags it as `sender_deleted` or `recipient_deleted`. The item is removed from only that user's view, not the other's.
* **Secure Viewer Modal:** Clicking "View Item" fetches the original content *only if* the user is the sender or recipient, enforced by complex RLS policies.
* **Download Images:** Users can download images from shared journal entries.

---

## 🛠 Tech Stack

* **Frontend:** React.js (Vite), Chakra UI, React Icons, React Router
* **Backend (BaaS):** Supabase
* **Database:** Supabase Postgres
* **Authentication:** Supabase Auth
* **File Storage:** Supabase Storage (for journal images)
* **Serverless Logic:** Supabase Edge Functions (Deno/TypeScript)
* **Deployment:** Vercel (CI/CD from GitHub)

---

## 🚀 Getting Started

To run this project locally, you will need to create your own Supabase project.

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/time-capsule.git](https://github.com/your-username/time-capsule.git)
cd time-capsule
