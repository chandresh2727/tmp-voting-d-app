// import { useState, useEffect } from "react";
// import useEth from "../../contexts/EthContext/useEth";
// import Web3 from "web3";
import Form from "react-bootstrap/Form";
// import AddressImport from "./AddressImport";
// import DAOTokenImport from "./DAOTokenImport";
// import {textAreaIterator, excelIterator, jsonIterator} from '../../Handlers/iteratorHandler'
// import React, { useReducer, useCallback } from "react";
// var ethers = require('ethers');

export const AddOption = () => {
	return (
		<Form>
			{/* Option Id */}
			<Form.Group className="mb-3" controlId="optionId">
				<Form.Label>Option Id</Form.Label>
				<Form.Control
					type="text"
					name="optionId"
					placeholder="Option I"
					required
				/>
			</Form.Group>

			{/* option name */}
			<Form.Group className="mb-3" controlId="optionName">
				<Form.Label>Option Name</Form.Label>
				<Form.Control
					type="text"
					name="optionName"
					placeholder="Option Name"
					required
				/>
			</Form.Group>

			{/* isUser */}
			<Form.Check
				type="switch"
				id="user"
				name="user"
				label="User or not"
				// checked={}
				// onChange={(e) => setCustomStartDate(!customStartDate)}
			/>
			{/* optionAddress */}
			<Form.Group className="mb-3" controlId="optionAddress">
				<Form.Label>Poll Description</Form.Label>
				<Form.Control
					as="text"
					name="optionAddress"
					rows={1}
					placeholder="Address of an user"
					required
				/>
			</Form.Group>

			{/* Image url */}
			<Form.Group className="mb-3" controlId="imgUrl">
				<Form.Label>Image url</Form.Label>
				<Form.Control
					type="text"
					name="imgUrl"
					placeholder="Put here image url"
					required
				/>
			</Form.Group>

			{/* Stack Amount */}
			<Form.Group className="mb-3" controlId="stackAmt">
				<Form.Label>Give us here Stack Amount</Form.Label>
				<Form.Control
					type="text"
					name="stackAmt"
					placeholder="Stack Amount"
					required
				/>
			</Form.Group>

			{/* tokenAddress */}
			<Form.Group className="mb-3" controlId="tokenAdr">
				<Form.Label>Token Address</Form.Label>
				<Form.Control
					as="text"
					name="tokenAdr"
					rows={1}
					placeholder="Address of an user"
					required
				/>
			</Form.Group>

			{/* vote price */}
			<Form.Group className="mb-3" controlId="votPrice">
				<Form.Label>Vote price</Form.Label>
				<Form.Control
					type="text"
					name="votPrice"
					placeholder="Vote Price"
					required
				/>
			</Form.Group>

			{/* Option MSG */}
			<Form.Group className="mb-3" controlId="optionMSG">
				<Form.Label>Description about poll</Form.Label>
				<Form.Control
					type="text"
					name="optionMSG"
					rows={3}
					placeholder="Put here image url"
					required
				/>
			</Form.Group>

			{/* host Id */}
			<Form.Group className="mb-3" controlId="hostId">
				<Form.Label>Host Id</Form.Label>
				<Form.Control
					type="text"
					name="hostId"
					rows={1}
					placeholder="Host Id"
					required
				/>
			</Form.Group>

			{/* Submit poll */}
			<button className="submit">Submit The Details</button>
		</Form>
	);
};
// };
