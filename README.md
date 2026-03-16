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
* **Frontend:** Next.js 15 (App Router), TailwindCSS, Shadcn UI.
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
* **MediaAsset:** The primary entity and single source of truth. Contains the secure B2 storage URL, exact `capture_time` (extracted from EXIF for dynamic chronological sorting), `mime_type`, and a PostGIS geometry (`Point`) for geospatial mapping. The timeline dynamically groups these assets by day, week, or month at the query level.
* **Tag:** (Future feature) Categorical labels (e.g., training, concert, project) applied to MediaAssets via an asynchronous Go worker and AI vision pipeline.

---

## Repository Structure (Turborepo)
* `apps/web/` - Next.js 15 frontend
* `apps/api/` - Go backend service
* `packages/ui/` - Shared React components / Shadcn
* `packages/proto/` - Generated ConnectRPC interfaces & TS definitions
* `package.json` - Root Turborepo config
* `turbo.json` - Task runner configuration
