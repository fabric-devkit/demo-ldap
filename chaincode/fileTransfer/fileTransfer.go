package main

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SimpleChaincode example simple Chaincode implementation
type FileTransferChaincode struct {
}

type transfer struct {
	ObjectType string `json:"docType"` //docType is used to distinguish the various types of objects in state database
	UUID       string `json:"uuid"`
	Name       string `json:"name"` //the fieldtags are needed to keep case from bouncing around
	FileHash   string `json:"fileHash"`
	Recipient  string `json:"recipient"`
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	err := shim.Start(new(FileTransferChaincode))
	if err != nil {
		fmt.Printf("Error starting FileTransfer chaincode: %s", err)
	}
}

// Init initializes chaincode
// ===========================
func (t *FileTransferChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (t *FileTransferChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + function)

	// Handle different functions
	if function == "initTransfer" { //create a new transfer
		return t.initTransfer(stub, args)
	} else if function == "delete" { //delete a transfer
		return t.delete(stub, args)
	} else if function == "readTransfer" { //read a transfer
		return t.readTransfer(stub, args)
	} else if function == "queryTransfersByOwner" { //find transfers for owner X using rich query
		return t.queryTransfersByOwner(stub, args)
	} else if function == "queryTransfers" { //find transfers based on an ad hoc rich query
		return t.queryTransfers(stub, args)
	} else if function == "getHistoryForTransfer" { //get history of values for a transfer
		return t.getHistoryForTransfer(stub, args)
	}

	fmt.Println("invoke did not find func: " + function) //error
	return shim.Error("Received unknown function invocation")
}

// ============================================================
// initTransfer - create a new transfer, store into chaincode state
// ============================================================
func (t *FileTransferChaincode) initTransfer(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error

	//   0       1           3
	// "alice", "sfdfsdf", "bob"
	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	// ==== Input sanitation ====
	fmt.Println("- start init transfer")
	if len(args[0]) <= 0 {
		return shim.Error("1st argument must be a non-empty string")
	}
	if len(args[1]) <= 0 {
		return shim.Error("2nd argument must be a non-empty string")
	}
	if len(args[2]) <= 0 {
		return shim.Error("3rd argument must be a non-empty string")
	}

	id, err := uuid.NewUUID()
	if err != nil {
		// handle error
		return shim.Error("Failed to generate UUID for product")
	}
	uuid := id.String()
	originatorName := strings.ToLower(args[0])
	fileHash := strings.ToLower(args[1])
	recipientName := strings.ToLower(args[2])

	// ==== Check if transfer already exists ====
	transferAsBytes, err := stub.GetState(uuid)
	if err != nil {
		return shim.Error("Failed to get transfer: " + err.Error())
	} else if transferAsBytes != nil {
		fmt.Println("This transfer already exists: " + uuid)
		return shim.Error("This transfer already exists: " + uuid)
	}

	// ==== Create transfer object and marshal to JSON ====
	objectType := "fileTransfer"
	transfer := &transfer{objectType, uuid, originatorName, fileHash, recipientName}
	transferJSONasBytes, err := json.Marshal(transfer)
	if err != nil {
		return shim.Error(err.Error())
	}
	//Alternatively, build the marble json string manually if you don't want to use struct marshalling
	//marbleJSONasString := `{"docType":"Marble",  "name": "` + marbleName + `", "color": "` + color + `", "size": ` + strconv.Itoa(size) + `, "owner": "` + owner + `"}`
	//marbleJSONasBytes := []byte(str)

	// === Save transfer to state ===
	err = stub.PutState(uuid, transferJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	//  ==== Index the marble to enable originator-based range queries, e.g. return all transfers originated by one person ====
	//  An 'index' is a normal key/value entry in state.
	//  The key is a composite key, with the elements that you want to range query on listed first.
	//  In our case, the composite key is based on indexName~originatorName~fileHash.
	//  This will enable very efficient state range queries based on composite keys matching indexName~color~*
	indexName := "originator~hash"
	originatorHashIndexKey, err := stub.CreateCompositeKey(indexName, []string{transfer.Name, transfer.FileHash})
	if err != nil {
		return shim.Error(err.Error())
	}
	//  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
	//  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
	value := []byte{0x00}
	stub.PutState(originatorHashIndexKey, value)

	// ==== Marble saved and indexed. Return success ====
	fmt.Println("- end init fileTransfer")
	return shim.Success(nil)
}

// ===============================================
// readTransfer - read a transfer from chaincode state
// ===============================================
func (t *FileTransferChaincode) readTransfer(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var uuid, jsonResp string
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting fileHash of the transfer to query")
	}

	uuid = args[0]
	valAsbytes, err := stub.GetState(uuid) //get the transfer from chaincode state
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + uuid + "\"}"
		return shim.Error(jsonResp)
	} else if valAsbytes == nil {
		jsonResp = "{\"Error\":\"Transfer does not exist: " + uuid + "\"}"
		return shim.Error(jsonResp)
	}

	return shim.Success(valAsbytes)
}

// ==================================================
// delete - remove a transfer key/value pair from state
// ==================================================
func (t *FileTransferChaincode) delete(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var jsonResp string
	var transferJSON transfer
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}
	transferUUID := args[0]

	// to maintain the originator~hash index, we need to read the transfer first and get its originator
	valAsbytes, err := stub.GetState(transferUUID) //get the marble from chaincode state
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + transferUUID + "\"}"
		return shim.Error(jsonResp)
	} else if valAsbytes == nil {
		jsonResp = "{\"Error\":\"Transfer does not exist: " + transferUUID + "\"}"
		return shim.Error(jsonResp)
	}

	err = json.Unmarshal([]byte(valAsbytes), &transferJSON)
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to decode JSON of: " + transferUUID + "\"}"
		return shim.Error(jsonResp)
	}

	err = stub.DelState(transferUUID) //remove the transfer from chaincode state
	if err != nil {
		return shim.Error("Failed to delete state:" + err.Error())
	}

	// maintain the index
	indexName := "originator~hash"
	originatorHashIndexKey, err := stub.CreateCompositeKey(indexName, []string{transferJSON.Name, transferJSON.FileHash})
	if err != nil {
		return shim.Error(err.Error())
	}

	//  Delete index entry to state.
	err = stub.DelState(originatorHashIndexKey)
	if err != nil {
		return shim.Error("Failed to delete state:" + err.Error())
	}
	return shim.Success(nil)
}
