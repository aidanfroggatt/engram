# Engram

## Overview
A secure, mobile-first, single-tenant media application designed to serve as a private digital journal. This project replaces a legacy reliance on Instagram for weekly life tracking, migrating the process to a fully owned, high-performance, self-hosted platform. 

It is designed as a polyglot monorepo, utilizing a mathematically strict API contract to bridge a React frontend with a high-throughput Go backend.

## Core Philosophy
* **Data Ownership:** Complete control over personal media assets, metadata, and geospatial history.
* **Low-Friction Curation:** The upload process must be exceptionally smooth on mobile devices (iOS/iPadOS) to encourage the weekly habit.
* **Automated Structuring:** The system relies on client-side EXIF data extraction (timestamps, geolocation) to organize media chronologically and spatially.
* **Strict Type Safety:** Zero undefined types. The database schema acts as the single source of truth, generating Protocol Buffers that dictate the exact contract between the Go backend and the TypeScript frontend.

---

## High-Level System Architecture

### The Tech Stack
* **Frontend:** Next.js 15 (App Router), TailwindCSS, Shadcn UI (Manual Install).
* **API Contract:** ConnectRPC (Protocol Buffers).
* **Backend:** Go (Standard Library `net/http`).
* **ORM & Schema:** `Ent` (with `entproto` to auto-generate `.proto` files from Go structs).
* **Database:** PostgreSQL with PostGIS (Hosted on Neon).
* **Asset Storage:** Backblaze B2 (S3-Compatible Object Storage).
* **Authentication:** Clerk (Stateless JWTs verified in Go via JWKS).

### The Ingestion Pipeline (Pre-Signed URL Workflow)
To bypass serverless execution limits and maintain a highly performant Go backend, the system utilizes a Pre-Signed URL upload strategy:
1. **Client Parsing:** The user selects media on iOS. The Next.js client uses `exifr` to extract timestamp and GPS data locally.
2. **Ticket Request:** Next.js sends a ConnectRPC request to Go (authenticated via Clerk JWT) requesting secure upload URLs.
3. **The Handoff:** Go verifies the JWT, requests short-lived Pre-Signed URLs from Backblaze B2, and returns them to the client.
4. **Direct Upload:** Next.js streams the binary files directly to Backblaze B2. 
5. **Database Commit:** Upon successful B2 upload, Next.js sends the final B2 file paths and extracted EXIF data to Go via ConnectRPC. Go uses `Ent` to commit the structured data to PostGIS.

---

## Conceptual Data Models
* **Week:** The core organizational unit. Contains a start date, end date, and an optional user-defined summary.
* **MediaAsset:** Individual photos or videos. Belongs to a Week. Contains B2 storage URL, timestamp, EXIF data, and PostGIS geometry (Point) for location.
* **Tag:** (Future feature) Categorical labels (e.g., training, concert, project) applied to MediaAssets, eventually populated via an async AI vision pipeline.

---

## Repository Structure (Turborepo)
* `apps/web/` - Next.js 15 frontend
* `apps/api/` - Go backend service
* `packages/ui/` - Shared React components / Shadcn
* `packages/proto/` - Generated ConnectRPC interfaces & TS definitions
* `package.json` - Root Turborepo config
* `turbo.json` - Task runner configuration

---

## Development Phases

### Phase 1: Infrastructure & Contract (Current)
* Initialize Turborepo structure.
* Define the database schema using Go `Ent`.
* Configure `entproto` to generate the `.proto` files and ConnectRPC handlers.
* Set up Clerk authentication and Go JWT middleware verification.

### Phase 2: The Core Engine & Migration (MVP)
* Build the client-side `exifr` parsing logic in Next.js.
* Implement the Backblaze B2 Pre-Signed URL upload pipeline.
* Develop the timeline UI (Week / Day views).
* Execute the legacy JSON/media migration script.

### Phase 3: The Polish & Cutting Edge
* Implement habit-enforcement UI lockouts.
* Integrate PostGIS queries to map media assets on a 3D geospatial globe.
* Build asynchronous Go workers for AI-driven auto-tagging.
