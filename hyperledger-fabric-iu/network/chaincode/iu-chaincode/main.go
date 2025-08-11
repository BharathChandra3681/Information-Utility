package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// IUContract provides functions for managing Information Utility transactions
type IUContract struct {
	contractapi.Contract
}

// Transaction represents a financial transaction in the IU system
type Transaction struct {
	ID                string    `json:"id"`
	CreditorID        string    `json:"creditorId"`
	DebtorID          string    `json:"debtorId"`
	Amount            float64   `json:"amount"`
	Currency          string    `json:"currency"`
	TransactionType   string    `json:"transactionType"` // DEBIT, CREDIT, TRANSFER
	Status            string    `json:"status"`          // PENDING, COMPLETED, FAILED
	Timestamp         time.Time `json:"timestamp"`
	Description       string    `json:"description"`
	Hash              string    `json:"hash"`
	PreviousHash      string    `json:"previousHash"`
	ValidatedBy       string    `json:"validatedBy"`
	ComplianceChecked bool      `json:"complianceChecked"`
}

// Account represents an account in the IU system
type Account struct {
	ID          string    `json:"id"`
	OwnerID     string    `json:"ownerId"`
	Balance     float64   `json:"balance"`
	Currency    string    `json:"currency"`
	AccountType string    `json:"accountType"` // CREDITOR, DEBTOR
	Status      string    `json:"status"`      // ACTIVE, SUSPENDED, CLOSED
	CreatedAt   time.Time `json:"createdAt"`
	LastUpdated time.Time `json:"lastUpdated"`
}

// AuditRecord represents an audit trail entry
type AuditRecord struct {
	ID               string    `json:"id"`
	TransactionID    string    `json:"transactionId"`
	Action           string    `json:"action"`
	Actor            string    `json:"actor"`
	Timestamp        time.Time `json:"timestamp"`
	Details          string    `json:"details"`
	ComplianceStatus string    `json:"complianceStatus"`
}

// Document represents an uploaded document metadata and integrity hash
type Document struct {
	DocID      string    `json:"docId"`
	LoanID     string    `json:"loanId"`
	Hash       string    `json:"hash"`
	Type       string    `json:"type"`
	Mime       string    `json:"mime"`
	Size       int64     `json:"size"`
	OwnerOrg   string    `json:"ownerOrg"`
	UploadedAt time.Time `json:"uploadedAt"`
	Status     string    `json:"status"` // SUBMITTED, VERIFIED, REJECTED
	Metadata   string    `json:"metadata"`
}

// KYCReference stores public reference and hash of private KYC Form-C
type KYCReference struct {
	KYCID     string    `json:"kycId"`
	LoanID    string    `json:"loanId"`
	PartyID   string    `json:"partyId"`
	Hash      string    `json:"hash"`
	Status    string    `json:"status"` // SUBMITTED, APPROVED, REJECTED
	Timestamp time.Time `json:"timestamp"`
	Remarks   string    `json:"remarks"`
}

// InitLedger adds a base set of data to the ledger
func (s *IUContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("🚀 Initializing Information Utility Ledger")

	// Create initial accounts
	accounts := []Account{
		{
			ID:          "ACC001",
			OwnerID:     "CREDITOR001",
			Balance:     1000000.00,
			Currency:    "USD",
			AccountType: "CREDITOR",
			Status:      "ACTIVE",
			CreatedAt:   time.Now(),
			LastUpdated: time.Now(),
		},
		{
			ID:          "ACC002",
			OwnerID:     "DEBTOR001",
			Balance:     500000.00,
			Currency:    "USD",
			AccountType: "DEBTOR",
			Status:      "ACTIVE",
			CreatedAt:   time.Now(),
			LastUpdated: time.Now(),
		},
		{
			ID:          "ACC003",
			OwnerID:     "ADMIN001",
			Balance:     0.00,
			Currency:    "USD",
			AccountType: "ADMIN",
			Status:      "ACTIVE",
			CreatedAt:   time.Now(),
			LastUpdated: time.Now(),
		},
	}

	for _, account := range accounts {
		accountJSON, err := json.Marshal(account)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(account.ID, accountJSON)
		if err != nil {
			return fmt.Errorf("failed to put account to world state: %v", err)
		}
	}

	fmt.Println("✅ Information Utility Ledger initialized successfully")
	return nil
}

