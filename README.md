# AutoParts Lanka - Parts Request System

A modern, responsive web application for a vehicle spare-parts business. This application serves as a product catalog and a request cart system, allowing customers to easily browse parts, add them to a cart, and send a request to the business owner.

## Features

- **Modern & Clean UI**: Professional automotive style tailored for a spare parts business.
- **Product Catalog**: Browse, search, and filter by category and vehicle brand.
- **Request Cart**: Add parts, adjust quantities, and submit requests without online payments.
- **WhatsApp Integration**: Direct messaging links pre-filled with product inquiries.
- **Automated Emails**: Sends HTML emails to the business owner upon request submission.
- **Responsive**: Fully functional across desktop, tablet, and mobile devices.
- **Local Storage**: Cart state is persisted across page reloads.

## Technology Stack

- **Frontend**: React 19, Vite, React Router, Tailwind CSS, Zustand, Lucide React
- **Backend**: Node.js, Express.js
- **Emails**: Nodemailer
- **Security**: Helmet, CORS, Express Rate Limit

## Folder Structure

\`\`\`text
/
├── server.ts                 # Express backend entry point
├── src/
│   ├── api.ts                # Frontend API client
│   ├── config.ts             # Centralized business configuration
│   ├── types.ts              # Global TypeScript interfaces
│   ├── store/
│   │   └── cartStore.ts      # Zustand cart state management
│   ├── components/           # Reusable UI components
│   └── pages/                # Route pages (Home, Products, Cart, etc.)
└── package.json              # Project dependencies & scripts
\`\`\`

## Configuration

### Business Information
You can update the business details (name, phone, WhatsApp, email, address) by editing \`src/config.ts\`. This centralized config ensures changes apply throughout the app.

### Environment Variables
Configure the backend via environment variables. See \`.env.example\` for the structure.

To send real emails, you must configure an SMTP server (like Gmail App Passwords, SendGrid, or Amazon SES) in the environment variables:
\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
BUSINESS_EMAIL=sales@autopartslanka.com
\`\`\`

If \`SMTP_USER\` is not configured, the app will run in simulation mode and log successful requests to the server console instead of sending actual emails.

### Product Data
Currently, product data is stored as a simple JSON array in \`server.ts\` for ease of demonstration. To manage actual inventory, you can swap this out for a database integration (like Firestore or PostgreSQL).

## Running Locally

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
2. Start the development server (runs both Express backend and Vite frontend):
   \`\`\`bash
   npm run dev
   \`\`\`
3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`
4. Start production server:
   \`\`\`bash
   npm run start
   \`\`\`

## Deployment

The application is built to run as a Node.js container (e.g., on Google Cloud Run). The build script bundles the backend and compiles the frontend into a single package.

1. Ensure \`NODE_ENV=production\` is set on your hosting provider.
2. Ensure SMTP and other environment variables are securely configured.
3. The server will bind to port 3000 and serve the frontend static files automatically.
"# GearXpert" 
