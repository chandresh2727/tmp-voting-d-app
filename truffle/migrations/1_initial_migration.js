  var Voting = artifacts.require("./Voting.sol");

  module.exports = function(deployer) {
    console.log("starting")
    deployer.deploy(Voting);
    console.log("ending")
  };