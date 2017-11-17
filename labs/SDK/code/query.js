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

channel = client.newChannel(config.channelID);
for (let i = 0; i < config.orderer.length; i++) {
	channel.addOrderer(new Orderer(config.orderer.orderer_url));
}

var keyPEM = fs.readFileSync(config.keyPEM).toString();
var certPEM = fs.readFileSync(config.certPEM).toString();
var cryptoSuite = hfc.newCryptoSuite();
cryptoSuite.setCryptoKeyStore(hfc.newCryptoKeyStore({path: config.keyValueStore }));

client.setCryptoSuite(cryptoSuite);
return hfc.newDefaultKeyValueStore({
	path: config.keyValueStore
}).then(
	(store) => {
		client.setStateStore(store);
		Promise.resolve(client.createUser({
			username: 'Admin',
			mspid: config.mspid,
			cryptoContent: {
				privateKeyPEM: keyPEM,
				signedCertPEM: certPEM
			}
			})).then(
				(admin) => {
					console.info('Successfully enrolled user \'admin\'');
					client.setUserContext(admin);
					for (let i = 0; i < config.peers.length; i++) {
						console.info(config.peers[i].peer_url);
						channel.addPeer(new Peer(config.peers[i].peer_url));
					}
					var request = {
						chaincodeId: config.chaincodeID,
						txID: client.newTransactionID(),
						fcn: 'query',
						args: ['Hello']
					};
					queryChaincode(request);
				});
	});
