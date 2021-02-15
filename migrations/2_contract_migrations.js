const votingPower = artifacts.require('VotingPower');
const _totalSupply = '100'
module.exports = async function (deployer){
    await deployer.deploy(votingPower, _totalSupply);    
};