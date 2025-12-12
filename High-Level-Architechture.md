┌─────────────────────────────────────────────────────────────────┐
│                      FULL STACK ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FRONTEND (Next.js - Port 3000)              │  │
│  │  - Admin Dashboard    - Creditor Dashboard               │  │
│  │  - Borrower Dashboard - Governance Dashboard             │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │ HTTP/REST                               │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │              BACKEND API (Express - Port 4000)           │  │
│  │  - 15 REST Endpoints                                     │  │
│  │  - Fabric Gateway SDK integration                        │  │
│  │  - Organization-based routing                            │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │ gRPC                                    │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │           BLOCKCHAIN NETWORK (Hyperledger Fabric)        │  │
│  │                                                           │  │
│  │  Channel 1: governance-channel (Government only)         │  │
│  │  Channel 2: financial-operations-channel (All 3 orgs)    │  │
│  │                                                           │  │
│  │  Organizations: Government | Creditor | Debtor           │  │
│  │  Peers: 3 | CouchDB: 3 | Orderer: 1 | CA: 3             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

📊 Loan Lifecycle Workflow
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  CREDITOR   │ →  │ GOVERNMENT  │ →  │   DEBTOR    │ →  │  CONFIRMED  │
│ Creates     │    │ Approves/   │    │ Accepts/    │    │    OR       │
│ Loan        │    │ Rejects     │    │ Declines    │    │  DECLINED   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
    Status:           Status:            Status:           Status:
 awaiting-admin    approved OR      confirmed OR      FINAL STATE
                   rejected         declined