import { read, utils } from "xlsx";

export const excelIterator =  (excelFile, cb) => {
    let addressArray = []
    const reader = new FileReader();
    reader.onload = (evt) => { // evt = on_file_select event
        const bstr = evt.target.result;
        const wb =  read(bstr, {type:'binary'});
        const wsname = wb.SheetNames[0];
        const ws =  wb.Sheets[wsname];
        const data =  [...new Set(utils.sheet_to_csv(ws, {header:0}).toString().split(','))];
        for (let i = 0; i < data.length; i++){
            if (data[i].trim().match(/0x[a-fA-F0-9]{40}$/)) {
                if(!addressArray.includes(data[i].trim())) {
                    addressArray.push(data[i].trim())
                }
            }
        }
        return cb(addressArray);
    };
    reader.readAsBinaryString(excelFile);
}