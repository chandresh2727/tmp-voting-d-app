import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Form from "react-bootstrap/Form";
import "./AddressImport.css";

export const AddressImport = () => {
  const [importType, setImportType] = useState(0);
  return (
    <div style={{backgroundColor: "rgba(212,22,3,.2)", padding: "1rem"}}>
      <Form.Check
        type="radio"
        label={`import addresses separated by comma ","`}
        onChange={() => setImportType(0)}
        name="importTypeRadio"
        value={'text'}
        checked={!importType}
        required
      />
      {importType === 0 ? (
        <Form.Group className="mb-3" controlId="pollDesc">
          <Form.Label>List of addresses: </Form.Label>
          <Form.Control
            name="addressList"
            as="textarea"
            rows={3}
            placeholder="0xabcd, 0x1234, 0xa2b1"
            required
          />
        </Form.Group>
      ) : (
        ""
      )}
      <Form.Check
        type="radio"
        label={`import with json or excel file`}
        onChange={() => setImportType(1)}
        name="importTypeRadio"
        value={'file'}
        checked={importType}
        required
      /> 
      {importType === 1 ? (
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Control type="file" name="addressListFile" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .json, application/json" required/>
        </Form.Group>
      ) : (
        ""
      )}
      {/* {importType === 0 ? "input" : "file"} */}
    </div>
  );
};
