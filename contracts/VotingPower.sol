pragma solidity >=0.7.0 <0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract VotingPower is ERC20{
    
    constructor(uint256 initialSupply)  ERC20("Mock XRP", "mXRP") {
        _mint(msg.sender, initialSupply);
    }

    struct checkPoint {
        uint blockId;
        uint votesReceived;
        uint votesDelegated;
        uint tokenBalance;
    }

    mapping (address => checkPoint[]) private votingPower;
    mapping (address => mapping (address => uint256)) private delegations;
    
    //@dev: helper `updateTokenBalance` inserts a new checkpoint into votingPower 
    // whenever a ERC20 transfer() is called
    function updateTokenBalance (checkPoint[] storage receiverCheckPoints, uint _amount) internal {
        checkPoint memory newRecord; 
        if (receiverCheckPoints.length == 0){
            //this is the first history block for this member. Must be initialized
            newRecord.tokenBalance = _amount;
            newRecord.votesReceived = 0;
            newRecord.votesDelegated = 0; 
        }
        else{
            
            //this member has at least 1 existing record. Only need to update tokenBalance and blockId            
            newRecord = receiverCheckPoints[receiverCheckPoints.length-1];
            newRecord.tokenBalance += _amount;            
        }
        newRecord.blockId = block.number;        
        receiverCheckPoints.push(newRecord);
    }   

    
    //@dev: ERC20 transfer override.
    function transfer (address receiver, uint _amount) public override returns (bool result) {        
        result = super.transfer(receiver, _amount);
        if (result) {
            updateTokenBalance(votingPower[receiver], _amount);
        }
        return result;
    }
        
    //@dev: helper `getDelegatedVotes` converts provided percentage of delegation 
    // into equivalent number of votes to delegate
    function getDelegatedVotes (checkPoint[] storage checkPoints, uint _percentage) view internal returns (uint) {
        uint currIdx = checkPoints.length-1;
        uint unlockedTokens = checkPoints[currIdx].tokenBalance - checkPoints[currIdx].votesDelegated;
        uint votesToDelegate = (checkPoints[currIdx].tokenBalance * _percentage)/ 100;        
        require (unlockedTokens >= votesToDelegate, "Not enough tokens available");
        if (unlockedTokens == 0) return 0;
        else return (votesToDelegate);
    }    

    //@dev: helper `updateDelegation` updates votingPower by adding a new checkpoint with the latest delegation
    function updateDelegation (checkPoint[] storage emitterCheckPoints, checkPoint[] storage receiverCheckPoints, uint _votesDelegated) internal {
        //udpate votingPower for RECEIVER of delegation        
        checkPoint memory receiverNewRecord;        
        if (receiverCheckPoints.length == 0){
            receiverNewRecord.tokenBalance = 0;
            receiverNewRecord.votesDelegated = 0;
        }
        else {            
            receiverNewRecord = receiverCheckPoints[receiverCheckPoints.length-1];
        }
        receiverNewRecord.votesReceived += _votesDelegated;
        receiverNewRecord.blockId = block.number;
        receiverCheckPoints.push(receiverNewRecord);
        
        //udpate votingPower for EMITTER of delegation        
        checkPoint memory emitterNewRecord = emitterCheckPoints[emitterCheckPoints.length-1];
        emitterNewRecord.votesDelegated +=  _votesDelegated;
        emitterNewRecord.blockId = block.number;
        emitterCheckPoints.push(emitterNewRecord);
    }
    
    //@dev: helper function `removeDelegation` updates votingPower by adding a new checkpoint with the removed delegation
    function removeDelegation (checkPoint[] storage emitterCheckPoints, checkPoint[] storage receiverCheckPoints, uint _votesRemoved) internal {
        uint currIdx;
        //udpate votingPower for RECEIVER of delegation
        currIdx = receiverCheckPoints.length-1;
        checkPoint memory receiverNewRecord = receiverCheckPoints[currIdx];
        receiverNewRecord.votesReceived -= _votesRemoved;
        receiverNewRecord.blockId = block.number;
        receiverCheckPoints.push(receiverNewRecord);
        
        //udpate votingPower for EMITTER of delegation
        currIdx = emitterCheckPoints.length-1;
        checkPoint memory emitterNewRecord = emitterCheckPoints[currIdx];
        emitterNewRecord.votesDelegated -= _votesRemoved;
        emitterNewRecord.blockId = block.number;
        emitterCheckPoints.push(emitterNewRecord);        
        
    }

    //@dev: `delegate` enable each token holder to delegate a percentage (or all) of his vote power (balance)
    // to other addresses
    function delegate (address receiver, uint percentage) public {
        if (percentage == 0){
            uint votesRemoved = delegations[msg.sender][receiver] ;
            removeDelegation(votingPower[msg.sender], votingPower[receiver], votesRemoved);
            delegations[msg.sender][receiver] = 0;
        }
        else {
            uint delegatedVotes = getDelegatedVotes(votingPower[msg.sender], percentage);
            delegations[msg.sender][receiver] += delegatedVotes;
            updateDelegation(votingPower[msg.sender], votingPower[receiver], delegatedVotes);
        }            
    }

    //@dev: help function `getCheckPoint` searches and returns the corresponding checkPoint 
    // that matches the required block
    function getCheckPoint (checkPoint[] storage checkpoints, uint _block) view internal returns (checkPoint memory){
      
        if (_block >= checkpoints[checkpoints.length-1].blockId)
            // The block to search is newer than the latest block for this member. Let´s return the last checkpoint available
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

    //@dev: `balanceOfAt`
    function balanceOfAt (address _member, uint _block) public view returns (uint) {
        uint length = votingPower[_member].length;
        if (length == 0) return 69;
        else{
            checkPoint memory checkpoint = getCheckPoint(votingPower[_member], _block);            
            return checkpoint.tokenBalance;            
        }

    }

    //@dev: `votePowerOfAt`
    function votePowerOfAt (address _member, uint _block) public view returns (uint) {
        uint length = votingPower[_member].length;
        if (length == 0) return 69;
        else{
            checkPoint memory checkpoint = getCheckPoint(votingPower[_member], _block);
            uint _votingPower = checkpoint.tokenBalance + checkpoint.votesReceived - checkpoint.votesDelegated;
            return _votingPower ;            
        }
    }

     //@dev: testing
    function calculateDelegatedVotes (uint balance, uint delegated , uint _percentage) pure public returns (uint) {        
        uint unlockedTokens = balance - delegated;
        if (unlockedTokens == 0) return 0;
        else return ((balance * _percentage)/100);
    }

    //@dev: testing 
    function checkPointLegthNow(address member) public view returns (uint){
        return votingPower[member].length;
    }
    
    //@dev: testing 
    function getCurrentBlock() public view returns (uint){
        return block.number;
    }
    
    //@dev: testing 
    function memberBlockNow(address member) public view returns (uint){
        if (votingPower[member].length == 0){
            return uint(0);
        }
        else {
            uint currIdx = votingPower[member].length-1;
            return votingPower[member][currIdx].blockId;
        }
    }
    
    //@dev: testing 
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
 
     //@dev: testing 
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
    
    //@dev: testing 
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
}