# DevToolNest - Replit Configuration

## Overview

DevToolNest is a comprehensive suite of professional developer tools built as a full-stack web application. It provides a unified platform for various development tasks including API testing, JWT decoding, JSON formatting, data conversion, and more. The application is designed as a modular tool suite with each feature accessible through dedicated routes. The current implementation includes 10 professional tools with a vibrant, modern UI featuring gradient backgrounds, animations, and glass morphism effects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query for server state, local state with React hooks
- **Theme Support**: next-themes for dark/light mode switching
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for server bundling
- **Architecture Pattern**: Simple server for static assets and health checks

### Storage Layer
- **Client Storage**: localStorage for user preferences and tool configurations
- **Data Processing**: All tools work client-side with no server-side data persistence
- **Architecture**: Standalone application with client-side data management
- **No Authentication**: No login system, no user accounts, no database required

## Key Components

### Tool Modules
The application is organized around individual tool modules, each with its own route:

1. **ReqNest** (`/reqnest`) - HTTP API request builder and tester
2. **SpecCraft** (`/spec-craft`) - OpenAPI spec editor with YAML parsing, visual indentation guides, and cURL generation
3. **TokenPeek** (`/token-peek`) - JWT token decoder and validator
4. **PrettyJSON** (`/pretty-json`) - JSON formatter and validator
5. **DataMorph** (`/data-morph`) - Data format converter (CSV/JSON)
6. **TimeFlip** (`/time-flip`) - Timestamp converter and timezone utility
7. **MockWizard** (`/mock-wizard`) - Mock data generator
8. **ThrottleViz** (`/throttle-viz`) - Rate limiting visualization
9. **FlowTrace** (`/flow-trace`) - Code flow analysis tool
10. **ImageSqueeze** (`/image-squeeze`) - Image compression and optimization tool
11. **CVForge** (`/cv-forge`) - Resume/CV builder and PDF generator

### UI Components
- **Component Library**: shadcn/ui components with Radix UI primitives
- **Layout System**: Sidebar navigation with header layout
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Theme System**: CSS variables for consistent theming across light/dark modes

### Storage System
- **Client Storage**: localStorage wrapper with error handling
- **Collections**: Organized storage for request collections and tool data
- **Data Persistence**: Local storage for user preferences and tool state

## Data Flow

### Request Flow
1. User interacts with tool interface
2. Frontend validates and processes input client-side
3. All data processing happens in the browser
4. Results displayed immediately without server round-trips

### State Management
- **Local State**: React hooks for component state
- **Persistent State**: localStorage for user preferences and tool configurations
- **Theme State**: next-themes for theme persistence
- **No Server State**: All processing is client-side

### Data Storage
- **Client Storage**: localStorage for user data and preferences
- **Session Storage**: Temporary data for current session
- **No Backend Storage**: All data processing happens client-side
- **No Database**: No authentication, no user accounts, no collaboration features

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **next-themes**: Theme management
- **wouter**: Lightweight routing
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **vite**: Development server and build tool
- **@replit/vite-plugin-***: Replit-specific development plugins

### Tool-Specific Dependencies
- **@faker-js/faker**: Mock data generation
- **canvas**: Image processing capabilities
- **papaparse**: CSV parsing and processing
- **date-fns**: Date manipulation utilities

## Deployment Strategy

### Development Environment
- **Server**: Express with Vite middleware for HMR
- **Client**: Vite dev server with React Fast Refresh
- **Storage**: Client-side localStorage only
- **Build**: tsx for server execution, Vite for client bundling

### Production Build
- **Server**: esbuild bundle with ES modules
- **Client**: Vite production build with optimizations
- **Static Assets**: Served from dist/public directory

### Environment Configuration
- **NODE_ENV**: Environment mode (development/production)
- **PORT**: Server port (default: 5000)
- **Build Scripts**: Separate build processes for client and server

The application uses a simplified architecture with client-side processing and no database dependencies. The modular architecture allows for easy addition of new tools while maintaining consistency in the user experience.

## Recent Changes

### January 12, 2025 - Critical Issue Resolution
- **Fixed button overlap issue**: Implemented improved responsive button layout design with better spacing and size controls
- **Resolved JSX structure errors**: Fixed TabsContent closing tag issues that were preventing app startup
- **Fixed import functionality**: Enhanced SpecCraft to ReqNest import using localStorage for reliable data transfer
- **Improved stability**: Eliminated application crashes and enhanced overall user experience
- **Enhanced button design**: Added proper responsive breakpoints and better hover states for all UI buttons

### Import Functionality Details
- SpecCraft now properly exports request data (method, URL, headers, body, parameters) to localStorage
- ReqNest automatically detects and imports the stored data on page load
- Import process includes data validation and normalization to ensure compatibility
- User receives toast notifications confirming successful import operations

### UI/UX Improvements
- Button layout no longer overlaps when panels are resized
- Improved responsive design with better spacing controls
- Enhanced button visibility and interaction states
- Fixed horizontal layout with proper resizable panels