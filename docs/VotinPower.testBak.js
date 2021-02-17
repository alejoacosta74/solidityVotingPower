const { assert } = require('chai');

const votingPower = artifacts.require('VotingPower');

require('chai')
    .use(require('chai-as-promised'))
    .should();

//helper function to convert human readble numbers to wei units
function tokens(n){
    return web3.utils.toWei(n, 'ether');    
}

contract ('Test Suite for VotingPower smart contract', ([deployer, Bob, Lucy, Ed])=>{
    let contract, balance, rv, vp, dv;          

    before (async ()=>{
        contract = await votingPower.new('1000');        
        await contract.transfer(Bob, '20', {from : deployer});
        await contract.transfer(Lucy, '10', {from : deployer});
    })

    describe('\n Describe: Testing -> Basic deployment', async ()=>{
        
        it('Contract has a name', async ()=> {
            const name = await contract.name();
            assert.equal(name, 'Mock XRP');
        })
        it('Initial token transfer to Bob', async ()=> {            
            balance = await contract.balanceOf(Bob);            
            assert.equal(balance.toString(), '20');
        })      
        it('Initial token transfer to Lucy', async ()=> {            
            balance = await contract.balanceOf(Lucy);
            assert.equal(balance.toString(), '10');
        })      
        it('Ed balance remains at 0', async ()=> {            
            balance = await contract.balanceOf(Ed);
            assert.equal(balance.toString(), '0');
        })      
    })

    describe ('\n Describe: Testing -> Initial Voting Power', async ()=> {
        it('Bob voting power is equal to the amount of tokens, i.e. 20', async ()=>{
            vp = await contract.votePowerNow(Bob);
            assert.equal(vp.toString(), '20', 'VotePower for Bob should be 20');
        })
        it('Lucy voting power is equal to the amount of tokens, i.e. 10', async ()=>{
            vp = await contract.votePowerNow(Lucy);
            assert.equal(vp.toString(), '10', 'VotePower for Bob should be 10');
        })
        it('Ed voting power is equal to the amount of tokens, i.e. 0', async ()=>{
            vp = await contract.votePowerNow(Ed);
            assert.equal(vp.toString(), '0', 'VotePower for Bob should be 0');
        })
    })

    describe ('\n Describe: Testing -> Delegate function', async () =>{
        it('Bob delegates 50% to Lucy', async () => {                  
            await contract.delegate(Lucy, '50', {from : Bob});
            vp = await contract.votePowerNow(Lucy);
            assert.equal(vp.toString(), '20', 'VotePower for Lucy should be 20');
            dv = await contract.delegatedVotesNow(Bob);            
            assert.equal(dv.toString(), '10', "Delegated Votes for Bob should be 10");
            vp = await contract.votePowerNow(Bob);
            assert.equal(vp.toString(), '10', "VotePower for Bob should be 10");            
        })        

        it('Bob delegates 25% to Ed', async () => {           
            await contract.delegate(Ed, '25', {from : Bob}); 
            vp = await contract.votePowerNow(Ed);            
            assert.equal(vp.toString(), '5', 'VotePower for Ed should be 5');
            dv = await contract.delegatedVotesNow(Bob);            
            assert.equal(dv.toString(), '15', "Delegated votes for Bob should be 15");
            vp = await contract.votePowerNow(Bob);            
            assert.equal(vp.toString(), '5', "VotePower for Bob should be 5"); 
        })
    })

    describe ('\n Describe: Testing -> Remove Delegate', async () => {
        it ('Bob Removes delegation to Lucy', async ()=> {
            await contract.delegate(Lucy, '0', {from : Bob});
            vp = await contract.votePowerNow(Lucy);
            assert.equal(vp.toString(), '10', 'VotePower for Lucy after removed delegation should be 10');
            dv = await contract.delegatedVotesNow(Bob);
            assert.equal(dv.toString(), '5', "Delegated Votes for Bob should be 5");
            vp = await contract.votePowerNow(Bob);
            assert.equal(vp.toString(), '15', "VotePower for Bob should be 15");            
        })        
        it('Bob removes delegation to Ed', async () => {
            await contract.delegate(Ed, '0', {from : Bob});
            vp = await contract.votePowerNow(Ed);            
            assert.equal(vp.toString(), '0', "Vote Power for Ed should be 0");
            dv = await contract.delegatedVotesNow(Bob);            
            assert.equal(dv.toString(), '0', "Delegated Votes for Bob should be 0");
            vp = await contract.votePowerNow(Bob);            
            assert.equal(vp.toString(), '20', "VotePower for Bob should be 20");            
        })
        
    })
})

