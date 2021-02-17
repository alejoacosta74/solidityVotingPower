const { assert } = require('chai');

const votingPower = artifacts.require('VotingPower');

require('chai')
    .use(require('chai-as-promised'))
    .should();

//helper function to convert human readble numbers to wei units
function tokens(n){
    return web3.utils.toWei(n, 'ether');    
}


contract ('Testsuite: Flare use cases', ([deployer, Bob, Lucy, Ed, Alice])=>{
    let contract;    
    let vpEd, vpAlice, length, block , block1, block2, block3, block4, block5, block6, block7, percent, mapPercent, block10, block11, block12, block13, vp, vp1, vp2, balance;
    
    before (async ()=>{               
        contract = await votingPower.new('1000');        

        await contract.transfer(Bob, '10', {from : deployer});        
        block1 = await contract.getCurrentBlock();
        vp = await contract.votePowerNow(Lucy);
        vp1 = await contract.votePowerOfAt(Lucy, block1);
        length = await contract.getDelegatedAddressesLengthNOW(Bob);
        percent = await contract.getDelegatedPercentageNOW(Bob);
        mapPercent = await contract.getMappingDelegatedPercent(Bob, Lucy)
        block = await contract.memberBlockNow(Lucy);
        console.log('Block1: ' + block1 + ' BlockNow(Lucy): ' + block +  ' PowerNow(Lucy): ' + vp + ' PowerOfAt(Lucy, block1): ' + vp1+ ' Bob.deldAdd.length: ' + length + ' Bob.delegatedPercentage: ' + percent);
        
        await contract.delegate(Lucy, '50', {from : Bob});        
        block2 = await contract.getCurrentBlock();
        vp = await contract.votePowerNow(Lucy);
        vp1 = await contract.votePowerOfAt(Lucy, block2);
        length = await contract.getDelegatedAddressesLengthNOW(Bob);
        percent = await contract.getDelegatedPercentageNOW(Bob);
        mapPercent = await contract.getMappingDelegatedPercent(Bob, Lucy)
        block = await contract.memberBlockNow(Lucy);
        console.log('Block2: ' + block2 + ' BlockNow(Lucy): ' + block +  ' PowerNow(Lucy): ' + vp + ' PowerOfAt(Lucy, block2): ' + vp1+ ' Bob.deldAdd.length: ' + length + ' Bob.delegatedPercentage: ' + percent);
        
        await contract.transfer(Bob, '10', {from : deployer});        
        block3 = await contract.getCurrentBlock();
        vp = await contract.votePowerNow(Lucy);
        vp1 = await contract.votePowerOfAt(Lucy, block3);
        length = await contract.getDelegatedAddressesLengthNOW(Bob);
        percent = await contract.getDelegatedPercentageNOW(Bob);
        mapPercent = await contract.getMappingDelegatedPercent(Bob, Lucy)
        block = await contract.memberBlockNow(Lucy);
        console.log('Block3: ' + block3 + ' BlockNow(Lucy): ' + block +  ' PowerNow(Lucy): ' + vp + ' PowerOfAt(Lucy, block3): ' + vp1+ ' Bob.deldAdd.length: ' + length + ' Bob.delegatedPercentage: ' + percent);

        await contract.delegate(Ed, '25', {from : Bob});       
        block4 = await contract.getCurrentBlock();
        vp = await contract.votePowerNow(Lucy);
        vp1 = await contract.votePowerOfAt(Lucy, block4);
        length = await contract.getDelegatedAddressesLengthNOW(Bob);
        percent = await contract.getDelegatedPercentageNOW(Bob);
        console.log('Block4: ' + block4 + ' PowerNow(Lucy): ' + vp + ' PowerOfAt(Lucy, block4): ' + vp1+ ' Bob.deldAdd.length: ' + length + ' Bob.delegatedPercentage: ' + percent);
        vpEd = await contract.votePowerOfAt(Ed, block4);
        vpAlice = await contract.votePowerOfAt(Alice, block4);
        console.log('Block4: ' + block4 + ' PowerOfAt(Ed, block4): ' + vpEd + ' PowerOfAt(Alice, Block4):' + vpAlice);

        await contract.delegate(Alice, '25', {from : Bob});       
        block5 = await contract.getCurrentBlock();
        vp = await contract.votePowerNow(Lucy);
        vp1 = await contract.votePowerOfAt(Lucy, block5);
        length = await contract.getDelegatedAddressesLengthNOW(Bob);
        percent = await contract.getDelegatedPercentageNOW(Bob);
        console.log('Block5: ' + block5 + ' PowerNow(Lucy): ' + vp + ' PowerOfAt(Lucy, block5): ' + vp1+ ' Bob.deldAdd.length: ' + length + ' Bob.delegatedPercentage: ' + percent);
        vpEd = await contract.votePowerOfAt(Ed, block5);
        vpAlice = await contract.votePowerOfAt(Alice, block5);
        console.log('Block5: ' + block5 + ' PowerOfAt(Ed, block5): ' + vpEd + ' PowerOfAt(Alice, Block5):' + vpAlice);

        await contract.transfer(Bob, '20', {from : deployer});        
        block6 = await contract.getCurrentBlock();                      
        vp = await contract.votePowerNow(Lucy);
        vp1 = await contract.votePowerOfAt(Lucy, block6);
        length = await contract.getDelegatedAddressesLengthNOW(Bob);
        percent = await contract.getDelegatedPercentageNOW(Bob);
        block = await contract.memberBlockNow(Lucy);
        console.log('Block6: ' + block6 + ' BlockNow(Lucy): ' + block +  ' PowerNow(Lucy): ' + vp + ' PowerOfAt(Lucy, block3): ' + vp1+ ' Bob.deldAdd.length: ' + length + ' Bob.delegatedPercentage: ' + percent);
        vpEd = await contract.votePowerOfAt(Ed, block6);
        vpAlice = await contract.votePowerOfAt(Alice, block6);
        console.log('Block6: ' + block6 + ' PowerOfAt(Ed, block6): ' + vpEd + ' PowerOfAt(Alice, Block6):' + vpAlice);


        await contract.delegate(Lucy, '0', {from : Bob});
        block7 = await contract.getCurrentBlock();
        vp = await contract.votePowerNow(Lucy);
        vp1 = await contract.votePowerOfAt(Lucy, block7);
        length = await contract.getDelegatedAddressesLengthNOW(Bob);
        percent = await contract.getDelegatedPercentageNOW(Bob);
        block = await contract.memberBlockNow(Lucy);
        console.log('Block7: ' + block7 + ' BlockNow(Lucy): ' + block +  ' PowerNow(Lucy): ' + vp + ' PowerOfAt(Lucy, block3): ' + vp1+ ' Bob.deldAdd.length: ' + length + ' Bob.delegatedPercentage: ' + percent);
        vpEd = await contract.votePowerOfAt(Ed, block7);
        vpAlice = await contract.votePowerOfAt(Alice, block7);
        console.log('Block7: ' + block7 + ' PowerOfAt(Ed, block7): ' + vpEd + ' PowerOfAt(Alice, Block7):' + vpAlice);


    })

    describe ('\n Describe: Testing -> VotePowerOfAt and BalanceOfAt with Lucy\n', async ()=> {        
        it ('validate: votePower for bob: 10 and Lucy: 0', async ()=>{
            balance = await contract.balanceOfAt(Bob, block1);            
            vp1 = await contract.votePowerOfAt(Lucy, block1);
            assert.equal(vp1.toString(), '0', 'Lucy VotePower should be 0');
            vp2 = await contract.votePowerOfAt(Bob, block1);
            console.log('Bob Vote Power at Block1: ' + vp2 + ' Bob balance at Block1: ' + balance);
            assert.equal(vp2.toString(), '10', 'Bob VotePower should be 10');
        })

        it ('Bob delegates 50% to Lucy', async ()=>{
            balance = await contract.balanceOfAt(Bob, block2);            
            vp1 = await contract.votePowerOfAt(Lucy, block2);    
            assert.equal(vp1.toString(), '5', 'Lucy VotePower should be 5');
            vp2= await contract.votePowerOfAt(Bob, block2);    
            console.log('Bob Vote Power at Block2: ' + vp2 + ' Bob balance at Block2: ' + balance);            
            assert.equal(vp2.toString(), '5', 'Bob VotePower should be 5');
        })
        
        it ('bob receives 10 tokens (Bob Balance 20)', async ()=>{            
            balance = await contract.balanceOfAt(Bob, block3);            
            vp1 = await contract.votePowerOfAt(Lucy, block3);
            assert.equal(vp1.toString(), '10', 'Lucy VotePower should be 10');
            vp2 = await contract.votePowerOfAt(Bob, block3);
            console.log('Bob Vote Power at Block3: ' + vp2 + ' Bob balance at Block3: ' + balance);                        
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
    })
})