// query.js
// sample script using Hyperledger NodeJS SDK to query an already instantiated chaincode
// on a given channel.

// load required modules and define required variables.
let path = require('path');
let fs = require('fs-extra');
let hfc = require('fabric-client');
let utils = require('fabric-client/lib/utils.js');
let Peer = require('fabric-client/lib/Peer.js');
let Orderer = require('fabric-client/lib/Orderer.js');
let EventHub = require('fabric-client/lib/EventHub.js');
let console = utils.getLogger('Query Chaincode');
let config = require('./config.json');
let client = new hfc();
let allEventHubs = [];

// The queryChaincode function takes a JSON object as parameter.
// This JSON object is a ChaincodeQueryRequest.
function queryChaincode(request) {
	channel.queryByChaincode(request)
		.then((query_responses) => {
			console.info('Query completed. Number of responses: ' + query_responses.length);
			if (query_responses && query_responses.length == config.peers.length) {
				if (query_responses[0] instanceof Error) {
					console.info('Error from query = ',query_responses[0]);
				} else {
					for (let i=0; i < config.peers.length; i++) {
						console.info('Response is ', query_responses[i].toString());
					}
				}
			} else {
				console.info('No payloads returned from query');
			}
		});
}

// Initialization of the environment.
// Create a new channel object using the channelID defined in the config.json file.
// Then add all the orderers defined in the config.json orderer array.
channel = client.newChannel(config.channelID);
for (let i = 0; i < config.orderer.length; i++) {
	channel.addOrderer(new Orderer(config.orderer[i].orderer_url));
}

// Retrieve the content of the private key and certificate as defined in the config.json file.
// keyPEM is the private key; certPEM is the public key.
// When the keys will be generated as ECDSA by default, the SDK can retrieve the content 
// by itself just by pointing to the files.
// For the time being however, we need to explicitely read the content of the files.
var keyPEM = fs.readFileSync(config.keyPEM).toString();
var certPEM = fs.readFileSync(config.certPEM).toString();

// Get a new instance of the CryptoSuite object. It is used to configure the crypto
// mechanisms to use in this instance of program.
var cryptoSuite = hfc.newCryptoSuite();
// Initialize this cryptoSuite with a new KeyStore, used to store the cryptographic materials.
// The path to the KeyStore is defined in config.json under keyValueStore.
cryptoSuite.setCryptoKeyStore(hfc.newCryptoKeyStore({path: config.keyValueStore }));

// Initialize our client to use the CryptoSuite configured above.
client.setCryptoSuite(cryptoSuite);
// Also configure the client to use a KeyValueStore, which incidentally is the same.
return hfc.newDefaultKeyValueStore({
	path: config.keyValueStore
// Once the keyValueStore has been created, the promised returned object is a KeyValueStore object.
// This object will be stored and accessed through the store variable.
}).then(
	(store) => {
		// Configure the client to use the KeyValueStore defined above to persist appliction states.
		client.setStateStore(store);
		// Rather than using fabric-ca, in this example we use the crypto materials which has been used by
		// the fabric and which was pre-generated. Pass a UserOpts object with the essential required information
		// for this user to interact with the Fabric.
		// privateKeyPEM and signedCertPEM are IdentityPEMs objects containing a string of the content of the files.
		// Should the keys be ECDSA, we could have used IdentityFiles objects, just by pointing to the files rather than passing the content.
		Promise.resolve(client.createUser({
			username: 'Admin',
			mspid: config.mspid,
			cryptoContent: {
				privateKeyPEM: keyPEM,
				signedCertPEM: certPEM
			}
			// We wait for the User object to be returned (as admin)
			})).then(
				(admin) => {
					console.info('Successfully enrolled user \'admin\'');
					// then we use it to set the current UserContext for the client.
					// It means all subsequent interactions with the Fabric will be done using the identity of this user.
					client.setUserContext(admin);
					// Iterate over the peers array in the config.json file to add each peer to the channel object.
					for (let i = 0; i < config.peers.length; i++) {
						console.info(config.peers[i].peer_url);
						// Add a new peer object to the channel definition
						channel.addPeer(new Peer(config.peers[i].peer_url));
					}
					// Create the ChaincodeQueryRequest object to be passed as an argument of the queryByChaincode function.
					var request = {
						chaincodeId: config.chaincodeID,
						txID: client.newTransactionID(),
						fcn: 'query',
						args: ['Key3']
					};
					// Call the queryChaincode function passing the request object specifically.
					queryChaincode(request);
				});
	});
