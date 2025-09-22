# Railway QR Code Generator - Free Standalone React App

A modern, responsive React application for generating QR codes for railway parts management. Deploy for free on Vercel, Netlify, or any static hosting platform.

## Features

- ✅ **Year-based Serial Numbers**: Each year gets its own sequence starting from 0001
- ✅ **Persistent Storage**: Maintains count across sessions using JSON backend
- ✅ **Professional UI**: Built with Tailwind CSS and Lucide React icons
- ✅ **TypeScript Support**: Full type safety with comprehensive interfaces
- ✅ **Print & Download**: Individual and batch operations
- ✅ **Generation History**: Track all previous QR code generations
- ✅ **Form Validation**: Zod schema validation with react-hook-form
- ✅ **Responsive Design**: Works on all devices
- ✅ **100% Free**: No API keys or subscriptions required

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Build for Production

```bash
npm run build
npm start
```

## Free Deployment Options

### 🚀 Vercel (Recommended)

1. Push your code to GitHub
2. Connect to [Vercel](https://vercel.com)
3. Deploy automatically
4. Set environment variables in Vercel dashboard

### 🌐 Netlify

1. Push code to GitHub
2. Connect to [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `.next`

### 📦 Static Export

```bash
npm run build
npm run export
```

Upload the `out/` folder to any static hosting service.

## Backend Deployment (Free Options)

### Railway.app (Free Tier)
```bash
# Deploy your Python Flask backend
railway login
railway init
railway up
```

### Render.com (Free Tier)
```bash
# Connect your GitHub repo with the Flask backend
# Render will auto-deploy
```

### Heroku (Free Alternative: Use Koyeb, Fly.io)
```bash
# Deploy Flask backend to any free Python hosting
```

## Project Structure

```
railway-qr-generator/
├── components/
│   └── RailwayQRGenerator.tsx    # Main component
├── types/
│   └── index.ts                  # TypeScript interfaces
├── services/
│   └── api.ts                    # API service layer
├── styles/
│   └── globals.css               # Global styles
├── examples/
│   └── usage.tsx                 # Usage examples
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind config
├── postcss.config.js             # PostCSS config
└── next.config.js                # Next.js config
```

## Usage

### Basic React App

```tsx
import React from 'react';
import { Toaster } from 'sonner';
import RailwayQRGenerator from './components/RailwayQRGenerator';
import './styles/globals.css';

function App() {
  return (
    <div className="App">
      <RailwayQRGenerator />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
```

### Builder.io Integration

1. Register the component:

```tsx
import { Builder } from '@builder.io/react';
import RailwayQRGenerator from './components/RailwayQRGenerator';

Builder.registerComponent(RailwayQRGenerator, {
  name: 'Railway QR Generator',
  inputs: [
    {
      name: 'apiBaseUrl',
      type: 'string',
      defaultValue: 'https://your-api.com',
      helperText: 'Base URL for the QR generation API'
    },
  ],
});
```

2. Use in Builder.io pages by dragging the "Railway QR Generator" component.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## API Configuration

Update the API base URL in `services/api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-production-api.com';
```

## Component Props

The main component accepts these optional props:

```tsx
interface RailwayQRGeneratorProps {
  apiBaseUrl?: string;          // Override API base URL
  defaultValues?: {             // Pre-fill form values
    partName?: string;
    vendorName?: string;
    year?: string;
    location?: string;
    quantity?: number;
  };
  onQRGenerated?: (qrCodes: QRCodeData[], batchInfo: BatchInfo) => void;
  className?: string;           // Additional CSS classes
}
```

## Customization

### Styling

The component uses Tailwind CSS. Customize colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#your-primary-color',
        dark: '#your-primary-dark',
      },
    },
  },
},
```

### Form Fields

Modify the form schema in `components/RailwayQRGenerator.tsx`:

```typescript
const qrFormSchema = z.object({
  partName: z.string().min(1, 'Part name is required'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  // Add or modify fields as needed
});
```

## QR Code Format

Generated QR codes follow this format:
```
<Part Name> - <Vendor Name>-<Year>-<Serial Number>-<Location>
```

Example: `Rail Pad - ADX-25-0001-JAL`

## Backend API Endpoints

### Generate QR Batch
```
POST /generate_qr_batch
Content-Type: application/json

{
  "partName": "Rail Pad",
  "vendorName": "ADX", 
  "year": "25",
  "location": "JAL",
  "quantity": 5
}
```

### Get Current Count
```
GET /get_current_count

Response:
{
  "total_count": 150,
  "year_counts": {
    "24": 75,
    "25": 75
  },
  "next_serial": 151
}
```

## Development

1. Start the backend:
```bash
cd backend
python app.py
```

2. Start the frontend:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.