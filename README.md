# Time Capsule ⏳

A full-stack web application for preserving personal memories. This app lets you create a private journal, track a bucket list, seal letters to be opened on a future date, and dynamically search for and save your favorite media.

### ✨ [View Live Demo](https://time-capsule-ashen.vercel.app/) ✨

---

### 📸 Screenshots
<img width="1897" height="908" alt="image" src="https://github.com/user-attachments/assets/b48a6f07-0a3f-4d80-9450-71ce135ab2b0" />
<img width="1901" height="906" alt="image" src="https://github.com/user-attachments/assets/e6781bb2-0163-40ad-91b9-bb4e0d7aac24" />
<img width="1901" height="909" alt="image" src="https://github.com/user-attachments/assets/dac80461-e69a-4006-9a8f-8b696ca412b4" />

---

### 🚀 Key Features

* **Full User Authentication:** Secure sign-up, login, and protected routes using Supabase Auth.
* **Personal Journal:** A rich text editor to write, save, and view journal entries with optional image uploads.
* **Bucket List:** A dynamic to-do list to add, track, and check off life goals.
* **Future Letters:** A component to write and "seal" a letter that can only be opened on or after a future date selected by the user.
* **API-Powered Favorites Log:**
    * Search for real-time data on movies (from TMDb), books (from Google Books), and songs (from Genius).
    * A Supabase Edge Function (serverless) is used to securely call the Genius API and bypass CORS errors.
    * Save selected media to your personal list with your own comments.

---

### 🛠️ Tech Stack

* **Frontend:** React, Vite
* **UI Library:** Chakra UI
* **Routing:** React Router
* **Backend-as-a-Service (BaaS):** Supabase
    * **Database:** Supabase (PostgreSQL)
    * **Authentication:** Supabase Auth
    * **File Storage:** Supabase Storage
    * **Serverless:** Supabase Edge Functions (for Genius API)
* **APIs:**
    * The Movie Database (TMDb)
    * Google Books
    * Genius
* **Deployment:** Vercel

---

### ⚙️ How to Run Locally

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/](https://github.com/)[Your-Username]/[Your-Repo-Name].git
    cd time-capsule
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Create your Supabase project:**
    * Create a new project on [Supabase.com](httpss://supabase.com/).
    * Add the `journal`, `bucket_list`, `future_letters`, and `favorites` tables. (You can use the SQL Editor in Supabase).
    * Enable RLS policies for all tables to ensure users can only access their own data.

4.  **Set up your `.env.local` file:**
    * Create a file named `.env.local` in the root of the project.
    * Add your API keys. (The `GENIUS_ACCESS_TOKEN` is set as a Supabase Secret, not here).
    ```
    VITE_SUPABASE_URL="YOUR_PROJECT_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
    VITE_TMDB_API_KEY="YOUR_TMDB_API_KEY"
    VITE_GOOGLE_BOOKS_API_KEY="YOUR_GOOGLE_BOOKS_KEY"
    ```

5.  **Set up the Supabase Edge Function:**
    * Install the Supabase CLI: `npm install supabase --save-dev`
    * Link your project: `npx supabase link --project-ref <YOUR_PROJECT_ID>`
    * Set your Genius secret: `npx supabase secrets set GENIUS_ACCESS_TOKEN=<YOUR_GENIUS_TOKEN>`
    * Deploy the function: `npx supabase functions deploy`

6.  **Run the app:**
    ```sh
    npm run dev
    ```

---

### 🗺️ Future Roadmap

* **Social Features:** Implement "Collaborative Capsules" for friends and families.
* **Gamification:** Add a "Streak" counter for daily journaling.
* **AI Integration:** Use an AI model to provide "On this day..." summaries from past journal entries.
