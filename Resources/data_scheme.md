Based on the Research Proposal on Blockchain-based Information Utilities (IUs), here’s a structured schema of financial data that should be stored for each financial institution and individual entity (like persons or companies) within the blockchain-integrated IU system:

⸻

🔵 1. For Financial Institutions (Banks, NBFCs, etc.):

Category	Data Fields
Institution Profile	Institution Name, Registration Number, Type (Bank, NBFC, etc.), PAN, GSTIN, Address, Contact Information
Balance Sheet Data	Assets, Liabilities, Net Worth, Capital Adequacy Ratio, Profit & Loss Statements
Credit Portfolio	Total Outstanding Loans, Types of Loans (secured, unsecured), Non-Performing Assets (NPA) Data
Lending Records	Loan IDs, Borrower IDs, Loan Amount, Interest Rates, Sanction Date, Maturity Date, Collateral Details, Repayment History
Recovery Records	Recovery Proceedings, Settlements, Dates of Default Notices, Amounts Recovered
Defaults & Delinquencies	Default Events, Frequency, Recovery Status, Related Legal Proceedings
Transaction Records	Credit Issuance, Debit Transactions, Adjustments, Write-offs
Compliance Data	Regulatory Submissions, Audit Reports, Compliance Status with IBC & RBI norms


⸻

🔵 2. For Individual/Corporate Borrowers:

Category	Data Fields
Identity Data	Name, Date of Birth/Registration, PAN, Aadhaar/CIN, Contact Details
Credit Profile	Credit Score, Credit Rating, Existing Liabilities
Credit Agreements	Loan Agreements, Terms & Conditions, Sanctioned Limits
Loan Records	Loan IDs, Lender IDs, Loan Amount, Disbursement Date, Interest Rate, Tenure, Installments, Outstanding Amount
Repayment History	Payment Dates, EMI Amount, Payment Status (on-time, late, missed), Pre-payments
Default History	Default Notices, Days Past Due, Amount in Arrears
Collateral Details	Asset Types (Property, Gold, Vehicles), Valuation, Ownership Documentation
Debt Resolution Status	Insolvency Proceedings, Restructuring Records, NCLT Case IDs, Settlements
Legal Compliance & Consent	Data Sharing Consent Status, Digital Consent Records, Smart Contract Signatures


⸻

🔵 3. Metadata for Blockchain Records:
	•	Hash of Records: Cryptographic hash of each data entry for integrity.
	•	Timestamp: When the record was created/modified.
	•	Versioning: Version control for updates.
	•	Signatures: Digital signatures from institutions and borrowers.
	•	Smart Contract IDs: Linking to smart contract governing that data (e.g., repayment tracking).

⸻

🔵 4. Supporting Data for Regulatory Compliance:

Act	Compliance Records Stored
IBC 2016	Default Notices, Creditors’ Claims, Debt Confirmation
Bhartiya Sakshya Adhiniyam 2023	Electronic Evidence Certification, Section 65B compliance
Digital Personal Data Protection Act 2023	User Consents, Data Access Logs, Privacy Policies adherence


⸻

🔵 Optional Extensions:
	•	KYC Documents: Digitally signed copies of KYC.
	•	Tax Records: Tax filings if relevant to financial solvency.
	•	Audit Trails: Every action on data is logged.






Here is a sample JSON schema/data model for storing financial data for institutions and borrowers in a blockchain-based Information Utility system:

⸻

✅ Sample JSON Data Model

