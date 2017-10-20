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
	fmt.Println("Invoking chaincode HelloWorld")
	function, args := stub.GetFunctionAndParameters()

	if function == "query" {
		return t.query(stub, args)
	}
	return shim.Success(nil)
}

func (t *HelloWorld) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {

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


func main() {
	err:= shim.Start(new(HelloWorld))
	if err!= nil{
	fmt.Printf("Error starting HelloWorld chaincode: %s", err)
	}
}
