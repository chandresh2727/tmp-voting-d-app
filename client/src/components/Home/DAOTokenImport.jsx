import { useState } from "react";
import Form from "react-bootstrap/Form";
import "./AddressImport.css";

const DAOTokenImport = () => {
  // const [importType, setImportType] = useState(0);
  return (
    <div style={{backgroundColor: "rgba(12,232,83,.2)", padding: "1rem"}}>
        <Form.Group className="mb-3" controlId="tokenAddress">
            <Form.Label>Token Address</Form.Label>
            <Form.Control name="tokenAddress" pattern="0x[a-fA-F0-9]{40}$" title="Please enter valid address" type="text" placeholder="0xabcd" required/>
        </Form.Group>

        <Form.Group className="mb-3" controlId="tokenAmount">
            <Form.Label>Token Amount</Form.Label>
            <Form.Control name="tokenAmount" type="number" placeholder="i.e 0.43" required/>
        </Form.Group>
    </div>
  );
};

export default DAOTokenImport;
