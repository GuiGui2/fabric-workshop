package main

import (
	"fmt"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type HelloWorld struct {
}

func (t *HelloWorld) Init(stub shim.ChaincodeStubInterface) pb.Response {

	var err error

	fmt.Println("Initializing chaincode HelloWorld")
	err = stub.PutState("Hello", []byte("World!"))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte ("Hello World"))
}

func (t *HelloWorld) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

func main() {
	err:= shim.Start(new(HelloWorld))
	if err!= nil{
	fmt.Printf("Error starting HelloWorld chaincode: %s", err)
	}
}