{
  "financialInstitution": {
    "institutionId": "FI12345",
    "name": "ABC Bank Ltd",
    "registrationNumber": "REG98765",
    "type": "Bank",
    "contact": {
      "address": "123 Finance Street, Mumbai, India",
      "phone": "+91-9876543210",
      "email": "contact@abcbank.com"
    },
    "balanceSheet": {
      "year": 2024,
      "assets": 500000000,
      "liabilities": 300000000,
      "netWorth": 200000000,
      "capitalAdequacyRatio": "15%"
    },
    "creditPortfolio": [
      {
        "loanId": "LN001",
        "borrowerId": "BORR1001",
        "loanType": "Home Loan",
        "loanAmount": 5000000,
        "interestRate": 7.5,
        "sanctionDate": "2023-05-01",
        "maturityDate": "2043-05-01",
        "collateral": {
          "type": "Property",
          "value": 6000000,
          "details": "3BHK Apartment in Delhi"
        },
        "repaymentHistory": [
          {
            "paymentDate": "2023-06-01",
            "amountPaid": 50000,
            "status": "On-time"
          },
          {
            "paymentDate": "2023-07-01",
            "amountPaid": 50000,
            "status": "Late"
          }
        ],
        "defaultStatus": {
          "isDefault": false,
          "defaultDate": null,
          "recoveryStatus": "N/A"
        }
      }
    ],
    "complianceData": {
      "regulatoryReports": [
        {
          "reportType": "RBI Audit",
          "submittedOn": "2024-03-31",
          "complianceStatus": "Compliant"
        }
      ]
    }
  },
  "borrower": {
    "borrowerId": "BORR1001",
    "name": "John Doe",
    "dateOfBirth": "1985-08-20",
    "PAN": "ABCDE1234F",
    "aadhaar": "123456789012",
    "contact": {
      "address": "456 Residential Lane, Delhi, India",
      "phone": "+91-9123456789",
      "email": "john.doe@example.com"
    },
    "creditProfile": {
      "creditScore": 750,
      "creditRating": "A"
    },
    "loanRecords": [
      {
        "loanId": "LN001",
        "lenderInstitutionId": "FI12345",
        "loanAmount": 5000000,
        "disbursementDate": "2023-05-01",
        "interestRate": 7.5,
        "tenureMonths": 240,
        "installmentsPaid": 12,
        "outstandingAmount": 4900000
      }
    ],
    "collateral": [
      {
        "assetType": "Property",
        "description": "3BHK Apartment in Delhi",
        "valuation": 6000000
      }
    ],
    "defaultHistory": [],
    "legalCompliance": {
      "dataConsent": true,
      "consentTimestamp": "2023-04-25T10:30:00Z",
      "smartContractId": "SC-987654"
    }
  },
  "metadata": {
    "recordHash": "0xabc123...",
    "createdAt": "2025-07-18T12:00:00Z",
    "lastModified": "2025-07-18T12:00:00Z",
    "digitalSignature": "0xsig123...",
    "version": "1.0"
  }
}


⸻

✅ Key Points:
	•	financialInstitution: Stores data about each lender’s balance sheet, credit portfolio, and compliance.
	•	borrower: Contains credit history, loans, repayments, collateral, and legal consents.
	•	metadata: For blockchain anchoring like hashes, timestamps, signatures.




Here is a formal JSON Schema (Draft-07 standard) to validate the financial data model for institutions and borrowers in your blockchain-based IU system:

⸻

