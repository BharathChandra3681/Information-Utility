package main

import (
	"encoding/json"
	"fmt"
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
