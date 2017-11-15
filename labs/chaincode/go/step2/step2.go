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
	return shim.Success(nil)
}

func main() {
	err:= shim.Start(new(SimpleChaincode))
	if err!= nil{
	fmt.Printf("Error starting SimpleChaincode chaincode: %s", err)
	}
}
