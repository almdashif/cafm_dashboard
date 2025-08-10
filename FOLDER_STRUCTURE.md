# CAFM Dashboard - MNC Folder Structure

This document outlines the new enterprise-level folder structure following Multi-National Corporation (MNC) standards.

## 📁 Folder Structure

```
src/
├── app/                           # Application core
│   ├── components/                # Shared/reusable components
│   ├── pages/                     # Page components
│   │   └── App.tsx               # Main application component
│   ├── layouts/                   # Layout components
│   │   └── MainLayout.tsx        # Main layout wrapper
│   └── providers/                 # Context providers
│       └── AuthContext.tsx       # Authentication context
├── features/                      # Feature-based modules
│   ├── auth/                      # Authentication feature
│   │   ├── Login.tsx             # Login component
│   │   └── Login.css             # Login styles
│   ├── dashboard/                 # Dashboard feature
│   │   ├── Dashboard.tsx         # Dashboard component
│   │   └── Dashboard.css         # Dashboard styles
│   └── file-management/           # File handling feature (future)
├── shared/                        # Shared utilities and components
│   ├── components/                # Common UI components
│   │   └── index.ts              # Component exports
│   ├── hooks/                     # Custom hooks
│   │   └── useFileHandler.ts     # File handling hook
│   ├── types/                     # TypeScript type definitions
│   │   └── index.ts              # Type exports
│   ├── utils/                     # Utility functions
│   │   ├── excelUtils.ts         # Excel processing utilities
│   │   └── exportUtils.ts        # Export functionality
│   ├── constants/                 # Application constants
│   │   └── index.ts              # Constant exports
│   ├── styles/                    # Global styles and themes
│   │   └── index.css             # Global styles
│   └── assets/                    # Static assets
│       └── images/                # Image assets
├── config/                        # Configuration files
│   └── vite-env.d.ts             # Vite environment types
└── index.ts                       # Application entry point
```

## 🏗️ Architecture Principles

### 1. **Feature-Based Organization**
- Each feature is self-contained in its own directory
- Features can have their own components, hooks, and utilities
- Promotes modularity and maintainability

### 2. **Shared Resources**
- Common utilities, types, and components are centralized
- Prevents code duplication across features
- Ensures consistency across the application

### 3. **Clear Separation of Concerns**
- **App Core**: Application-level logic and providers
- **Features**: Business logic and feature-specific components
- **Shared**: Reusable utilities and common components

### 4. **Scalability**
- Easy to add new features without affecting existing code
- Clear import paths and dependencies
- Follows industry best practices

## 🔄 Migration Benefits

### Before (Flat Structure)
```
src/
├── App.tsx
├── App.css
├── Login.tsx
├── Login.css
├── Dashboard.tsx
├── Dashboard.css
├── context/
├── hooks/
├── types/
├── utils/
└── assets/
```

### After (MNC Structure)
```
src/
├── app/                           # Clear application core
├── features/                      # Organized by business features
├── shared/                        # Centralized shared resources
└── config/                        # Configuration management
```

## 📝 Import Examples

### Feature Components
```tsx
import Login from '../../features/auth/Login';
import Dashboard from '../../features/dashboard/Dashboard';
```

### Shared Resources
```tsx
import { useAuth } from '../../app/providers/AuthContext';
import { useFileHandler } from '../../shared/hooks/useFileHandler';
import { ExcelRow } from '../../shared/types';
```

### Constants
```tsx
import { APP_NAME, SUPPORTED_FILE_TYPES } from '../../shared/constants';
```

## 🚀 Future Enhancements

1. **Component Library**: Add shared UI components in `src/shared/components/`
2. **Theme System**: Implement theming in `src/shared/styles/`
3. **API Layer**: Add API services in `src/shared/services/`
4. **Testing**: Add test files alongside components
5. **Documentation**: Add component documentation in each feature

## 🔧 Development Guidelines

1. **New Features**: Create new directories in `src/features/`
2. **Shared Logic**: Place in `src/shared/` if used by multiple features
3. **App-Level Logic**: Place in `src/app/` if it affects the entire application
4. **Imports**: Use relative paths from the current file location
5. **Naming**: Use PascalCase for components, camelCase for utilities

This structure follows enterprise-level standards and provides a solid foundation for scalable application development.
