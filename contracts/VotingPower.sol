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

    mapping (address => checkPoint[]) private votingPower; //stores history of balances and vote power
    mapping (address => mapping (address => uint256)) private delegatedVotePower; //holds delegated votePower per receiver address
    mapping (address => mapping (address => uint256)) private delegatedPerCent; //holds delegated percentage per receiver address
    mapping (address => address[]) private delegatedAddresses; //receivers of delegation per address (max 5)
    
    //@dev: helper `updateDelegations` is called everytime someone's receives new tokens 
    // and votingPower needs to be updated accordingly
    function updateDelegations (address owner, uint amount) internal{
        uint latest = votingPower[owner].length-1;
        checkPoint memory ownerCheckPoint = votingPower[owner][latest] ; 
        ownerCheckPoint.tokenBalance += amount;
        ownerCheckPoint.votesDelegated = 0;
        
        //navigates array of existing delegation and update voting power for each
        for (uint i=0; i < delegatedAddresses[owner].length; i++) {                        
            address receiver = delegatedAddresses[owner][i];
            uint receiverPercent = delegatedPerCent[owner][receiver];
            uint receiverVotes = (ownerCheckPoint.tokenBalance * receiverPercent) / 100 ; 
            delegatedVotePower[owner][receiver] = receiverVotes;
            
            uint idx = votingPower[receiver].length-1;
            checkPoint memory newRecord = votingPower[receiver][idx];
            newRecord.votesReceived = receiverVotes;
            newRecord.blockId = block.number ; 
            votingPower[receiver].push(newRecord);
            
            ownerCheckPoint.votesDelegated += receiverVotes;
        }
        ownerCheckPoint.blockId = block.number ;
        votingPower[owner].push(ownerCheckPoint);        
    }
    
    //@dev: helper `updateBalanceAndDelegation` inserts a new checkpoint into votingPower 
    // whenever a ERC20 transfer() is called
    function updateBalanceAndDelegation (checkPoint[] storage ownerCheckPoints, address owner, uint amount) internal {
    checkPoint memory newRecord; 

    if (ownerCheckPoints.length == 0){
        //This person has never received tokens. Let's initialize his/her voting power history
        newRecord.tokenBalance = amount;
        newRecord.votesReceived = 0;
        newRecord.votesDelegated = 0; 
        newRecord.percentDelegated = 0;
        newRecord.owner = owner;
        newRecord.blockId = block.number;        
        ownerCheckPoints.push(newRecord);
    }
    else{
        if (delegatedAddresses[owner].length > 0){
            //This person has existing delegations. Let's update them according to new token balance 
            updateDelegations(owner, amount);
           }
        else {
            newRecord = ownerCheckPoints[ownerCheckPoints.length-1];
            newRecord.tokenBalance += amount;  
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
    function getDelegatedVotes (checkPoint[] storage checkPoints, uint percentage) view internal returns (uint) {
        uint currIdx = checkPoints.length-1;
        uint votesToDelegate = (checkPoints[currIdx].tokenBalance * percentage)/ 100;        
        return (votesToDelegate);
    }    

    //@dev: helper `SetDelegation` updates votingPower by adding a new checkpoint with the latest delegation
    function setDelegation (checkPoint[] storage emitterCheckPoints, checkPoint[] storage receiverCheckPoints, address receiver, uint votesDelegated, uint percentage) internal {
        //udpate votingPower for RECEIVER of delegation        
        checkPoint memory receiverNewRecord;        
        if (receiverCheckPoints.length == 0){
            //This person has never received tokens nor delegation. Let's initialize his/her voting power history
            receiverNewRecord.tokenBalance = 0;
            receiverNewRecord.votesDelegated = 0;
            receiverNewRecord.owner = receiver;
        }
        else {            
            receiverNewRecord = receiverCheckPoints[receiverCheckPoints.length-1];
        }
        receiverNewRecord.votesReceived = votesDelegated;
        receiverNewRecord.blockId = block.number;
        receiverCheckPoints.push(receiverNewRecord);        

        //udpate votingPower for EMITTER (owner) of delegation        
        checkPoint memory emitterNewRecord = emitterCheckPoints[emitterCheckPoints.length-1];
        address owner = emitterNewRecord.owner;
        emitterNewRecord.votesDelegated += votesDelegated;
        emitterNewRecord.percentDelegated += percentage;
        delegatedAddresses[owner].push(receiver);
        emitterNewRecord.blockId = block.number;   
        emitterCheckPoints.push(emitterNewRecord);
    }

    //@dev: helper function `removeDelegatedAddress` deletes address from array of delegated addresses
    function removeDelegatedAddress(address owner, address receiver)  private  {
        uint length = delegatedAddresses[owner].length;
        for (uint i=0; i < delegatedAddresses[owner].length ; i++){
            if (receiver == delegatedAddresses[owner][i]){
                delegatedAddresses[owner][i] = delegatedAddresses[owner][length-1];
                break;
            }
        }
        delegatedAddresses[owner].pop();
        
    }
    
    //@dev: helper function `removeDelegation` updates votingPower by adding a new checkpoint with the removed delegation
    function removeDelegation (checkPoint[] storage emitterCheckPoints, checkPoint[] storage receiverCheckPoints, uint votesRemoved) internal {
        uint currIdx;
        //udpate votingPower for RECEIVER of delegation
        currIdx = receiverCheckPoints.length-1;
        checkPoint memory receiverNewRecord = receiverCheckPoints[currIdx];
        address receiver = receiverNewRecord.owner;
        receiverNewRecord.votesReceived -= votesRemoved;        
        receiverNewRecord.blockId = block.number;
        receiverCheckPoints.push(receiverNewRecord);
        
        //udpate votingPower for EMITTER of delegation        
        currIdx = emitterCheckPoints.length-1;
        checkPoint memory emitterNewRecord = emitterCheckPoints[currIdx];
        address emitter = emitterNewRecord.owner;
        emitterNewRecord.votesDelegated -= votesRemoved;
        emitterNewRecord.percentDelegated -= delegatedPerCent[emitter][receiver] ;     
        removeDelegatedAddress(emitter, receiver);   
        emitterNewRecord.blockId = block.number;
        emitterCheckPoints.push(emitterNewRecord);        
    }

    //@dev: `delegate` enable each token holder to delegate a percentage (or all) of his vote 
    // power (balance) to other addresses    
    function delegate (address receiver, uint percentage) public {        
        if (percentage == 0){
            uint votesRemoved = delegatedVotePower[msg.sender][receiver] ;
            removeDelegation(votingPower[msg.sender], votingPower[receiver], votesRemoved);
            delegatedVotePower[msg.sender][receiver] = 0;
            delegatedPerCent[msg.sender][receiver] = 0;
        }
        else {
            uint delegatedVotes = getDelegatedVotes(votingPower[msg.sender], percentage);
            if (delegatedVotes > 0){
                uint currIdx = votingPower[msg.sender].length-1;
                require((votingPower[msg.sender][currIdx].percentDelegated + percentage) <= 100, 'Cannot delegate more than 100%');
                require(delegatedAddresses[msg.sender].length <5, 'Cannot delegate to more than 5 people');
                delegatedVotePower[msg.sender][receiver] = delegatedVotes;
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
    function balanceOfAt (address member, uint _block) public view returns (uint) {
        uint length = votingPower[member].length;
        if (length == 0) return 0;
        else{
            checkPoint memory checkpoint = getCheckPoint(votingPower[member], _block);            
            return checkpoint.tokenBalance;            
        }
    }

    //@dev: `votePowerOfAt` returns the vote power of a specific address in a specific block
    function votePowerOfAt (address member, uint _block) public view returns (uint) {
        uint length = votingPower[member].length;
        if (length == 0) return 0;
        else{
            checkPoint memory checkpoint = getCheckPoint(votingPower[member], _block);
            uint _votingPower = checkpoint.tokenBalance + checkpoint.votesReceived - checkpoint.votesDelegated;
            return _votingPower ;            
        }
    }

    //@dev: `getCurrentBlock()` used for testing in Mocha
    function getCurrentBlock() public view returns (uint){
        return block.number;
    }
}