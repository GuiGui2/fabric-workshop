package main

import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type SimpleChaincode struct {
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {

	var err error

	fmt.Println("Initializing chaincode SimpleChaincode")
	err = stub.PutState("Hello", []byte("World!"))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte ("Hello World"))
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Invoking chaincode SimpleChaincode")
	function, args := stub.GetFunctionAndParameters()

	switch function {
	case "query" : return t.query(stub,args)
	case "invoke" : return t.invoke(stub,args)
	default : return shim.Error("Invalid invoke function name")
	}

	return shim.Error("Invalid invoke function name")
}

func (t *SimpleChaincode) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	fmt.Println("Invoking query function of chaincode SimpleChaincode")
	var key string

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting name of the person to query")
	}

	key = args[0]

	keyVal,err := stub.GetState(key)
	if err != nil {
		Resp := "{\"Error\":\"Failed to get state for " + key + "\"}"
		return shim.Error(Resp)
	}

	Resp := "{\"Name\":\"" + key + "\",\"Amount\":\"" + string(keyVal) + "\"}"
	fmt.Printf("Query Response:%s\n", Resp)
	return shim.Success(keyVal)
}

func (t *SimpleChaincode) invoke(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	fmt.Println("Invoking invoke function of chaincode SimpleChaincode")

	var user, greeting string
	var err error

	user = args[0]
	greeting = "Hello " + args[1] + "!"
	fmt.Println(user)
	fmt.Println(greeting)
	err = stub.PutState(user, []byte(greeting))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte(greeting))
}

func main() {
	err:= shim.Start(new(SimpleChaincode))
	if err!= nil{
	fmt.Printf("Error starting SimpleChaincode chaincode: %s", err)
	}
}
