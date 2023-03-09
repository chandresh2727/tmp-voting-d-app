// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    mapping(string => address) public hostIdMap;
    mapping(string => address) public voterIdMap;

    struct UserId {
        string hostId;
        string voterId;
        bool found;
    }

    struct Vote {
        string voteId;
        string voterId;
        string optionId;
    }

    struct Rights {
        string pollId;
        uint8 allowedVotes;// 0-255
        uint8 remainingVotes;// 0-255
        string[] castedVotes; // optionId array
    }

    struct Option {
        string optionId;
        string optionName;
        address optionAddress; // default 0x000 | walletAdress of the Candidate
        string imageUrl;
        uint stakeAmount;
        address tokenAddress;
        uint votePrice; // 1 vote will cost 5 rights??
        string optionMessage; // just for bystand; the political party's message
        string hostId; // the hostId of the poll Host
    }

    struct User {
        address walletAddress;
        string hostId;
        string voterId;
        string[] pollId;
        string[] rights; // rightId
    }

    enum PollType {
        PUBLIC, PRIVATE, METERED
    }

    enum PollStatus{
        DRAFT, LIVE, CONDUCTED, DISCARDED
    }

    struct Poll {
        string pollId;
        string pollName;
        string pollDescription;
        PollType pollType;
        PollStatus pollStatus;
        string hostId;
        address walletAddress;
        address tokenContractAddress;
        uint tokenAmount;
        bool customStartDate;
        bool customEndDate;
        uint pollStartDate;
        uint pollEndDate;
    }

    User[] users;
    Poll[] polls;
    Rights[] rights;
    Option[] options;

    function findIdByAddress(address _user) private view returns(UserId memory) {
        for(uint8 i = 0; i < users.length; i++) {
            if (users[i].walletAddress == _user) {
                return UserId(users[i].hostId, users[i].voterId, true);
            }
        }
        return UserId("null", "null", false);
    }

    function _checkUsersExistence(address _user) private view returns(bool) {
        for(uint8 i = 0; i < users.length; i++) {
            if (users[i].walletAddress == _user) {
                return true;
            }
        }
        return false;
    }


    function _getSlice(uint256 begin, uint256 end, string memory text) public pure returns (string memory) {
        bytes memory a = new bytes(end-begin+1);
        for(uint i=0;i<=end-begin;i++){
            a[i] = bytes(text)[i+begin-1];
        }
        return string(a);
    }

    function _validatePollId(string memory _pid) internal view returns (bool) {
        if(keccak256(bytes(this._getSlice(0,2,_pid))) == keccak256(bytes("pid"))) {
            return true;
        }
        return false;
    }

    function _validateUserId(string memory _uid) internal view returns (bool) {
        if(keccak256(bytes(this._getSlice(0,2,_uid))) == keccak256(bytes("hst"))) {
            return true;
        }
        return false;
    }

    function _verifySIG(address _user, bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) private pure returns(bool) {
        return bool(ecrecover(keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash)),_v,_r,_s) == _user);
    }

    function _validateVoterId(string memory _vid) internal view returns (bool) {
        if(keccak256(bytes(this._getSlice(0,2,_vid))) == keccak256(bytes("vtr"))) {
            return true;
        }
        return false;
    }

    function _createUser(address _user) private returns(bool) {
        string memory _hostId = string(abi.encodePacked("hst", keccak256(abi.encodePacked("host id",block.timestamp))));
        string memory _voterId = string(abi.encodePacked("vtr", keccak256(abi.encodePacked("voter id",block.timestamp))));

        string[] memory placeholderArr;
        hostIdMap[_hostId] = _user;
        voterIdMap[_voterId] = _user;
        users.push(User(_user, _hostId, _voterId, placeholderArr, placeholderArr));
        return true;
    }


// function createPoll(string memory _pollName, string memory _pollDescription,string memory _pollType, address _tokenAddr, uint _tokenAmount, bool _customStartDate, bool _customEndDate, uint _pollStartDate, uint _pollEndDate, address _user, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) public returns(bool) {
    function createPoll(Poll memory poll, address _user, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) public returns(bool) {
        if (!_checkUsersExistence(_user)) {_createUser(_user);}
        require(_checkUsersExistence(_user), "User does not exist");
        // PollType pollType;
        // if (keccak256(bytes(_pollType)) == keccak256(bytes("METERED"))) {pollType = PollType.METERED;}
        // else if (keccak256(bytes(_pollType)) == keccak256(bytes("PRIVATE"))) {pollType = PollType.PRIVATE;}
        // else {pollType = PollType.PUBLIC;}
        poll.pollId = string(abi.encodePacked("pid", keccak256(abi.encodePacked("p lid",block.timestamp))));
        poll.hostId = findIdByAddress(_user).hostId;
        // polls.push(Poll(_pollId, _pollName, _pollDescription, pollType, PollStatus.DRAFT, hostId, _user, _tokenAddr, _tokenAmount, _customStartDate, _customEndDate, _pollStartDate, _pollEndDate));
        polls.push(poll);
        return true;
    }



}