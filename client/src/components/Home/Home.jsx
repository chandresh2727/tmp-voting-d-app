import { useState } from "react";
import useEth from "../../contexts/EthContext/useEth";
import Form from 'react-bootstrap/Form';
import './Home.css'
import AddressImport from "./AddressImport";

const Home = () => {
    const [pType, setPType] = useState(0);
    alert(pType)
    return (
        <>
        <Form.Group className="mb-3" controlId="pollName">
            <Form.Label>Poll Name</Form.Label>
            <Form.Control type="text" placeholder="poll name" />
            {/* <Form.Text className="text-muted">
            We'll never share your email with anyone else.
            </Form.Text> */}
        </Form.Group>

        <Form.Group className="mb-3" controlId="pollDesc">
            <Form.Label>Poll Description</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="poll description"/>
        </Form.Group>

        <Form.Group className="mb-3">
            <Form.Label>Poll Type  <span id="tooltip-help" data-toggle="tooltip" data-placement="bottom" title="	i) Private - host can upload .json, excel or even mannually add list of ethereum account addresses which are eligible to vote.
ii) Private (Metered) | Stakeholder Voting - Only voters with minimum amount of specific DAO tokens can vote or Voters with special attributes.  
iii)Public - Anyone can vote just by connecting their account">?</span></Form.Label>
            <Form.Select onChange={(e) => setPType( e.target.value)}>

              <option value={0}>PUBLIC</option>
              <option value={1}>PRIVATE</option>
              <option value={2}>METERED</option>
            </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
            <Form.Label>Poll Staus</Form.Label>
            <Form.Select disabled>
              <option value={0}>DRAFT</option>
            </Form.Select>
        </Form.Group>
        {pType !== 0 ?
        <AddressImport/> : 'test'
        }




        <Form.Group className="mb-3">
            <Form.Check type="checkbox" label="Can't check this" disabled />
        </Form.Group>
        </>
      );
}

export default Home;
