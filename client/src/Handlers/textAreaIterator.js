export const textAreaIterator = (textInpt, cb) => {
	// let addressArray = [];
    
	// let i = 0;
	// let j = 42;
    // if (textInpt.length < 42) return addressArray
    
	// for (j; j < textInpt.length; j++) {
	// 	let addr = textInpt.toString().substring(i, j).trim();
    //     console.log(addr)
	// 	if (addr.match(/0x[a-fA-F0-9]{40}$/) && !addressArray.includes(addr)) {
	// 		addressArray.push(addr);
    //         i += 42;
    //         j += 42
    //         continue;
	// 	}
	// 	i++;
	// }
	// console.log("hi");
	// console.log(addressArray);
	// // return cb(addressArray);
    return cb(textInpt.split(",").filter((v) => v.match(/0x[a-fA-F0-9]{40}$/)))
};