// CreateTransaction creates a new financial transaction
func (s *IUContract) CreateTransaction(ctx contractapi.TransactionContextInterface, id string, creditorId string, debtorId string, amount float64, currency string, transactionType string, description string) error {
	exists, err := s.TransactionExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("transaction %s already exists", id)
	}

	// Get previous transaction for hash chaining
	previousHash := ""
	queryString := fmt.Sprintf(`{"selector":{"creditorId":"%s","debtorId":"%s"}}`, creditorId, debtorId)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err == nil {
		defer resultsIterator.Close()
		if resultsIterator.HasNext() {
			queryResult, _ := resultsIterator.Next()
			var lastTx Transaction
			json.Unmarshal(queryResult.Value, &lastTx)
			previousHash = lastTx.Hash
		}
	}

	// Create transaction hash
	hashInput := fmt.Sprintf("%s%s%s%f%s%s", id, creditorId, debtorId, amount, currency, time.Now().String())
	hash := fmt.Sprintf("HASH_%s", hashInput[0:16]) // Simplified hash for demo

	transaction := Transaction{
		ID:                id,
		CreditorID:        creditorId,
		DebtorID:          debtorId,
		Amount:            amount,
		Currency:          currency,
		TransactionType:   transactionType,
		Status:            "PENDING",
		Timestamp:         time.Now(),
		Description:       description,
		Hash:              hash,
		PreviousHash:      previousHash,
		ValidatedBy:       "",
		ComplianceChecked: false,
	}

	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, transactionJSON)
	if err != nil {
		return err
	}

	// Create audit record
	auditID := fmt.Sprintf("AUDIT_%s_%d", id, time.Now().Unix())
	audit := AuditRecord{
		ID:               auditID,
		TransactionID:    id,
		Action:           "CREATE_TRANSACTION",
		Actor:            ctx.GetClientIdentity().GetMSPID(),
		Timestamp:        time.Now(),
		Details:          fmt.Sprintf("Transaction created: %s to %s, Amount: %f %s", creditorId, debtorId, amount, currency),
		ComplianceStatus: "PENDING_REVIEW",
	}

	auditJSON, err := json.Marshal(audit)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(auditID, auditJSON)
	if err != nil {
		return err
	}

	fmt.Printf("✅ Transaction %s created successfully\n", id)
	return nil
}

// ProcessTransaction validates and processes a pending transaction
func (s *IUContract) ProcessTransaction(ctx contractapi.TransactionContextInterface, id string) error {
	transaction, err := s.ReadTransaction(ctx, id)
	if err != nil {
		return err
	}

	if transaction.Status != "PENDING" {
		return fmt.Errorf("transaction %s is not in PENDING status", id)
	}

	// Simulate compliance check
	if !transaction.ComplianceChecked {
		return fmt.Errorf("transaction %s has not passed compliance check", id)
	}

	// Update transaction status
	transaction.Status = "COMPLETED"
	transaction.ValidatedBy = ctx.GetClientIdentity().GetMSPID()

	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, transactionJSON)
	if err != nil {
		return err
	}

	// Create audit record
	auditID := fmt.Sprintf("AUDIT_%s_PROCESSED_%d", id, time.Now().Unix())
	audit := AuditRecord{
		ID:               auditID,
		TransactionID:    id,
		Action:           "PROCESS_TRANSACTION",
		Actor:            ctx.GetClientIdentity().GetMSPID(),
		Timestamp:        time.Now(),
		Details:          fmt.Sprintf("Transaction processed and completed by %s", ctx.GetClientIdentity().GetMSPID()),
		ComplianceStatus: "APPROVED",
	}

	auditJSON, err := json.Marshal(audit)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(auditID, auditJSON)
	if err != nil {
		return err
	}

	fmt.Printf("✅ Transaction %s processed successfully\n", id)
	return nil
}

// PerformComplianceCheck marks a transaction as compliance checked
func (s *IUContract) PerformComplianceCheck(ctx contractapi.TransactionContextInterface, id string, approved bool) error {
	transaction, err := s.ReadTransaction(ctx, id)
	if err != nil {
		return err
	}

	transaction.ComplianceChecked = true
	if !approved {
		transaction.Status = "FAILED"
	}

	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, transactionJSON)
	if err != nil {
		return err
	}

	// Create audit record
	auditID := fmt.Sprintf("AUDIT_%s_COMPLIANCE_%d", id, time.Now().Unix())
	status := "APPROVED"
	if !approved {
		status = "REJECTED"
	}

	audit := AuditRecord{
		ID:               auditID,
		TransactionID:    id,
		Action:           "COMPLIANCE_CHECK",
		Actor:            ctx.GetClientIdentity().GetMSPID(),
		Timestamp:        time.Now(),
		Details:          fmt.Sprintf("Compliance check result: %s", status),
		ComplianceStatus: status,
	}

	auditJSON, err := json.Marshal(audit)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(auditID, auditJSON)
	if err != nil {
		return err
	}

	fmt.Printf("✅ Compliance check completed for transaction %s: %s\n", id, status)
	return nil
}

