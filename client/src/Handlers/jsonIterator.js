export const jsonIterator =  (jsonFile, cb) => {
    let addressArray = []
    const reader = new FileReader();
    reader.onload = (evt) => { // evt = on_file_select event
        const bstr = evt.target.result;
        console.log(bstr)
        let i = 0
        let j = 42
        for (j; j < bstr.length; j++) {
            let addr = bstr.toString().substring(i,j).trim()
            if (addr.match(/0x[a-fA-F0-9]{40}$/) && !addressArray.includes(addr)) {
                addressArray.push(addr)
            }
            i++
        }
        console.log('hi')
        console.log(addressArray)
        return cb(addressArray);
    };
    reader.readAsText(jsonFile);
}