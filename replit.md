# BeamShare - P2P File Transfer Application

## Overview

BeamShare is a serverless peer-to-peer file transfer application built with React, TypeScript, and WebRTC. The application enables direct device-to-device file sharing without requiring servers or user accounts. Files are transferred using WebRTC DataChannels with optional end-to-end encryption, ensuring privacy and security. The app features QR code-based pairing, PWA capabilities for mobile installation, and a modern glassmorphism UI design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: Custom hooks for WebRTC and file transfer state management
- **Routing**: Wouter for lightweight client-side routing
- **PWA Support**: Service worker implementation for offline capabilities and mobile installation

### WebRTC P2P Architecture
- **Connection Protocol**: WebRTC DataChannels for direct peer-to-peer communication
- **Signaling Method**: QR code-based SDP exchange (no signaling server required)
- **NAT Traversal**: STUN servers for connection establishment through firewalls
- **Data Transfer**: Chunked file streaming with backpressure control and integrity checking
- **Encryption**: Optional AES-GCM encryption layer using Web Crypto API

### File Management System
- **Modern File Access**: File System Access API for directory picker on supported browsers
- **Fallback Methods**: Traditional download links, Web Share API, and OPFS for broader compatibility
- **File Processing**: Chunked reading and streaming for large file support
- **Progress Tracking**: Real-time transfer progress with speed calculation and ETA

### UI/UX Design Pattern
- **Design System**: Glassmorphism aesthetic with backdrop blur and transparency effects
- **Responsive Layout**: Mobile-first design with desktop optimizations
- **Theme Support**: Light/dark mode switching with system preference detection
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

### Security Model
- **Transport Security**: WebRTC's built-in DTLS encryption for all data transmission
- **Optional App-Level Encryption**: User-supplied passcode derives AES-GCM keys for additional security
- **Privacy-First**: No data logging, analytics, or server-side storage
- **Local Storage**: All pairing codes and session data remain on device

### Development Architecture
- **Monorepo Structure**: Shared schema and utilities between client and minimal server
- **Type Safety**: Full TypeScript coverage with shared types
- **Component Architecture**: Reusable UI components with clear separation of concerns
- **Custom Hooks**: Encapsulated WebRTC logic, file transfer management, and UI state

### Progressive Web App Features
- **Installability**: Web app manifest for home screen installation
- **Service Worker**: Caching strategy for offline functionality
- **Platform Integration**: Native-like experience on mobile devices
- **Cross-Platform**: Consistent experience across desktop and mobile browsers

## External Dependencies

### Core Runtime Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for state management
- **WebRTC Libraries**: Native browser WebRTC APIs with QRCode.js for QR generation
- **UI Components**: Radix UI primitives, Lucide React icons, shadcn/ui components
- **Styling**: Tailwind CSS with class variance authority for component variants
- **Utilities**: date-fns for date handling, clsx for conditional styling

### Development Dependencies
- **Build Tools**: Vite with React plugin and TypeScript support
- **Database ORM**: Drizzle ORM with PostgreSQL adapter (for potential future features)
- **Code Quality**: TypeScript compiler, ESLint configuration
- **Replit Integration**: Vite plugins for Replit development environment

### Browser APIs
- **WebRTC APIs**: RTCPeerConnection, RTCDataChannel for P2P communication
- **File System Access API**: For modern directory selection on supported browsers
- **Camera API**: MediaDevices for QR code scanning functionality
- **Web Crypto API**: For optional end-to-end encryption features
- **Service Worker API**: For PWA capabilities and caching

### External Services
- **STUN Servers**: Google's public STUN servers for NAT traversal
- **Optional TURN Server**: User-configurable relay server for restrictive networks
- **No Analytics**: Privacy-first approach with no external tracking services