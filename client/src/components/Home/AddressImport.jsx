import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Form from 'react-bootstrap/Form';
import './AddressImport.css'

const AddressImport = () => {
    const [importType, setImportType] = useState(0);
    return <div>

<Form.Check
            type="radio"
            label={`import addresses separated by comma ","`}
            onSelect={()=> setImportType(0)}
            name="importTypeRadio"
            /><Form.Check
            type="radio"
            label={`import with .json/.xlsx file"`}
            onSelect={() => setImportType(1)}
            name="importTypeRadio"
          />

        {importType === 0 ? 'input' : 'file'}

    </div>
}

export default AddressImport