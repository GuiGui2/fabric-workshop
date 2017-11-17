let path = require('path');
let fs = require('fs-extra');
let hfc = require('fabric-client');
let utils = require('fabric-client/lib/utils.js');
let Peer = require('fabric-client/lib/Peer.js');
let Orderer = require('fabric-client/lib/Orderer.js');
let EventHub = require('fabric-client/lib/EventHub.js');
let console = utils.getLogger('Query Chaincode');
let config = require('./config.json');
let util = require ('util');
let txn_id = null;
let client = new hfc();
let allEventHubs = [];

channel = client.newChannel(config.channelID);
channel.addOrderer(new Orderer(config.orderer.orderer_url));

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
						console.info(config.peers[i].event_url);
						let eh = client.newEventHub();
						eh.setPeerAddr(config.peers[i].event_url);
						eh.connect();
						allEventHubs.push(eh);
					}

					txn_id = client.newTransactionID();
					var request = {
						chaincodeId: config.chaincodeID,
						chainId: config.channelID,
						txId: txn_id,
						fcn: 'invoke',
						args: ['Key3','Guil']
					};
					return channel.sendTransactionProposal(request);
					}).then((results) => {
						var proposalResponses = results[0]; // responses from the endorsing peers
						var proposal = results[1]; // original proposal
						let isProposalGood = false;
						if (proposalResponses && proposalResponses[0].response &&
							proposalResponses[0].response.status === 200) {
							isProposalGood = true;
							console.info('Transaction proposal was good');
						} else {
							console.error('Transaction proposal was bad');
						}
						if (isProposalGood) {
							console.info(util.format(
								'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
								proposalResponses[0].response.status, proposalResponses[0].response.message));
						}
						var request = {
							proposalResponses: proposalResponses,
							proposal: proposal
						};
	
						let deployID = txn_id.getTransactionID();
						let eventPromises = [];
						allEventHubs.forEach((eh) => {
							let txPromise = new Promise((resolve, reject) => {
								let handle = setTimeout(reject, 3000);
								eh.registerTxEvent(deployID.toString(), (tx,code) => {
									console.info("Registered event");
									clearTimeout(handle);
									eh.unregisterTxEvent(deployID);
									eh.disconnect();

									if (code !== 'VALID') {
										console.error('The transaction was invalid, code = ' + code);
										reject();
									} else {
										console.info('The transaction has been committed on peer ' + eh.getPeerAddr());
										resolve();
									}
								}, (err) => {
									clearTimeout(handle);
									reject (new Error('There was an issue with the event hub:: ' + err));
									}
								);
							});
						eventPromises.push(txPromise);
						});
						var sendPromise = channel.sendTransaction(request);
						return Promise.all([sendPromise].concat(eventPromises))
						.then((results) => {
							console.info('event promise all complete and testing complete');
							return results[0];
						}).catch((err) => {
							console.err('Failed to send transaction and get notifications within the timeout period.');
							throw new Error('Failed to send transaction and get notifications within the timeout period.');
						});
					});
				
		});