// ReadTransaction returns the transaction stored in the world state with given id
func (s *IUContract) ReadTransaction(ctx contractapi.TransactionContextInterface, id string) (*Transaction, error) {
	transactionJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if transactionJSON == nil {
		return nil, fmt.Errorf("transaction %s does not exist", id)
	}

	var transaction Transaction
	err = json.Unmarshal(transactionJSON, &transaction)
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

// TransactionExists returns true when transaction with given ID exists in world state
func (s *IUContract) TransactionExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	transactionJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return transactionJSON != nil, nil
}

// GetAllTransactions returns all transactions found in world state
func (s *IUContract) GetAllTransactions(ctx contractapi.TransactionContextInterface) ([]*Transaction, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var transactions []*Transaction
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var transaction Transaction
		err = json.Unmarshal(queryResponse.Value, &transaction)
		if err != nil {
			continue // Skip non-transaction records
		}

		transactions = append(transactions, &transaction)
	}

	return transactions, nil
}

// GetTransactionHistory returns the transaction history for a given transaction ID
func (s *IUContract) GetTransactionHistory(ctx contractapi.TransactionContextInterface, id string) (string, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(id)
	if err != nil {
		return "", err
	}
	defer resultsIterator.Close()

	var history []map[string]interface{}
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return "", err
		}

		var transaction Transaction
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &transaction)
			if err != nil {
				return "", err
			}
		}

		record := map[string]interface{}{
			"txId":      response.TxId,
			"timestamp": response.Timestamp,
			"isDelete":  response.IsDelete,
			"value":     transaction,
		}
		history = append(history, record)
	}

	historyJSON, err := json.Marshal(history)
	if err != nil {
		return "", err
	}

	return string(historyJSON), nil
}

func getMSPID(ctx contractapi.TransactionContextInterface) (string, error) {
	id := ctx.GetClientIdentity()
	mspid, err := id.GetMSPID()
	if err != nil {
		return "", fmt.Errorf("failed to get MSPID: %v", err)
	}
	return mspid, nil
}

// SubmitLoanDocument records document metadata and integrity hash on-ledger
func (s *IUContract) SubmitLoanDocument(ctx contractapi.TransactionContextInterface, loanID, docID, hash, docType, mime, sizeStr, metadata string) error {
	if loanID == "" || docID == "" || hash == "" {
		return fmt.Errorf("loanID, docID and hash are required")
	}

	// parse size
	sz := int64(0)
	if sizeStr != "" {
		val, err := strconv.ParseInt(sizeStr, 10, 64)
		if err != nil {
			return fmt.Errorf("invalid size: %v", err)
		}
		sz = val
	}

	mspid, err := getMSPID(ctx)
	if err != nil {
		return err
	}

	docKey := fmt.Sprintf("DOC_%s", docID)
	exists, err := s.TransactionExists(ctx, docKey)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("document %s already exists", docID)
	}

	doc := Document{
		DocID:      docID,
		LoanID:     loanID,
		Hash:       hash,
		Type:       docType,
		Mime:       mime,
		Size:       sz,
		OwnerOrg:   mspid,
		UploadedAt: time.Now(),
		Status:     "SUBMITTED",
		Metadata:   metadata,
	}
	b, _ := json.Marshal(doc)
	if err := ctx.GetStub().PutState(docKey, b); err != nil {
		return err
	}
	// emit event
	_ = ctx.GetStub().SetEvent("DOC_SUBMITTED", b)
	return nil
}

// GetDocument returns document metadata by docID
func (s *IUContract) GetDocument(ctx contractapi.TransactionContextInterface, docID string) (*Document, error) {
	key := fmt.Sprintf("DOC_%s", docID)
	val, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, err
	}
	if val == nil {
		return nil, fmt.Errorf("document %s not found", docID)
	}
	var d Document
	if err := json.Unmarshal(val, &d); err != nil {
		return nil, err
	}
	return &d, nil
}

