pragma solidity >=0.7.0 <0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 


contract VotingPower is ERC20{
    
    constructor(uint256 initialSupply)  ERC20("Mock XRP", "mXRP") {
        _mint(msg.sender, initialSupply);
    }

    struct checkPoint {
        uint blockId;
        uint tokenBalance;
        uint votesReceived;
        uint votesDelegated;
        uint percentDelegated;
        address owner;        
    }

    mapping (address => checkPoint[]) private votingPower;
    mapping (address => mapping (address => uint256)) private delegations;
    mapping (address => mapping (address => uint256)) private delegatedPerCent;
    mapping (address => address[]) private delegatedAddresses;
    
    //@dev: helper `updateTokenBalance` inserts a new checkpoint into votingPower 
    // whenever a ERC20 transfer() is called
    function updateTokenBalance (checkPoint[] storage receiverCheckPoints, uint _amount) internal {
        checkPoint memory newRecord; 
        if (receiverCheckPoints.length == 0){
            //this is the first history block for this member. Must be initialized
            newRecord.tokenBalance = _amount;
            newRecord.votesReceived = 0;
            newRecord.votesDelegated = 0; 
            newRecord.percentDelegated = 0;
        }
        else{
            
            //this member has at least 1 existing record. Only need to update tokenBalance and blockId            
            newRecord = receiverCheckPoints[receiverCheckPoints.length-1];
            newRecord.tokenBalance += _amount;            
        }
        newRecord.blockId = block.number;        
        receiverCheckPoints.push(newRecord);
    }   
    
    //@dev: helper `updateDelegations` is called everytime someone's tokenBalance is updated 
    // and delegated votingPower needs to be updated accordingly
    function updateDelegations (address owner, uint amount) internal{
        uint last = votingPower[owner].length-1;
        checkPoint memory ownerCheckPoint = votingPower[owner][last] ; 
        ownerCheckPoint.tokenBalance += amount;
        ownerCheckPoint.votesDelegated = 0;
        for (uint i=0; i < delegatedAddresses[owner].length; i++) {                        
            address receiver = delegatedAddresses[owner][i];
            uint percentDelegated = delegatedPerCent[owner][receiver];
            uint delegatedVotes = (ownerCheckPoint.tokenBalance * percentDelegated) / 100 ; 
            delegations[owner][receiver] = delegatedVotes;
            uint idx = votingPower[receiver].length-1;
            checkPoint memory newRecord = votingPower[receiver][idx];
            newRecord.votesReceived = delegatedVotes;
            newRecord.blockId = block.number ; 
            votingPower[receiver].push(newRecord);
            ownerCheckPoint.votesDelegated += delegatedVotes;
        }
        ownerCheckPoint.blockId = block.number ;
        votingPower[owner].push(ownerCheckPoint);        
    }
    
    //@dev: helper `updateBalanceAndDelegation` inserts a new checkpoint into votingPower 
    // whenever a ERC20 transfer() is called

    function updateBalanceAndDelegation (checkPoint[] storage ownerCheckPoints, address owner, uint _amount) internal {
    checkPoint memory newRecord; 

    if (ownerCheckPoints.length == 0){
        //this is the first history block for this member. Must be initialized
        newRecord.tokenBalance = _amount;
        newRecord.votesReceived = 0;
        newRecord.votesDelegated = 0; 
        newRecord.percentDelegated = 0;
        newRecord.owner = owner;
        newRecord.blockId = block.number;        
        ownerCheckPoints.push(newRecord);

    }
    else{
        if (delegatedAddresses[owner].length > 0){
            updateDelegations(owner, _amount);
           }
        else {
            newRecord = ownerCheckPoints[ownerCheckPoints.length-1];
            newRecord.tokenBalance += _amount;  
            newRecord.blockId = block.number;        
            ownerCheckPoints.push(newRecord);
            }    
        }
    }

    
    //@dev: ERC20 transfer override.
    function transfer (address owner, uint _amount) public override returns (bool result) {        
        result = super.transfer(owner, _amount);
        if (result) {
            updateBalanceAndDelegation(votingPower[owner], owner, _amount);            
        }
        return result;
    }
        
    //@dev: helper `getDelegatedVotes` converts provided percentage of delegation 
    // into equivalent number of votes to delegate
    function getDelegatedVotes (checkPoint[] storage checkPoints, uint _percentage) view internal returns (uint) {
        uint currIdx = checkPoints.length-1;
        uint unlockedTokens = checkPoints[currIdx].tokenBalance - checkPoints[currIdx].votesDelegated;
        if (unlockedTokens == 0) return 0;
        uint votesToDelegate = (checkPoints[currIdx].tokenBalance * _percentage)/ 100;        
        require (unlockedTokens >= votesToDelegate, "Not enough tokens available");
        return (votesToDelegate);
    }    

    //@dev: helper `SetDelegation` updates votingPower by adding a new checkpoint with the latest delegation
    function setDelegation (checkPoint[] storage emitterCheckPoints, checkPoint[] storage receiverCheckPoints, address receiver, uint _votesDelegated, uint percentage) internal {
        //udpate votingPower for RECEIVER of delegation        
        checkPoint memory receiverNewRecord;        
        if (receiverCheckPoints.length == 0){
            receiverNewRecord.tokenBalance = 0;
            receiverNewRecord.votesDelegated = 0;
            receiverNewRecord.owner = receiver;
        }
        else {            
            receiverNewRecord = receiverCheckPoints[receiverCheckPoints.length-1];
        }
        receiverNewRecord.votesReceived = _votesDelegated;
        receiverNewRecord.blockId = block.number;
        receiverCheckPoints.push(receiverNewRecord);        

        //udpate votingPower for EMITTER of delegation        
        checkPoint memory emitterNewRecord = emitterCheckPoints[emitterCheckPoints.length-1];
        address owner = emitterNewRecord.owner;
        emitterNewRecord.votesDelegated +=  _votesDelegated;
        emitterNewRecord.percentDelegated +=  percentage;
        delegatedAddresses[owner].push(receiver);
        emitterNewRecord.blockId = block.number;   
        emitterCheckPoints.push(emitterNewRecord);

    }

    //@dev: helper function `removeDelegatedAddress` deletes address from array of delegated addresses
    function removeDelegatedAddress(address emitter, address receiver)  private  {
        uint length = delegatedAddresses[emitter].length;
        for (uint i=0; i < delegatedAddresses[emitter].length ; i++){
            if (receiver == delegatedAddresses[emitter][i]){
                delegatedAddresses[emitter][i] = delegatedAddresses[emitter][length-1];
                break;
            }
        }
        delegatedAddresses[emitter].pop();
        
    }
    
    //@dev: helper function `removeDelegation` updates votingPower by adding a new checkpoint with the removed delegation
    function removeDelegation (checkPoint[] storage emitterCheckPoints, checkPoint[] storage receiverCheckPoints, uint _votesRemoved) internal {
        uint currIdx;
        //udpate votingPower for RECEIVER of delegation
        currIdx = receiverCheckPoints.length-1;
        checkPoint memory receiverNewRecord = receiverCheckPoints[currIdx];
        address receiver = receiverNewRecord.owner;
        receiverNewRecord.votesReceived -= _votesRemoved;        
        receiverNewRecord.blockId = block.number;
        receiverCheckPoints.push(receiverNewRecord);
        
        //udpate votingPower for EMITTER of delegation        
        currIdx = emitterCheckPoints.length-1;
        checkPoint memory emitterNewRecord = emitterCheckPoints[currIdx];
        address emitter = emitterNewRecord.owner;
        emitterNewRecord.votesDelegated -= _votesRemoved;
        emitterNewRecord.percentDelegated -= delegatedPerCent[emitter][receiver] ;     
        removeDelegatedAddress(emitter, receiver);   
        emitterNewRecord.blockId = block.number;
        emitterCheckPoints.push(emitterNewRecord);        
        
    }

    //@dev: `delegate` enable each token holder to delegate a percentage (or all) of his vote 
    // power (balance) to other addresses    
    function delegate (address receiver, uint percentage) public {        
        if (percentage == 0){
            uint votesRemoved = delegations[msg.sender][receiver] ;
            removeDelegation(votingPower[msg.sender], votingPower[receiver], votesRemoved);
            delegations[msg.sender][receiver] = 0;
            delegatedPerCent[msg.sender][receiver] = 0;
        }
        else {
            uint delegatedVotes = getDelegatedVotes(votingPower[msg.sender], percentage);
            if (delegatedVotes > 0){
                uint currIdx = votingPower[msg.sender].length-1;
                require((votingPower[msg.sender][currIdx].percentDelegated + percentage) <= 100, 'Cannot delegate more than 100%');
                require(delegatedAddresses[msg.sender].legth <=5, 'Cannot delegate to more than 5 persons');
                delegations[msg.sender][receiver] = delegatedVotes;
                delegatedPerCent[msg.sender][receiver] = percentage;
                setDelegation(votingPower[msg.sender], votingPower[receiver], receiver, delegatedVotes, percentage);
            }
        }            
    }

    //@dev: help function `getCheckPoint` searches and returns the corresponding checkPoint 
    // that matches the required block
    function getCheckPoint (checkPoint[] storage checkpoints, uint _block) view internal returns (checkPoint memory){      
        if (_block >= checkpoints[checkpoints.length-1].blockId)
            // The block to search is newer than the latest block for this member. Let´s return the lastest checkpoint available
            return checkpoints[checkpoints.length-1];
        if (_block < checkpoints[0].blockId){
            checkPoint memory c;
            // The block to search is older than this member oldest block. Return an empty checkpoint.
            return (c);
        } 

        // Binary search of the value in the array
        uint min = 0;
        uint max = checkpoints.length-1;
        while (max > min) {
            uint mid = (max + min + 1)/ 2;
            if (checkpoints[mid].blockId<=_block) {
                min = mid;
            } else {
                max = mid-1;
            }
        }
        // Returns the checkpoint that holds the requested block.
        return checkpoints[min];
    }

    //@dev: `balanceOfAt` returns the balance of an address for a specific block in the past
    function balanceOfAt (address _member, uint _block) public view returns (uint) {
        uint length = votingPower[_member].length;
        if (length == 0) return 0;
        else{
            checkPoint memory checkpoint = getCheckPoint(votingPower[_member], _block);            
            return checkpoint.tokenBalance;            
        }

    }

    //@dev: `votePowerOfAt` returns the vote power of a specific address in a specific block
    function votePowerOfAt (address _member, uint _block) public view returns (uint) {
        uint length = votingPower[_member].length;
        if (length == 0) return 0;
        else{
            checkPoint memory checkpoint = getCheckPoint(votingPower[_member], _block);
            uint _votingPower = checkpoint.tokenBalance + checkpoint.votesReceived - checkpoint.votesDelegated;
            return _votingPower ;            
        }
    }

    //@dev Below functions are only for testing ///////////////////
    
    //@dev: `getCurrentBlock()` used for testing in Mocha
    function getCurrentBlock() public view returns (uint){
        return block.number;
    }
    
    //@dev: `memberBlockNow` used for testing in Mocha
    function memberBlockNow(address member) public view returns (uint){
        if (votingPower[member].length == 0){
            return uint(0);
        }
        else {
            uint currIdx = votingPower[member].length-1;
            return votingPower[member][currIdx].blockId;
        }
    }
    
    //@dev: `votePowerNow` used for testing in Mocha
    function votePowerNow (address _member) public view returns (uint){
        if (votingPower[_member].length == 0){
            return 0;
        }
        else {
            uint currIdx = votingPower[_member].length-1;
            uint tokens = votingPower[_member][currIdx].tokenBalance;
            uint votesReceived = votingPower[_member][currIdx].votesReceived;
            uint votesDelegated = votingPower[_member][currIdx].votesDelegated;
            return (tokens + votesReceived - votesDelegated);
        }
    }
 
    //@dev: `receivedVotesNow` used for testing in Mocha
    function receivedVotesNow (address _member) public view returns (uint){
        if (votingPower[_member].length == 0){
            return 0;
        }
        else {
            uint currIdx = votingPower[_member].length-1;
            uint votesReceived = votingPower[_member][currIdx].votesReceived;
            return (votesReceived);
        }
        
    }

    //@dev: `delegatedVotesNow` used for testing in Mocha
    function delegatedVotesNow (address _member) public view returns (uint){
        if (votingPower[_member].length == 0){
            return 0;
        }
        else {
            uint currIdx = votingPower[_member].length-1;
            uint votesDelegated = votingPower[_member][currIdx].votesDelegated;
            return (votesDelegated);
        }
    }
    /*
    function receivedVotesNow (address _member) view public returns (uint){
        if (votingPower[_member].length == 0){
            return 0;
        }
        else {
            uint currIdx = votingPower[_member].length-1;
            uint votesReceived = votingPower[_member][currIdx].votesReceived;
            return (votesReceived);
        }
    }
    */

    function votesRemovedNow (address owner, address receiver) view public returns (uint){
        return delegations[owner][receiver] ;
    }     

    function getDelegatedAddressesLengthNOW(address owner) view public returns (uint){
        uint idx = votingPower[owner].length-1;
        return (delegatedAddresses[owner].length);
    }

    function getDelegatedPercentageNOW(address owner) view public returns (uint){
        uint idx = votingPower[owner].length-1;
        return (votingPower[owner][idx].percentDelegated);
    }
    
    function getDelegatedAddressNOW (address owner, uint idx) public returns (address) {
        uint last = votingPower[owner].length-1;
        checkPoint memory ownerCheckPoint = votingPower[owner][last] ; 
        return (delegatedAddresses[owner][idx]);
    }  
}