✅ Formal JSON Schema

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Financial Information Utility Data Model",
  "type": "object",
  "properties": {
    "financialInstitution": {
      "type": "object",
      "properties": {
        "institutionId": { "type": "string" },
        "name": { "type": "string" },
        "registrationNumber": { "type": "string" },
        "type": { "type": "string" },
        "contact": {
          "type": "object",
          "properties": {
            "address": { "type": "string" },
            "phone": { "type": "string" },
            "email": { "type": "string", "format": "email" }
          },
          "required": ["address", "phone", "email"]
        },
        "balanceSheet": {
          "type": "object",
          "properties": {
            "year": { "type": "integer" },
            "assets": { "type": "number" },
            "liabilities": { "type": "number" },
            "netWorth": { "type": "number" },
            "capitalAdequacyRatio": { "type": "string" }
          },
          "required": ["year", "assets", "liabilities", "netWorth"]
        },
        "creditPortfolio": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "loanId": { "type": "string" },
              "borrowerId": { "type": "string" },
              "loanType": { "type": "string" },
              "loanAmount": { "type": "number" },
              "interestRate": { "type": "number" },
              "sanctionDate": { "type": "string", "format": "date" },
              "maturityDate": { "type": "string", "format": "date" },
              "collateral": {
                "type": "object",
                "properties": {
                  "type": { "type": "string" },
                  "value": { "type": "number" },
                  "details": { "type": "string" }
                },
                "required": ["type", "value"]
              },
              "repaymentHistory": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "paymentDate": { "type": "string", "format": "date" },
                    "amountPaid": { "type": "number" },
                    "status": { "type": "string" }
                  },
                  "required": ["paymentDate", "amountPaid", "status"]
                }
              },
              "defaultStatus": {
                "type": "object",
                "properties": {
                  "isDefault": { "type": "boolean" },
                  "defaultDate": { "type": ["string", "null"], "format": "date" },
                  "recoveryStatus": { "type": "string" }
                },
                "required": ["isDefault", "recoveryStatus"]
              }
            },
            "required": ["loanId", "borrowerId", "loanType", "loanAmount", "interestRate"]
          }
        },
        "complianceData": {
          "type": "object",
          "properties": {
            "regulatoryReports": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "reportType": { "type": "string" },
                  "submittedOn": { "type": "string", "format": "date" },
                  "complianceStatus": { "type": "string" }
                },
                "required": ["reportType", "submittedOn", "complianceStatus"]
              }
            }
          }
        }
      },
      "required": ["institutionId", "name", "registrationNumber", "type", "contact"]
    },
    "borrower": {
      "type": "object",
      "properties": {
        "borrowerId": { "type": "string" },
        "name": { "type": "string" },
        "dateOfBirth": { "type": "string", "format": "date" },
        "PAN": { "type": "string" },
        "aadhaar": { "type": "string" },
        "contact": {
          "type": "object",
          "properties": {
            "address": { "type": "string" },
            "phone": { "type": "string" },
            "email": { "type": "string", "format": "email" }
          },
          "required": ["address", "phone", "email"]
        },
        "creditProfile": {
          "type": "object",
          "properties": {
            "creditScore": { "type": "integer" },
            "creditRating": { "type": "string" }
          },
          "required": ["creditScore"]
        },
        "loanRecords": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "loanId": { "type": "string" },
              "lenderInstitutionId": { "type": "string" },
              "loanAmount": { "type": "number" },
              "disbursementDate": { "type": "string", "format": "date" },
              "interestRate": { "type": "number" },
              "tenureMonths": { "type": "integer" },
              "installmentsPaid": { "type": "integer" },
              "outstandingAmount": { "type": "number" }
            },
            "required": ["loanId", "loanAmount", "interestRate"]
          }
        },
        "collateral": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "assetType": { "type": "string" },
              "description": { "type": "string" },
              "valuation": { "type": "number" }
            },
            "required": ["assetType", "valuation"]
          }
        },
        "defaultHistory": {
          "type": "array",
          "items": { "type": "string" }
        },
        "legalCompliance": {
          "type": "object",
          "properties": {
            "dataConsent": { "type": "boolean" },
            "consentTimestamp": { "type": "string", "format": "date-time" },
            "smartContractId": { "type": "string" }
          },
          "required": ["dataConsent"]
        }
      },
      "required": ["borrowerId", "name", "contact", "creditProfile"]
    },
    "metadata": {
      "type": "object",
      "properties": {
        "recordHash": { "type": "string" },
        "createdAt": { "type": "string", "format": "date-time" },
        "lastModified": { "type": "string", "format": "date-time" },
        "digitalSignature": { "type": "string" },
        "version": { "type": "string" }
      },
      "required": ["recordHash", "createdAt"]
    }
  },
  "required": ["financialInstitution", "borrower", "metadata"]
}





