const { assert } = require('chai');

const votingPower = artifacts.require('VotingPower');

require('chai')
    .use(require('chai-as-promised'))
    .should();

//helper function to convert human readble numbers to wei units
function tokens(n){
    return web3.utils.toWei(n, 'ether');    
}

contract ('Testsuite for functions BalanceOfAT() and VotePowerOfAt()', ([deployer, Bob, Lucy, Ed, Alice])=>{
    let contract;    
    let block1, block2, block3, block4, block5, block6, block7, block8, block9, block10, block11, block12, block13, vp, balance;
    
    before (async ()=>{               
        contract = await votingPower.new('1000');        

        await contract.transfer(Bob, '10', {from : deployer});        
        block1 = await contract.getCurrentBlock();        
        await contract.delegate(Lucy, '50', {from : Bob});
        block2 = await contract.getCurrentBlock();
        await contract.transfer(Bob, '10', {from : deployer});        
        block3 = await contract.getCurrentBlock();        
        await contract.delegate(Ed, '25', {from : Bob});       
        block4 = await contract.getCurrentBlock();      
        await contract.delegate(Lucy, '0', {from : Bob});
        block5 = await contract.getCurrentBlock();      
        await contract.delegate(Ed, '0', {from : Bob});
        block6 = await contract.getCurrentBlock();        
    })

    describe ('Describe: Bob Balance 10 and Lucy Balance 0 (Block1)', async ()=> {        
        it ('validate: votePower for bob: 10 (Block1)', async ()=>{
            balance = await contract.balanceOfAt(Bob, block1);            
            vp = await contract.votePowerOfAt(Bob, block1);
            assert.equal(vp.toString(), '10', 'Bob VotePower should be 10');
            assert.equal(balance.toString(), '10', 'Bob Balance should be 10');
        })

        it ('validate votepower for lucy: 0 (Block1)', async ()=>{
            balance = await contract.balanceOfAt(Lucy, block1);            
            vp = await contract.votePowerOfAt(Lucy, block1);
            assert.equal(vp.toString(), '0', 'Lucy VotePower should be 0');
            assert.equal(balance.toString(), '0', 'Lucy Balance should be 0');
        })
    })

    describe ('Bob delegates 50% to lucy (Block2)', async ()=> {        
        it ('validate votepower of lucy: 5 (Block2)', async ()=>{
            balance = await contract.balanceOfAt(Lucy, block2);            
            vp = await contract.votePowerOfAt(Lucy, block2);
            assert.equal(vp.toString(), '5', 'Lucy VotePower should be 5');
            assert.equal(balance.toString(), '0', 'Lucy Balance should be 0');
        })

        it ('validate votepower of Bob: 5 (Block2)', async ()=>{
            balance = await contract.balanceOfAt(Bob, block2);            
            vp = await contract.votePowerOfAt(Bob, block2);
            assert.equal(vp.toString(), '5', 'Bob VotePower should be 5');
            assert.equal(balance.toString(), '10', 'Bob Balance should be 10');
        })
    })
    
    describe ('bob receives 10 tokens (Block3)', async ()=> {                
        it ('validate vote power of lucy: 10 (block3)', async ()=>{
            balance = await contract.balanceOfAt(Lucy, block3);            
            vp = await contract.votePowerOfAt(Lucy, block3);
            assert.equal(vp.toString(), '5', 'Lucy VotePower should be 5');
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