// GetLoanDocuments lists documents for a loan
func (s *IUContract) GetLoanDocuments(ctx contractapi.TransactionContextInterface, loanID string) (string, error) {
	query := fmt.Sprintf(`{"selector":{"loanId":"%s"}}`, loanID)
	it, err := ctx.GetStub().GetQueryResult(query)
	if err != nil {
		return "", err
	}
	defer it.Close()
	var out []Document
	for it.HasNext() {
		qr, err := it.Next()
		if err != nil {
			return "", err
		}
		var d Document
		if err := json.Unmarshal(qr.Value, &d); err == nil && d.DocID != "" {
			out = append(out, d)
		}
	}
	b, _ := json.Marshal(out)
	return string(b), nil
}

// SubmitKYCFormC stores private Form-C in admin-only collection and public hash reference
func (s *IUContract) SubmitKYCFormC(ctx contractapi.TransactionContextInterface, loanID, kycID, partyID string) error {
	mspid, err := getMSPID(ctx)
	if err != nil {
		return err
	}
	if mspid != "AdminMSP" {
		return fmt.Errorf("only AdminMSP can submit KYC Form-C")
	}
	if loanID == "" || kycID == "" || partyID == "" {
		return fmt.Errorf("loanID, kycID, partyID are required")
	}
	transient, err := ctx.GetStub().GetTransient()
	if err != nil {
		return fmt.Errorf("failed to get transient: %v", err)
	}
	formBytes, ok := transient["formc"]
	if !ok || len(formBytes) == 0 {
		return fmt.Errorf("transient field 'formc' is required")
	}
	// store private data
	const collection = "formc_admin_only"
	if err := ctx.GetStub().PutPrivateData(collection, kycID, formBytes); err != nil {
		return fmt.Errorf("put private data failed: %v", err)
	}
	// compute hash of full form for public reference
	h := sha256.Sum256(formBytes)
	hashHex := fmt.Sprintf("%x", h[:])
	ref := KYCReference{
		KYCID:     kycID,
		LoanID:    loanID,
		PartyID:   partyID,
		Hash:      hashHex,
		Status:    "SUBMITTED",
		Timestamp: time.Now(),
		Remarks:   "",
	}
	b, _ := json.Marshal(ref)
	if err := ctx.GetStub().PutState(fmt.Sprintf("KYC_%s", kycID), b); err != nil {
		return err
	}
	_ = ctx.GetStub().SetEvent("KYC_SUBMITTED", b)
	return nil
}

// ApproveKYC allows AdminMSP to approve/reject KYC
func (s *IUContract) ApproveKYC(ctx contractapi.TransactionContextInterface, kycID string, approved bool, remarks string) error {
	mspid, err := getMSPID(ctx)
	if err != nil {
		return err
	}
	if mspid != "AdminMSP" {
		return fmt.Errorf("only AdminMSP can approve KYC")
	}
	key := fmt.Sprintf("KYC_%s", kycID)
	val, err := ctx.GetStub().GetState(key)
	if err != nil {
		return err
	}
	if val == nil {
		return fmt.Errorf("kyc %s not found", kycID)
	}
	var ref KYCReference
	if err := json.Unmarshal(val, &ref); err != nil {
		return err
	}
	if approved {
		ref.Status = "APPROVED"
	} else {
		ref.Status = "REJECTED"
	}
	ref.Timestamp = time.Now()
	ref.Remarks = remarks
	b, _ := json.Marshal(ref)
	if err := ctx.GetStub().PutState(key, b); err != nil {
		return err
	}
	_ = ctx.GetStub().SetEvent("KYC_APPROVED", b)
	return nil
}

// RecordAuditEvent writes minimal audit event on channel (for mirroring)
func (s *IUContract) RecordAuditEvent(ctx contractapi.TransactionContextInterface, eventType, refId, hash, details string) error {
	if eventType == "" || refId == "" {
		return fmt.Errorf("eventType and refId are required")
	}
	rec := map[string]string{
		"eventType": eventType,
		"refId":     refId,
		"hash":      hash,
		"details":   details,
		"timestamp": time.Now().Format(time.RFC3339Nano),
	}
	b, _ := json.Marshal(rec)
	key := fmt.Sprintf("AUDIT_EVT_%s_%d", refId, time.Now().UnixNano())
	return ctx.GetStub().PutState(key, b)
}

func main() {
	iuChaincode, err := contractapi.NewChaincode(&IUContract{})
	if err != nil {
		fmt.Printf("Error creating Information Utility chaincode: %v", err)
		return
	}

	if err := iuChaincode.Start(); err != nil {
		fmt.Printf("Error starting Information Utility chaincode: %v", err)
	}
}
