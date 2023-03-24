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
        string optionId; // opt prefix with random string
        string optionName; // gifu
        bool isUser; // gifu get it from user andif user
        address optionAddress; // gifu if user is true thn ; default 0x000 | walletAdress of the Candidate
        string imageUrl; // gifu if true store the url else store "N/A"
        uint stakeAmount; // gifu and if poll type is metered else 0.0
        address tokenAddress; // gifu and if poll type is metered else 0x0000
        uint votePrice; // 1 vote will cost 5 rights??
        string optionMessage; // gifu just for bystand; the political party's message
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

    // PollType public pollType;

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
        address[] addressList;
        address tokenContractAddress;
        uint tokenAmount;
        string[] options;
    }

    struct PollTime {
        string pollId;
        bool customStartDate;
        bool customEndDate;
        uint pollStartDate;
        uint pollEndDate;
    }

    struct Person {
        string pollId;
    }

    User[] public users;
    Poll[] internal polls;
    PollTime[] internal  pollTimes;
    Rights[] public rights;
Person[] persons;
    Option[] public options;

    // utils variables start
    uint counter =1;
    //utils variables end

    function findIdByAddress(address _user) public view returns(UserId memory) {
        for(uint8 i = 0; i < users.length; i++) {
            if (users[i].walletAddress == _user) {
                return UserId(users[i].hostId, users[i].voterId, true);
            }
        }
        return UserId("null", "null", false);
    }

    function _checkUsersExistence(address _user) public view returns(bool) {
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


       function _random(uint number) public  returns(uint){
        counter++;
        return uint(keccak256(abi.encodePacked(block.timestamp,block.prevrandao,msg.sender,counter))) % number;
    }
    
    function _randomString(uint size)  public returns(string memory){
        bytes memory randomWord=new bytes(size);
        // since we have 26 letters
        bytes memory chars = new bytes(36);
        chars="abcdefghijklmnopqrstuvwxyz0123456789";
        for (uint i=0;i<size;i++){
            uint randomNumber=_random(36);
            randomWord[i]=chars[randomNumber];
        }
        return string(randomWord);
    }

    function _generateId(string memory _prefix) public returns(string memory) {
        return string(abi.encodePacked(_prefix,_randomString(13)));
    }


    function _createUser(address _user) public returns(bool) {
        string memory _hostId = _generateId("hst");
        string memory _voterId = _generateId("vtr");
        string[] memory placeholderArr;
        hostIdMap[_hostId] = _user;
        voterIdMap[_voterId] = _user;
        users.push(User(_user, _hostId, _voterId, placeholderArr, placeholderArr));
        return true;
    }
Poll[] pollList;
PollTime[]  pollTimeList;



// function createPoll(string memory _pollName, string memory _pollDescription,string memory _pollType, address _tokenAddr, uint _tokenAmount, bool _customStartDate, bool _customEndDate, uint _pollStartDate, uint _pollEndDate, address _user, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) public returns(bool) {
    function createPoll(Poll memory poll, PollTime memory pollTime , address _user, uint _nonce, bytes32 _hash, bytes memory _signature) public returns(Poll[] memory, PollTime[] memory) {
        if (!_checkUsersExistence(_user)) {_createUser(_user);}
        require(_checkUsersExistence(_user), "User does not exist");
        
        // PollType pollType;
        // if (keccak256(bytes(_pollType)) == keccak256(bytes("METERED"))) {pollType = PollType.METERED;}
        // else if (keccak256(bytes(_pollType)) == keccak256(bytes("PRIVATE"))) {pollType = PollType.PRIVATE;}
        // else {pollType = PollType.PUBLIC;}
        poll.pollId = _generateId("pid");
        pollTime.pollId = poll.pollId;
        poll.hostId = findIdByAddress(_user).hostId;
        string[] memory option;
        poll.options = option;
        address defAddr = 0x0000000000000000000000000000000000000000;
        if (poll.tokenAmount != 0) {
            poll.pollType = PollType.METERED;
        }  else if (poll.addressList[0] == defAddr){
             poll.pollType = PollType.PRIVATE;
        } else {
              poll.pollType = PollType.PUBLIC;
        }
       persons.push(Person(poll.pollId));
        pollList.push(Poll(poll.pollId, poll.pollName, poll.pollDescription, poll.pollType, PollStatus.DRAFT, poll.hostId, poll.walletAddress, poll.addressList, poll.tokenContractAddress, poll.tokenAmount, poll.options));
        
        pollTimeList.push(PollTime(pollTime.pollId, pollTime.customStartDate, pollTime.customEndDate, pollTime.pollStartDate, pollTime.pollEndDate) );
        // polls.push(Poll(_pollId, _pollName, _pollDescription, pollType, PollStatus.DRAFT, hostId, _user, _tokenAddr, _tokenAmount, _customStartDate, _customEndDate, _pollStartDate, _pollEndDate));
        polls.push(pollList[0]);
        pollTimes.push(pollTimeList[0]);
        pollList.pop();
        pollTimeList.pop();
        return (polls, pollTimes);
    }

    function viewPoll() public view returns (Poll[] memory, PollTime[] memory, Person[] memory) {
        return (polls, pollTimes, persons);
    }

    function createPoll2() public pure returns(string memory) {
        return "hello from createPoll2";
    }

    // function update() public returns(string memory _optionId, string memory _optionName, bool _isUser, address _optionAddress, string memory _imageUrl, uint _stakeAmount, address _tokenAddress, string memory _optionMessage) {
    //     _optionId = (string)(abi.encodePacked("opt", keccak256(abi.encodePacked("",block.timestamp))));
    //     for(uint8 j = 0; j < options.length; j++) {
    //         if (Option[j].optionName == _optionName) {
    //             Option[j].optionName = _optionName;
    //         }
    //     }

    //     for(uint8 i = 0;i < options.length;i++){
    //     if(options[i].isUser == true) {
    //         Option[i].isUser = _isUser;
    //     }

    //     require(options.optionAddress = _optionAddress, "0X00000",msg.sender);

    //     require(pollType.metered,_stakeAmount,"0.00");

    //     require(pollType.metered,_tokenAddress,"0.00");

    //     options.voterPrice = (1 ETH;


    }