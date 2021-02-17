const { assert } = require('chai');

const votingPower = artifacts.require('VotingPower');

require('chai')
    .use(require('chai-as-promised'))
    .should();

//helper function to convert human readble numbers to wei units
function tokens(n){
    return web3.utils.toWei(n, 'ether');    
}


contract ('Testsuite: Flare use cases', ([deployer, Bob, Lucy, Ed, Alice, Charly, Danny, Frank])=>{
    let contract;    
    let block1, block2, block3, block4, block5, block6, block7, vp1, vp2, balance, delegated;
    
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

        await contract.delegate(Alice, '25', {from : Bob});       
        block5 = await contract.getCurrentBlock();

        await contract.transfer(Bob, '20', {from : deployer});        
        block6 = await contract.getCurrentBlock();                      

        await contract.delegate(Lucy, '0', {from : Bob});
        block7 = await contract.getCurrentBlock();
    })

    describe ('\n Describe: Testing -> VotePowerOfAt and BalanceOfAt', async ()=> {        
        it ('validate: votePower for bob: 10 and Lucy: 0', async ()=>{
            balance = await contract.balanceOfAt(Bob, block1);            
            vp1 = await contract.votePowerOfAt(Lucy, block1);
            assert.equal(vp1.toString(), '0', 'Lucy VotePower should be 0');
            vp2 = await contract.votePowerOfAt(Bob, block1);
            assert.equal(vp2.toString(), '10', 'Bob VotePower should be 10');
        })

        it ('Bob delegates 50% to Lucy', async ()=>{
            balance = await contract.balanceOfAt(Bob, block2);            
            vp1 = await contract.votePowerOfAt(Lucy, block2);    
            assert.equal(vp1.toString(), '5', 'Lucy VotePower should be 5');
            vp2= await contract.votePowerOfAt(Bob, block2);    
            assert.equal(vp2.toString(), '5', 'Bob VotePower should be 5');
        })
        
        it ('bob receives 10 tokens (Bob Balance 20)', async ()=>{            
            balance = await contract.balanceOfAt(Bob, block3);            
            vp1 = await contract.votePowerOfAt(Lucy, block3);
            assert.equal(vp1.toString(), '10', 'Lucy VotePower should be 10');
            vp2 = await contract.votePowerOfAt(Bob, block3);
            assert.equal(vp2.toString(), '10', 'Bob VotePower should be 10');
        })        
        it ('Bob delegates 25% to Ed (Bob Balance 20)', async ()=>{    
            vp1 = await contract.votePowerOfAt(Lucy, block4);
            assert.equal(vp1.toString(), '10', 'Lucy VotePower should be 10');
            vp2 = await contract.votePowerOfAt(Bob, block4);    
            assert.equal(vp2.toString(), '5', 'Bob VotePower should be 5');
            vp3 = await contract.votePowerOfAt(Ed, block4);    
            assert.equal(vp3.toString(), '5', 'Ed VotePower should be 5');
        })        
        it ('Bob delegates 25% to Alice (Bob Balance 20)', async ()=>{    
            vp1 = await contract.votePowerOfAt(Lucy, block5);
            assert.equal(vp1.toString(), '10', 'Lucy VotePower should be 10');
            vp2 = await contract.votePowerOfAt(Bob, block5);    
            assert.equal(vp2.toString(), '0', 'Bob VotePower should be 0');
            vp3 = await contract.votePowerOfAt(Ed, block5);    
            assert.equal(vp3.toString(), '5', 'Ed VotePower should be 5');
            vp4 = await contract.votePowerOfAt(Alice, block5);    
            assert.equal(vp4.toString(), '5', 'Alice VotePower should be 5');
        })        
        it ('Bob receives 20 tokens  (Bob Balance 40)', async ()=>{    
            vp1 = await contract.votePowerOfAt(Lucy, block6);
            assert.equal(vp1.toString(), '20', 'Lucy VotePower should be 20');
            vp2 = await contract.votePowerOfAt(Bob, block6);    
            assert.equal(vp2.toString(), '0', 'Bob VotePower should be 0');
            vp3 = await contract.votePowerOfAt(Ed, block6);    
            assert.equal(vp3.toString(), '10', 'Ed VotePower should be 10');
            vp4 = await contract.votePowerOfAt(Alice, block6);    
            assert.equal(vp4.toString(), '10', 'Alice VotePower should be 10');
        })        
        it ('Bob removes delegation from lucy ', async ()=>{    
            vp1 = await contract.votePowerOfAt(Lucy, block7);
            assert.equal(vp1.toString(), '0', 'Lucy VotePower should be 0');
            vp2 = await contract.votePowerOfAt(Bob, block7);    
            assert.equal(vp2.toString(), '20', 'Bob VotePower should be 20');
            vp3 = await contract.votePowerOfAt(Ed, block7);    
            assert.equal(vp3.toString(), '10', 'Ed VotePower should be 10');
            vp4 = await contract.votePowerOfAt(Alice, block7);    
            assert.equal(vp4.toString(), '10', 'Alice VotePower should be 10');
        })                

        it('Fails when owner tries to delegate to more than 5 people', async ()=> {
            //Bob is already delegating to Ed and Alice            
            await contract.delegate(Charly, '10', {from: Bob});
            await contract.delegate(Danny, '10', {from: Bob});
            await contract.delegate(Frank, '10', {from: Bob});
            await contract.delegate(Lucy, '10', {from: Bob}).should.be.rejected;
        })

        it('Fails when owner tries to delegate more than 100%', async ()=> {
            await contract.delegate(Lucy, '90', {from: Bob}).should.be.rejected;
        })

    })
})