let lucy = [ 399 , 401] ;

function binarySearch(block) {
    let l = lucy.length; 
    if (lucy.length == 0){
        return 0;
    }
    if (block >= lucy[l-1]) {
        return lucy[l-1];
    }
    if (block < lucy[0]){
        return 0
    }

    // Binary search of the value in the array
    min = 0;
    max = l-1;
    let mid;
    while (max > min) {
        mid = (max + min + 1)/ 2;
        if (lucy[mid]<=block) {
            min = mid;
        } else {
            max = mid-1;
        }
    }
    return lucy[min];
}

console.log ("Search of block 398: " + binarySearch(398) + '\n');
console.log ("Search of block 399: " + binarySearch(399) + '\n');
console.log ("Search of block 401: " + binarySearch(401) + '\n');