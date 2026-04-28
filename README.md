# HomeStock – Household Inventory Management System

A production-quality home inventory system with barcode scanning, stock tracking, expiry alerts, and movement history. The UI is in German by default with i18n architecture ready for Arabic and other languages.

---

## Features

- **Barcode Scanning** – Use device camera or manual entry. Looks up local DB first, then Open Food Facts API
- **Product Management** – Full CRUD with name, barcode, category, quantity, unit, expiry date, location, and notes
- **Stock Alerts** – Color-coded badges for good/low/out-of-stock and normal/expiring-soon/expired
- **Inventory Movements** – Log IN / OUT / ADJUST movements with quantity history per product
- **Alerts Dashboard** – Unified view of all out-of-stock, low-stock, expired, and expiring-soon products
- **Shopping List** – Auto-generated from products where `quantity <= minQuantity`
- **Category Management** – Create, edit, and delete categories with custom colors
- **Responsive UI** – Sidebar on desktop, bottom navigation on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | MongoDB + Mongoose |
| Validation | Zod v4 |
| Forms | React Hook Form + Zod resolver |
| Barcode Scanner | html5-qrcode |
| External API | Open Food Facts |
| Icons | lucide-react |

---

## Architecture

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/
│   │   ├── alerts/
│   │   ├── barcode/[barcode]/
│   │   ├── categories/[id]/
│   │   ├── dashboard/
│   │   ├── movements/
│   │   ├── products/[id]/movements/
│   │   └── shopping-list/
│   ├── alerts/
│   ├── inventory/[id]/edit/
│   ├── movements/
│   ├── scan/
│   ├── settings/
│   └── shopping-list/
├── components/
│   ├── layout/             # Sidebar, BottomNav, Header
│   ├── product/            # ProductForm, ProductCard, MovementModal
│   ├── scanner/            # BarcodeScanner (dynamic import)
│   └── ui/                 # Badge, Button, Card, Input, Modal, ...
├── i18n/
│   ├── de.ts               # German translations (default)
│   ├── ar.ts               # Arabic (scaffold)
│   └── index.ts            # t() helper, setLanguage()
├── lib/
│   └── mongodb.ts          # Mongoose connection with caching
├── models/
│   ├── Category.ts
│   ├── Movement.ts
│   └── Product.ts
├── schemas/
│   └── product.schema.ts   # Zod schemas (shared server + client)
├── services/               # All DB logic isolated here
│   ├── alert.service.ts
│   ├── barcode.service.ts
│   ├── category.service.ts
│   ├── movement.service.ts
│   ├── product.service.ts
│   └── shopping-list.service.ts
└── types/
    └── index.ts            # Shared TypeScript types + utility functions
```

**Architecture rules enforced:**
- All database logic lives in `services/`
- API routes call services only — no Mongoose in route handlers
- React components call API routes — no direct DB access
- Zod validates on both server (API) and client (React Hook Form)

---

## Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Steps

```bash
# 1. Navigate to the app directory
cd homestock-app

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set MONGODB_URI

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/homestock` |

Create `.env.local`:
```
MONGODB_URI=mongodb://localhost:27017/homestock
```

---

## API Routes

### Products
| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | List all products (supports `?search=`, `?categoryId=`, `?status=`) |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product by ID |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/:id/movements` | Get movements for product |

### Categories
| Method | Route | Description |
|---|---|---|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Movements
| Method | Route | Description |
|---|---|---|
| GET | `/api/movements` | List movements (supports `?limit=`) |
| POST | `/api/movements` | Create movement (updates product quantity) |

### Barcode
| Method | Route | Description |
|---|---|---|
| GET | `/api/barcode/:barcode` | Lookup barcode in DB then Open Food Facts |

### Other
| Method | Route | Description |
|---|---|---|
| GET | `/api/alerts` | Get all alert categories |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/shopping-list` | Products at or below minimum quantity |

---

## Database Models

### Product
```typescript
{
  name: string
  barcode?: string (unique sparse index)
  categoryId?: ObjectId → Category
  quantity: number
  unit: "piece" | "kg" | "g" | "liter" | "ml" | "box" | "pack"
  minQuantity: number
  expiryDate?: Date
  image?: string
  location?: "kitchen" | "freezer" | "bathroom" | "storage"
  notes?: string
  createdAt, updatedAt
}
```

### Category
```typescript
{
  name: string
  color?: string (hex)
  createdAt, updatedAt
}
```

### Movement
```typescript
{
  productId: ObjectId → Product
  type: "IN" | "OUT" | "ADJUST"
  quantity: number
  previousQuantity: number
  newQuantity: number
  note?: string
  createdAt
}
```

---

## i18n

All UI text is stored in `src/i18n/de.ts`. No hardcoded German strings in components.

To add Arabic support:
1. Fill in `src/i18n/ar.ts`
2. Call `setLanguage("ar")` from a language switcher component
3. The `t()` function will fall back to German for any missing keys

---

## Screenshots

> Add screenshots here after setup

| Dashboard | Inventory | Barcode Scanner |
|---|---|---|
| ![Dashboard]() | ![Inventory]() | ![Scanner]() |

---

## Future Improvements

- [ ] Authentication (NextAuth.js)
- [ ] Multi-household / multi-user support
- [ ] Push notifications for expiry alerts
- [ ] PWA / offline support
- [ ] CSV export of inventory / movements
- [ ] Language switcher in the UI (German / Arabic)
- [ ] Bulk import via CSV
- [ ] Receipt scanning with OCR
- [ ] Shopping list sharing
