🚌 eBusPass: Digital TSRTC Validator
A modern, secure, and paperless solution for the Telangana State Road Transport Corporation. This web application digitizes physical bus passes, allowing for real-time expiry validation and fraud prevention using dynamic QR codes.


✨ Key Features
 * Digital Pass Generation: Commuters can access their pass via a mobile-responsive dashboard.
 * Dynamic QR Codes: Prevents static screenshots; linked to a secure backend validation.
 * Conductor Scanner: A high-contrast, rear-camera scanner for bus conductors with instant "VALID/EXPIRED" feedback.
 * Role-Based Security: Strict RoleGuard protection for Admin and Conductor interfaces.
 * Admin Management: (In Progress) Verification of student IDs and pass activation.

🛠️ Tech Stack
 * Framework: Next.js 14+ (App Router)
 * Styling: Tailwind CSS
 * Backend & Auth: Firebase (Firestore & Auth)
 * Scanning: @yudiel/react-qr-scanner
 * Deployment: Vercel


🚀 Quick Start
 * Clone the repo:
   git clone https://github.com/your-username/ebuspass.git

 * Install dependencies:
   npm install

 * Configure Environment:
   Create a .env.local file and add your Firebase configuration keys.
 * Run locally:
   npm run dev


Developed as a Civic-Tech initiative for the commuters of Telangana.