contract ('Testsuite for functions BalanceOfAT() and VotePowerOfAt()', ([deployer, Bob, Lucy, Ed, Alice])=>{
    let contract;    
    let block4, block5, block6, block7, block8, block9, block10, block11, block12, block13, vp, balance;
    
    before (async ()=>{               
        contract = await votingPower.new('1000');        

        await contract.transfer(Bob, '20', {from : deployer});        
        block4 = await contract.getCurrentBlock();        
        await contract.transfer(Lucy, '10', {from : deployer});        
        block5 = await contract.getCurrentBlock();
        await contract.transfer(Alice, '10', {from : deployer});        
        block6 = await contract.getCurrentBlock();
        await contract.transfer(Alice, '10', {from : deployer});        
        block7 = await contract.getCurrentBlock();
        await contract.transfer(Alice, '10', {from : deployer});        
        block8 = await contract.getCurrentBlock();
        await contract.transfer(Alice, '10', {from : deployer});        
        block9 = await contract.getCurrentBlock();                    
        await contract.delegate(Lucy, '50', {from : Bob});
        block10 = await contract.getCurrentBlock();
        await contract.delegate(Ed, '25', {from : Bob});       
        block11 = await contract.getCurrentBlock();      
        await contract.delegate(Lucy, '0', {from : Bob});
        block12 = await contract.getCurrentBlock();      
        await contract.delegate(Ed, '0', {from : Bob});
        block13 = await contract.getCurrentBlock();        
    })

    describe ('\n Describe: Testing -> VotePowerOfAt and BalanceOfAt with Lucy\n', async ()=> {        
        it ('On block 9 Lucy has VotingPower = 10 and Balance = 10', async ()=>{
            balance = await contract.balanceOfAt(Lucy, block9);            
            vp = await contract.votePowerOfAt(Lucy, block9);
            assert.equal(vp.toString(), '10', 'Lucy VotePower should be 10');
            assert.equal(balance.toString(), '10', 'Lucy Balance should be 10');
        })

        it ('On block 10 Lucy has VotingPower = 20', async ()=>{
            balance = await contract.balanceOfAt(Lucy, block10);            
            vp = await contract.votePowerOfAt(Lucy, block10);
            assert.equal(vp.toString(), '20', 'Lucy VotePower should be 10');
            assert.equal(balance.toString(), '10', 'Lucy Balance should be 10');
        })
        
        it ('On block 11 Lucy has VotingPower = 20', async ()=>{
            balance = await contract.balanceOfAt(Lucy, block11);            
            vp = await contract.votePowerOfAt(Lucy, block11);
            assert.equal(vp.toString(), '20', 'Lucy VotePower should be 20');
            assert.equal(balance.toString(), '10', 'Lucy Balance should be 10');
        })        
        it ('On block 12 Lucy has VotingPower = 10', async ()=>{
            balance = await contract.balanceOfAt(Lucy, block12);            
            vp = await contract.votePowerOfAt(Lucy, block12);
            assert.equal(vp.toString(), '10', 'Lucy VotePower should be 10');
            assert.equal(balance.toString(), '10', 'Lucy Balance should be 10');
        })        
    })

    describe ('\n Describe: Testing -> VotePowerOfAt and BalanceOfAt with Bob\n', async ()=> {        
        let step, passedBlock, foundBlock;
        it ('On block 9 Bob has VotingPower = 20 and Balance = 20', async ()=>{
            balance = await contract.balanceOfAt(Bob, block9);            
            vp = await contract.votePowerOfAt(Bob, block9);
            assert.equal(vp.toString(), '20', 'Bob VotePower should be 20');
            assert.equal(balance.toString(), '20', 'Bob Balance should be 20');
        })

        it ('On block 10 Bob has VotingPower = 10 and Balance = 20', async ()=>{
            balance = await contract.balanceOfAt(Bob, block10);            
            vp = await contract.votePowerOfAt(Bob, block10);
            assert.equal(vp.toString(), '10', 'Bob VotePower should be 10');
            assert.equal(balance.toString(), '20', 'Bob Balance should be 20');
        })        
        it ('On block 11 Bob has VotingPower = 5 and Balance = 20', async ()=>{
            balance = await contract.balanceOfAt(Bob, block11);            
            vp = await contract.votePowerOfAt(Bob, block11);
            assert.equal(vp.toString(), '5', 'Bob VotePower should be 5');
            assert.equal(balance.toString(), '20', 'Bob Balance should be 2');
        })        
        it ('On block 12 Bob has VotingPower = 15 and Balance = 20', async ()=>{
            balance = await contract.balanceOfAt(Bob, block12);            
            vp = await contract.votePowerOfAt(Bob, block12);
            assert.equal(vp.toString(), '15', 'Bob VotePower should be 15');
            assert.equal(balance.toString(), '20', 'Bob  Balance should be 20');
        })        
        it ('On block 13 Bob has VotingPower = 20 and Balance = 20', async ()=>{
            balance = await contract.balanceOfAt(Bob, block13);            
            vp = await contract.votePowerOfAt(Bob, block13);
            assert.equal(vp.toString(), '20', 'Bob VotePower should be 20');
            assert.equal(balance.toString(), '20', 'Bob  Balance should be 20');
        })        
    })

    describe ('\n Describe: Testing -> VotePowerOfAt and BalanceOfAt with Ed\n', async ()=> {        
        it ('On block 9 Ed has VotingPower = 0 and Balance = 0', async ()=>{
            balance = await contract.balanceOfAt(Ed, block9);            
            vp = await contract.votePowerOfAt(Ed, block9);            
            assert.equal(vp.toString(), '0', 'Ed VotePower should be 0');
            assert.equal(balance.toString(), '0', 'Ed Balance should be 0');
        })

        it ('On block 10 Ed has VotingPower = 0', async ()=>{
            balance = await contract.balanceOfAt(Ed, block10);            
            vp = await contract.votePowerOfAt(Ed, block10);
            assert.equal(vp.toString(), '0', 'Ed VotePower should be 0');
            assert.equal(balance.toString(), '0', 'Ed Balance should be 0');
        })
        
        it ('On block 11 Ed has VotingPower = 5', async ()=>{
            balance = await contract.balanceOfAt(Ed, block11);            
            vp = await contract.votePowerOfAt(Ed, block11);
            assert.equal(vp.toString(), '5', 'Ed VotePower should be 5');
            assert.equal(balance.toString(), '0', 'Ed Balance should be 0');
        })        
        it ('On block 12 Ed has VotingPower = 5', async ()=>{
            balance = await contract.balanceOfAt(Ed, block12);            
            vp = await contract.votePowerOfAt(Ed, block12);
            assert.equal(vp.toString(), '5', 'Ed VotePower should be 5');
            assert.equal(balance.toString(), '0', 'Ed Balance should be 0');
        })        
        it ('On block 13 Ed has VotingPower = 0', async ()=>{
            balance = await contract.balanceOfAt(Ed, block13);            
            vp = await contract.votePowerOfAt(Ed, block13);
            assert.equal(vp.toString(), '0', 'Ed VotePower should be 0');
            assert.equal(balance.toString(), '0', 'Ed Balance should be 0');
        })        
    })

})