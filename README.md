# 🚀 PROCUREFLOW - Procurement Management System

A comprehensive, enterprise-grade procurement management system built with modern web technologies, featuring integrated Stripe payment processing, role-based access control, and automated database management.

![Procurement System](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Stripe](https://img.shields.io/badge/Stripe-18.4.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.55.0-purple)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [Database Schema](#-database-schema)
- [Payment Integration](#-payment-integration)
- [User Roles & Permissions](#-user-roles--permissions)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)

## 🌟 Overview

PROCUREFLOW is a full-stack procurement management solution designed to streamline the entire procurement lifecycle - from initial request creation to final payment processing. The system automates payment terms based on order amounts, provides comprehensive vendor management, and offers real-time tracking of procurement requests and purchase orders.

### 🎯 Key Benefits

- **Automated Workflow**: Streamlined procurement process from request to payment
- **Smart Payment Terms**: Automatic assignment based on order amounts (Immediate, Net 30, Net 60)
- **Role-Based Security**: Granular access control for different user types
- **Payment Integration**: Seamless Stripe integration for secure transactions
- **Real-Time Tracking**: Live updates on request status and payment progress
- **Vendor Management**: Comprehensive vendor registration and management
- **Inventory Control**: Track item receipt and inventory status

## ✨ Features

### 🔐 Authentication & Authorization
- **Multi-Provider Auth**: Google OAuth integration via Supabase
- **Role-Based Access Control**: Admin, Procurement Officer, Team Lead, Employee
- **Secure Sessions**: JWT-based authentication with automatic refresh

### 📝 Request Management
- **Request Creation**: Employees can create procurement requests
- **Approval Workflow**: Multi-level approval system (Team Lead → Procurement Officer)
- **Status Tracking**: Real-time updates on request progress
- **Document Upload**: Support for attachments and specifications

### 🛒 Purchase Order System
- **Auto-Generation**: Automatic PO creation from approved requests
- **Vendor Assignment**: Link POs to registered vendors
- **Payment Terms**: Automatic assignment based on order amounts
- **Status Management**: Track PO lifecycle (Issued → Shipped → Delivered → Received)

### 💳 Payment Processing
- **Stripe Integration**: Secure credit card and bank transfer processing
- **Payment Terms Logic**:
  - **Immediate** (< $1,000): Pay immediately
  - **Net 30** ($1,000 - $9,999): Pay within 30 days
  - **Net 60** ($10,000+): Pay within 60 days
- **Transaction Tracking**: Complete payment history and audit trail
- **Multi-Currency Support**: USD, INR, EUR, GBP, JPY, CAD

### 🏢 Vendor Management
- **Vendor Registration**: Admin/procurement officer registration
- **Profile Management**: Contact info, payment terms, performance history
- **Vendor Selection**: Choose vendors for specific purchase orders

### 📊 Reporting & Analytics
- **Request Analytics**: Track approval times and request volumes
- **Payment Reports**: Monitor payment schedules and vendor payments
- **Performance Metrics**: Vendor performance and procurement efficiency

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   (Next.js)     │◄──►│   (Node.js)      │◄──►│   (Supabase)    │
│                 │    │                  │    │                 │
│ • Dashboard     │    │ • Express API    │    │ • PostgreSQL    │
│ • User Auth     │    │ • Stripe Int.    │    │ • Row Level     │
│ • Forms & UI    │    │ • Auto Setup     │    │   Security      │
│ • Real-time     │    │ • CORS & Auth    │    │ • Triggers      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Stripe API    │    │   Google OAuth   │    │   File Storage  │
│                 │    │                  │    │                 │
│ • Payment       │    │ • Authentication │    │ • Documents     │
│ • Webhooks      │    │ • User Profile   │    │ • Attachments   │
│ • Refunds       │    │ • Role Mgmt      │    │ • Images        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.4.6 (React 19.1.0)
- **Styling**: Tailwind CSS 4.1.12
- **Authentication**: Supabase Auth with Google OAuth
- **State Management**: React Hooks + Context API
- **Payment UI**: Stripe Elements integration
- **Build Tool**: Next.js built-in bundler

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.1.0
- **Database**: Supabase (PostgreSQL)
- **Payment**: Stripe API 18.4.0
- **Authentication**: Supabase Auth
- **CORS**: Cross-origin resource sharing enabled

### Database
- **Primary**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for files
- **Security**: Row Level Security (RLS) policies

### DevOps & Tools
- **Version Control**: Git with GitHub
- **Environment**: Environment variable management
- **API Testing**: Built-in test endpoints
- **Documentation**: Comprehensive README and inline docs

## 📁 Project Structure

```
PROCUREFLOW-Procurement-Management-System/
├── 📁 procurement-frontend/          # Next.js Frontend Application
│   ├── 📁 app/                      # App Router (Next.js 13+)
│   │   ├── 📁 api/                  # API routes
│   │   ├── 📁 dashboard/            # Main dashboard pages
│   │   │   ├── 📁 inventory/        # Inventory management
│   │   │   ├── 📁 payments/         # Payment processing
│   │   │   ├── 📁 purchase-orders/  # PO management
│   │   │   ├── 📁 reports/          # Analytics & reporting
│   │   │   ├── 📁 requests/         # Request management
│   │   │   ├── 📁 settings/         # System configuration
│   │   │   ├── 📁 teams/            # Team management
│   │   │   └── 📁 vendors/          # Vendor management
│   │   ├── 📁 login/                # Authentication pages
│   │   ├── 📁 signup/               # User registration
│   │   ├── globals.css              # Global styles
│   │   ├── layout.jsx               # Root layout
│   │   └── page.jsx                 # Landing page
│   ├── 📁 contexts/                 # React contexts
│   ├── 📁 hooks/                    # Custom React hooks
│   ├── 📁 utils/                    # Utility functions
│   ├── 📁 public/                   # Static assets
│   ├── package.json                  # Frontend dependencies
│   ├── tailwind.config.js           # Tailwind configuration
│   └── .env.example                 # Environment template
│
├── 📁 procurement-backend/           # Node.js Backend API
│   ├── 📁 api/                      # API endpoints
│   │   └── 📁 stripe/               # Stripe payment API
│   │       └── create-payment-intent.js
│   ├── 📁 utils/                    # Utility modules
│   │   └── database-setup.js        # Auto database setup
│   ├── 📁 database-scripts/         # SQL schema files
│   │   ├── database-schema-updates.sql
│   │   ├── database-schema-updates-safe.sql
│   │   └── check-payment-status.sql
│   ├── index.js                     # Main server file
│   ├── package.json                  # Backend dependencies
│   ├── test-payment.html            # Payment testing page
│   └── .env.example                 # Environment template
│
├── README.md                         # This comprehensive guide
└── .gitignore                        # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** 8+
- **Git** for version control
- **Supabase** account for database
- **Stripe** account for payments
- **Google OAuth** credentials

### 1. Clone the Repository
```bash
git clone https://github.com/Mokshada30/PROCUREFLOW-Procurement-Management-System.git
cd PROCUREFLOW-Procurement-Management-System
```

### 2. Backend Setup
```bash
cd procurement-backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

### 3. Frontend Setup
```bash
cd ../procurement-frontend
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

### 4. Database Setup
The backend automatically checks and sets up the required database schema on startup. If manual setup is needed, run the SQL scripts in `procurement-backend/database-scripts/`.

## ⚙️ Environment Setup

### Backend Environment (.env)
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... or sk_live_...

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration (for production)
CORS_ORIGIN=https://yourdomain.com
```

### Frontend Environment (.env.local)
```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Google OAuth (for production)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
```

## 🗄️ Database Schema

### Core Tables
- **`users`**: User accounts and profiles
- **`teams`**: Team/department information
- **`procurement_requests`**: Initial procurement requests
- **`purchase_orders`**: Generated purchase orders
- **`vendors`**: Vendor information and details
- **`payment_transactions`**: Payment history and tracking
- **`payment_terms`**: Configurable payment terms

### Key Relationships
```
Users → Teams → Procurement Requests → Purchase Orders → Vendors
                ↓
            Payment Transactions ← Payment Terms
```

### Automated Features
- **Payment Terms Assignment**: Automatic based on order amounts
- **Status Updates**: Real-time PO and payment status tracking
- **Audit Trail**: Complete history of all transactions

## 💳 Payment Integration

### Stripe Features
- **Payment Intents**: Secure payment processing
- **Webhook Support**: Real-time payment status updates
- **Multi-Currency**: Support for 6 major currencies
- **Payment Methods**: Credit cards, bank transfers, digital wallets

### Payment Flow
1. **PO Creation** → Payment terms automatically assigned
2. **Payment Initiation** → Stripe Payment Intent created
3. **Payment Processing** → Secure transaction via Stripe
4. **Confirmation** → Database updated, status changed to "Paid"
5. **Audit Trail** → Complete transaction history maintained

### Security Features
- **PCI Compliance**: Stripe handles sensitive payment data
- **Encryption**: All data encrypted in transit and at rest
- **Fraud Protection**: Stripe's built-in fraud detection
- **Audit Logging**: Complete transaction audit trail

## 👥 User Roles & Permissions

### 🔐 Admin
- **Full System Access**: All features and data
- **User Management**: Create, modify, delete users
- **System Configuration**: Global settings and policies
- **Vendor Management**: Register and manage vendors

### 🛒 Procurement Officer
- **Request Processing**: Approve/reject procurement requests
- **PO Management**: Create and manage purchase orders
- **Payment Processing**: Initiate and manage payments
- **Vendor Relations**: Manage vendor relationships

### 👨‍💼 Team Lead
- **Request Approval**: Approve team member requests
- **Budget Management**: Monitor team spending
- **Team Oversight**: Manage team procurement activities

### 👤 Employee
- **Request Creation**: Submit procurement requests
- **Status Tracking**: Monitor request and PO progress
- **Limited Access**: View-only access to most features

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout

### Procurement Requests
- `GET /api/requests` - List all requests
- `POST /api/requests` - Create new request
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request

### Purchase Orders
- `GET /api/purchase-orders` - List all POs
- `POST /api/purchase-orders` - Create new PO
- `PUT /api/purchase-orders/:id` - Update PO
- `GET /api/purchase-orders/:id` - Get PO details

### Payments
- `POST /api/stripe/create-payment-intent` - Create Stripe payment
- `POST /api/stripe/confirm-payment` - Confirm payment
- `GET /api/stripe/payment-methods` - List payment methods

### Vendors
- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Register new vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Remove vendor

## 🚀 Deployment

### Production Environment Variables
```bash
# Backend
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Frontend
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Deployment Platforms
- **Vercel**: Frontend deployment (recommended for Next.js)
- **Railway/Heroku**: Backend deployment
- **Supabase**: Database and authentication
- **Stripe**: Payment processing

### Database Migration
The system includes automated database setup that runs on first deployment. For manual migrations, use the SQL scripts in the `database-scripts/` folder.

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- **Frontend**: Follow Next.js and React best practices
- **Backend**: Use Express.js conventions and async/await
- **Database**: Follow PostgreSQL naming conventions
- **Testing**: Include tests for new features
- **Documentation**: Update README for significant changes

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check Supabase credentials
# Verify network connectivity
# Check RLS policies
```

#### 2. Payment Processing Failures
```bash
# Verify Stripe API keys
# Check webhook configuration
# Review payment intent creation
```

#### 3. Authentication Issues
```bash
# Check Google OAuth configuration
# Verify Supabase Auth settings
# Check CORS configuration
```

#### 4. Frontend Build Errors
```bash
# Clear Next.js cache: rm -rf .next
# Reinstall dependencies: npm install
# Check Node.js version compatibility
```

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=procurement:*
```

### Support Resources
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check this README and inline code comments
- **Community**: Join our development community

## 📊 Performance & Scalability

### Optimization Features
- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Next.js built-in caching mechanisms
- **Lazy Loading**: Component and route lazy loading
- **Image Optimization**: Next.js automatic image optimization

### Monitoring
- **Performance Metrics**: Built-in performance monitoring
- **Error Tracking**: Comprehensive error logging
- **Database Monitoring**: Supabase performance insights
- **Payment Analytics**: Stripe dashboard integration

## 🔒 Security Features

### Data Protection
- **Row Level Security**: Database-level access control
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

### Authentication Security
- **JWT Tokens**: Secure session management
- **OAuth 2.0**: Industry-standard authentication
- **Password Policies**: Strong password requirements
- **Session Timeout**: Automatic session expiration

### Payment Security
- **PCI DSS Compliance**: Stripe handles sensitive data
- **Encryption**: End-to-end encryption
- **Fraud Protection**: Advanced fraud prevention
- **Audit Logging**: Complete transaction history

## 📈 Roadmap

### Future Possibilities
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Business intelligence dashboard
- **Workflow Automation**: Custom approval workflows
- **Integration APIs**: Third-party system integration
- **Multi-Tenant Support**: SaaS deployment model

### Version History
- **v1.0.0**: Core procurement system with Stripe integration
- **v1.1.0**: Enhanced reporting and analytics
- **v1.2.0**: Mobile application and API improvements
- **v2.0.0**: Advanced workflow automation

## 📞 Support & Contact

### Getting Help
- **Documentation**: Start with this README
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Join community discussions
- **Email Support**: Contact our development team

### Community
- **GitHub**: [PROCUREFLOW Repository](https://github.com/Mokshada30/PROCUREFLOW-Procurement-Management-System)
- **Discussions**: GitHub Discussions for community support
- **Contributing**: See CONTRIBUTING.md for development guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Supabase**: For the powerful backend-as-a-service
- **Stripe**: For secure payment processing
- **Tailwind CSS**: For the utility-first CSS framework
- **Open Source Community**: For all the amazing libraries and tools

---

*Building the future of procurement management, one feature at a time.*
