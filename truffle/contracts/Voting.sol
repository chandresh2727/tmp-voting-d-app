// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "./IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract Voting {
    struct UserId {
        string hostId;
        string voterId;
        bool found;
    }

    struct Vote {
        string voteId;
        string pollId;
        address userId;
        string optionId;
    }

    // vid => Vote {}
    mapping(string => Vote) public globalVoteMap;
    // pollId -> string[vid]
    mapping(string => string[]) public poll2voteMap;
    // userId -> string[vid]
    mapping(address => string[]) public user2voteMap;

    struct Option {
        string pollId;
        string optionId; // opt prefix with random string
        string optionName; // gifu
        string optionDescription;
        // bool isUser; // gifu get it from user andif user
        // address optionAddress; // gifu if user is true thn ; default 0x000 | walletAdress of the Candidate
        // string imageUrl; // gifu if true store the url else store "N/A"
        // uint stakeAmount; // gifu and if poll type is metered else 0.0
        // address tokenAddress; // gifu and if poll type is metered else 0x0000
        // uint votePrice; // 1 vote will cost 5 rights??
       // gifu just for bystand; the political party's message
        // string hostId; // the hostId of the poll Host
    }

    struct User {
        address walletAddress;
        string hostId;
        string voterId; 
        string[] pollId;
        string[] votes;
    }

    enum PollType {
        PUBLIC,
        PRIVATE,
        METERED
    }

    // PollType public pollType;

    enum PollStatus {
        DRAFT,
        LIVE,
        CONDUCTED,
        DISCARDED
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
        int pollStartDate;
        int pollEndDate;
    }

    User[] users;
    Poll[] demoPolls;
    PollTime[] demoPollTimes;
    // Rights[] rights;
    // Option[] options;
    mapping(address => User[1]) public usersMap;
    mapping(string => address) public hostIdMap;
    mapping(string => address) public voterIdMap;

    // pollId to Poll
    mapping(string => Poll) public pollsMap;
    // host account address => list of polls created by host
    mapping(address => string[]) public polls;
    // poll id => host's account address
    mapping(string => address) public pollIdMap;
    // user => fetch the schedule for the poll
    mapping(string => PollTime) public pollTimesMap;
    // poll id => options Ids for the poll
    mapping(string => string[]) public optionIdMap;
    // option id (oid) => Option
    mapping(string => Option) public optionMap;
    // debug vars start
    // debug vars end

    // utils variables start
    uint counter = 1;

    //utils variables end

    function findIdByAddress(
        address _user
    ) public view returns (UserId memory) {
        for (uint8 i = 0; i < users.length; i++) {
            if (users[i].walletAddress == _user) {
                return UserId(users[i].hostId, users[i].voterId, true);
            }
        }
        return UserId("null", "null", false);
    }

    function _checkUsersExistence(address _user) public view returns (bool) {
        for (uint8 i = 0; i < users.length; i++) {
            if (users[i].walletAddress == _user) {
                return true;
            }
        }
        return false;
    }

    function _getSlice(
        uint256 begin,
        uint256 end,
        string memory text
    ) public pure returns (string memory) {
        bytes memory a = new bytes(end - begin + 1);
        for (uint i = 0; i <= end - begin; i++) {
            a[i] = bytes(text)[i + begin - 1];
        }
        return string(a);
    }

    function _validatePollId(string memory _pid) internal view returns (bool) {
        if (
            keccak256(bytes(this._getSlice(0, 2, _pid))) ==
            keccak256(bytes("pid"))
        ) {
            return true;
        }
        return false;
    }

    function _validateUserId(string memory _uid) internal view returns (bool) {
        if (
            keccak256(bytes(this._getSlice(0, 2, _uid))) ==
            keccak256(bytes("hst"))
        ) {
            return true;
        }
        return false;
    }

    function _verifySIG(
        address _user,
        bytes32 _hash,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) private pure returns (bool) {
        return
            bool(
                ecrecover(
                    keccak256(
                        abi.encodePacked(
                            "\x19Ethereum Signed Message:\n32",
                            _hash
                        )
                    ),
                    _v,
                    _r,
                    _s
                ) == _user
            );
    }

    function _validateVoterId(string memory _vid) internal view returns (bool) {
        if (
            keccak256(bytes(this._getSlice(0, 2, _vid))) ==
            keccak256(bytes("vtr"))
        ) {
            return true;
        }
        return false;
    }

    function _random(uint number) public returns (uint) {
        counter++;
        return
            uint(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender,
                        counter
                    )
                )
            ) % number;
    }

    function _randomString(uint size) public returns (string memory) {
        bytes memory randomWord = new bytes(size);
        // since we have 26 letters
        bytes memory chars = new bytes(36);
        chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (uint i = 0; i < size; i++) {
            uint randomNumber = _random(36);
            randomWord[i] = chars[randomNumber];
        }
        return string(randomWord);
    }

    function _generateId(string memory _prefix) public returns (string memory) {
        return string(abi.encodePacked(_prefix, _randomString(13)));
    }

    function _createUser(address _user) public returns (bool) {
        string memory _hostId = _generateId("hst");
        string memory _voterId = _generateId("vtr");
        string[] memory placeholderArr;
        hostIdMap[_hostId] = _user;
        voterIdMap[_voterId] = _user;
        users.push(
            User(_user, _hostId, _voterId, placeholderArr, placeholderArr)
        );
        usersMap[_user][0] = User(
            _user,
            _hostId,
            _voterId,
            placeholderArr,
            placeholderArr
        );
        return true;
    }

    // function createPoll(string memory _pollName, string memory _pollDescription,string memory _pollType, address _tokenAddr, uint _tokenAmount, bool _customStartDate, bool _customEndDate, uint _pollStartDate, uint _pollEndDate, address _user, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) public returns(bool) {
    event evCreatePoll(string _pollId);
    function createPoll(
        Poll memory poll,
        PollTime memory pollTime,
        address _user,
        uint _nonce,
        bytes32 _hash,
        bytes memory _signature,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) public payable returns (string memory) {
        if (!_checkUsersExistence(_user)) {
            _createUser(_user);
        }
        require(_checkUsersExistence(_user), "User does not exist");
        require(_verifySIG(_user, _hash, _r, _s, _v), "Invalid Signature");
        poll.pollId = _generateId("pid");
        pollTime.pollId = poll.pollId;
        poll.hostId = findIdByAddress(_user).hostId;
        string[] memory option;
        poll.options = option;
        address defAddr = 0x0000000000000000000000000000000000000000;
        if (poll.tokenAmount != 0 && poll.tokenContractAddress != defAddr) {
            poll.pollType = PollType.METERED;
        } else if (poll.addressList[0] != defAddr) {
            poll.pollType = PollType.PRIVATE;
        } else {
            poll.pollType = PollType.PUBLIC;
        }

        pollsMap[poll.pollId] = Poll(
            poll.pollId,
            poll.pollName,
            poll.pollDescription,
            poll.pollType,
            PollStatus.DRAFT,
            poll.hostId,
            poll.walletAddress,
            poll.addressList,
            poll.tokenContractAddress,
            poll.tokenAmount,
            poll.options
        );
        polls[_user].push(poll.pollId);
        demoPolls.push(poll);
        pollTimesMap[poll.pollId] = PollTime(
            pollTime.pollId,
            pollTime.customStartDate,
            pollTime.customEndDate,
            pollTime.pollStartDate,
            pollTime.pollEndDate
        );
        demoPollTimes.push(pollTimesMap[poll.pollId]);
        pollIdMap[poll.pollId] = _user;
        emit evCreatePoll(poll.pollId);
        return poll.pollId;
    }

    function getPollsFromUser(
        address _user
    ) public view returns (Poll[] memory) {
        uint arrlen = polls[_user].length;
        Poll[] memory _pollList = new Poll[](arrlen);
        for (uint8 i = 0; i < polls[_user].length; i++) {
            _pollList[i] = pollsMap[polls[_user][i]];
        }
        return _pollList;
    }

    function getPollTimesFromUser(
        address _user
    ) public view returns (PollTime[] memory) {
        uint arrlen = polls[_user].length;
        PollTime[] memory _pollTimeList = new PollTime[](arrlen);
        for (uint8 i = 0; i < polls[_user].length; i++) {
            _pollTimeList[i] = pollTimesMap[polls[_user][i]];
        }
        return _pollTimeList;
    }

    function isPollLive(string memory _pid) public returns (bool) {
        checkPollValidity(_pid);
        if(pollsMap[_pid].pollStatus== PollStatus.LIVE) {
            return true;
        }
        return false;
    }

    // no need for event emitter as we only are only reading
    function fetchPollOptions(
        string memory _pid
    ) public view returns (Option[] memory) {
        require(pollIdMap[_pid] != address(0), "No Poll Found");
        require(keccak256(abi.encodePacked(pollsMap[_pid].pollId)) != keccak256(abi.encodePacked("")), "Poll not Found!");
        require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
        uint arrlen = optionIdMap[_pid].length;
        Option[] memory _optionList = new Option[](arrlen);
        for (uint8 i = 0; i < optionIdMap[_pid].length; i++) {
            if (keccak256(abi.encodePacked(optionMap[optionIdMap[_pid][i]].optionId)) != keccak256(abi.encodePacked(""))) {
                _optionList[i] = optionMap[optionIdMap[_pid][i]];}
        }
        return _optionList;
    }

    event evAddPollOption(bool added);

//WORKING
    function addPollOption(
        Option memory _option,
        bytes32 _hash,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) public returns (bool) {
        require(pollIdMap[_option.pollId] != address(0), "No Poll Found");
        require(pollIdMap[_option.pollId] == msg.sender, "User Not Authenticated");
        require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
        _option.optionId = _generateId("oid");
        optionIdMap[_option.pollId].push(_option.optionId);
        optionMap[_option.optionId] = _option;
        pollsMap[_option.pollId].options.push(_option.optionId);
        emit evAddPollOption(true);
        return true;
    }

    function fetchOptionById(string memory _pid, string memory _oid) public view returns (Option memory) {
        require(pollIdMap[_pid] != address(0), "No Poll Found");
        require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
        require(keccak256(abi.encodePacked(optionMap[_oid].optionId)) != keccak256(abi.encodePacked("")), "No Option Found");

        return optionMap[_oid];
    }

    event evRemovePollOptions(bool deleted);

    function removePollOptions(
        string memory _pid,
        string memory _oid,
        bytes32 _hash,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) public returns (bool) {
        require(pollIdMap[_pid] != address(0), "No Poll Found");
        require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
        require(optionIdMap[_pid].length != 0, "No options found");
        require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
        require(
            keccak256(abi.encodePacked((optionMap[_oid].optionName))) !=
                keccak256(abi.encodePacked("")),
            "Option does not exists"
        );
        bytes32 oidHash = keccak256(bytes(optionMap[_oid].optionId));
        bytes32 targetHash = keccak256(bytes(_oid));
        if (oidHash == targetHash) {
            delete optionMap[_oid];
            // to remove from mapping  (pollid -> list of options)
            for (uint8 i = 0; i < optionIdMap[_pid].length; i++) {
                if (
                    keccak256(abi.encodePacked(optionIdMap[_pid][i])) ==
                    keccak256(abi.encodePacked(_oid))
                ) {
                    if (i <  optionIdMap[_pid].length) {
                       optionIdMap[_pid][i] = optionIdMap[_pid][ optionIdMap[_pid].length - 1];
                    }
                    optionIdMap[_pid].pop();
                }
            }
            // to remove from POLL struct
             for (uint8 i = 0; i < pollsMap[_pid].options.length; i++) {
                if (
                    keccak256(abi.encodePacked( pollsMap[_pid].options[i])) ==
                    keccak256(abi.encodePacked(_oid))
                ) {
                    if (i <   pollsMap[_pid].options.length) {
                        pollsMap[_pid].options[i] =  pollsMap[_pid].options[ pollsMap[_pid].options.length - 1];
                    }
                     pollsMap[_pid].options.pop();
                    // delete  pollsMap[_pid].options[i];
                }
            }
            emit evRemovePollOptions(true);
            return true;
        }
        emit evRemovePollOptions(false);
        return false;
    }

    function checkPollValidity (string memory _pid) private returns(bool) {
        if (pollTimesMap[_pid].customStartDate && pollsMap[_pid].pollStatus == PollStatus.DRAFT) {
            if((pollTimesMap[_pid].pollStartDate/1000) < int(block.timestamp)) {
                pollsMap[_pid].pollStatus = PollStatus.LIVE;
            }
        }

          if (pollTimesMap[_pid].customEndDate && (pollsMap[_pid].pollStatus == PollStatus.LIVE || pollsMap[_pid].pollStatus == PollStatus.DRAFT)) {
            if((pollTimesMap[_pid].pollEndDate/1000) < int(block.timestamp)) {
                pollsMap[_pid].pollStatus = PollStatus.CONDUCTED;
            }
        }

        return true;
    }

    event evModifyPollOption(bool deleted);


    
    function modifyPollOption(
        string memory _pid,
        Option memory _option,
        bytes32 _hash,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) public returns (bool) {
        checkPollValidity(_pid);
        require(pollIdMap[_pid] != address(0), "No Poll Found");
        require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
        require(optionIdMap[_pid].length != 0, "No options found");
        require(
            keccak256(abi.encodePacked((_option.optionName))) !=
                keccak256(abi.encodePacked("")),
            "Option does not exists"
        );
        require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
        bytes32 oidHash = keccak256(
            bytes(optionMap[_option.optionId].optionId)
        );
        bytes32 targetHash = keccak256(bytes(_option.optionId));
        if (oidHash == targetHash) {
            optionMap[_option.optionId] = _option;
            emit evModifyPollOption(true);
            return true;
        }
        emit evModifyPollOption(false);
        return false;
    }

    // function getca() public view returns (address) {
    //     return msg.sender;
    // }
    function getUserDetails() public view returns (User[1] memory) {
        return usersMap[address(msg.sender)];
    }

    function getPollDetails(string memory _pid) public returns (Poll memory) {
        checkPollValidity(_pid);
        require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
        require(keccak256(abi.encodePacked(pollsMap[_pid].pollId)) != keccak256(abi.encodePacked("")), "Poll not Found!");
        Poll memory _poll = pollsMap[_pid];

        if (pollTimesMap[_pid].customEndDate) {
            if (!(int(block.timestamp) < pollTimesMap[_pid].pollEndDate)) {
                if (_poll.pollStatus == PollStatus.LIVE) {
                    _poll.pollStatus = PollStatus.CONDUCTED;
                }
            }
        }

        if(pollTimesMap[_pid].customStartDate && _poll.pollStatus == PollStatus.DRAFT) {
            if(pollTimesMap[_pid].pollStartDate < int(block.timestamp)) {
                _poll.pollStatus = PollStatus.LIVE;
            }
        }

        return _poll;
    }

    event evUpdatePoll(bool successfull);

    function updatePoll(
        Poll memory _poll,
        bytes32 _hash,
        bytes memory _signature,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) public returns (bool) {
        checkPollValidity(_poll.pollId);
        require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
        if (
            pollsMap[_poll.pollId].pollStatus == PollStatus.DISCARDED ||
            pollsMap[_poll.pollId].pollStatus == PollStatus.CONDUCTED
        ) {
            emit evUpdatePoll(false);
            return false;
        }
        pollsMap[_poll.pollId] = _poll;
        emit evUpdatePoll(true);
        return true;
    }

    event evUpdatePollStatus(bool successfull);

    function updatePollStatus(
        string memory _pid,
        PollStatus _pollStatus,
        bytes32 _hash,
        bytes memory _signature,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) public returns (bool) {
        checkPollValidity(_pid);
        require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
        if(pollsMap[_pid].pollStatus == PollStatus.DISCARDED) {
            emit evUpdatePollStatus(false);
            return false;
        }
        if(_pollStatus == PollStatus.DISCARDED) {
             delete pollsMap[_pid];
             delete pollTimesMap[_pid];
             pollIdMap[_pid] = address(0x0);
             for (uint8 c = 0; c < polls[msg.sender].length;c++) {
                
                if (keccak256(abi.encodePacked(polls[msg.sender][c])) == keccak256(abi.encodePacked(_pid))) {
                    if (c < polls[msg.sender].length) {
                        polls[msg.sender][c] = polls[msg.sender][polls[msg.sender].length-1];
                    }
                    polls[msg.sender].pop();
                }
             }
        } else {
            pollsMap[_pid].pollStatus = _pollStatus;
        }
        
        emit evUpdatePollStatus(true);
        return true;
    }

    // event evModifyPollOption2(string deleted);

    //     function checkBal(address _adr) public returns (string memory) {
    //         address _tokenAddr = _adr;
    //         IERC20Metadata _token = IERC20Metadata(_tokenAddr);
    //         bytes memory _lessTknErrMsg = abi.encodePacked(Strings.toString(_token.balanceOf(msg.sender)/(10**_token.decimals())), _token.symbol());
    //         string memory a = string(_lessTknErrMsg);
    //         emit evModifyPollOption2(a);
    //         return a;
    //     }

    // function getkBal(address  _tkaddr) public view returns (string memory) {
    //     address _tokenAddr = _tkaddr;
    //     IERC20 _token = IERC20(_tokenAddr);
    //     bytes memory _lessTknErrMsg = abi.encodePacked("You have:  $", _token.get());
    //     return string(_lessTknErrMsg);
    // }

    function getPollTimeDetails(
        string memory _pid
    ) public view returns (PollTime memory) {
        require(keccak256(abi.encodePacked(pollsMap[_pid].pollId)) != keccak256(abi.encodePacked("")), "Poll not Found!");
        return pollTimesMap[_pid];
    }

    event evCastVote(Vote addedVote, address castedBy, bool wasSuccessful);

    function castVote(
        string memory _pid,
        string memory _oid,
        bytes32 _hash,
        bytes32 _r,
        bytes32 _s,
        uint8 _v
    ) public returns (bool) {
        if (!_checkUsersExistence(msg.sender)) {
            _createUser(msg.sender);
        }
        require(_checkUsersExistence(msg.sender), "User does not exist");
        require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
        require(pollIdMap[_pid] != address(0), "No Poll Found");
        require(
            pollsMap[_pid].pollStatus != PollStatus.DISCARDED,
            "Poll is DELETED"
        );
        require(
            pollsMap[_pid].pollStatus != PollStatus.CONDUCTED,
            "Poll has ENDED"
        );
        require(
            pollsMap[_pid].pollStatus == PollStatus.LIVE,
            "Voting has not started for this poll"
        );

        if (pollTimesMap[_pid].customStartDate) {
            require(
                int(block.timestamp) > pollTimesMap[_pid].pollStartDate,
                "Poll has not started yet!"
            );
        }

        if (pollTimesMap[_pid].customEndDate) {
            if (!(int(block.timestamp) < pollTimesMap[_pid].pollEndDate)) {
                if (pollsMap[_pid].pollStatus == PollStatus.LIVE) {
                    pollsMap[_pid].pollStatus = PollStatus.CONDUCTED;
                }
            }
            require(
                int(block.timestamp) < pollTimesMap[_pid].pollEndDate,
                "Poll has ended"
            );
        }

        if (
            pollsMap[_pid].pollType == PollType.PRIVATE ||
            pollsMap[_pid].pollType == PollType.METERED
        ) {
            bool _authorized = false;
            for (uint8 i = 0; i < pollsMap[_pid].addressList.length; i++) {
                if (pollsMap[_pid].addressList[i] == msg.sender) {
                    _authorized = true;
                    break;
                }
            }
            require(_authorized, "User is not authorized to vote");

            if (pollsMap[_pid].pollType == PollType.PRIVATE) {
                IERC20Metadata _token = IERC20Metadata(
                    pollsMap[_pid].tokenContractAddress
                );
                bytes memory _lessTknErrMsg = abi.encodePacked(
                    "You do not possess enough $",
                    _token.symbol()
                );
                require(
                    (_token.balanceOf(msg.sender) / (1 ether)) >=
                        pollsMap[_pid].tokenAmount,
                    string(_lessTknErrMsg)
                );
            }
        }

        bool _hasUserAlreadyVoted = false;
        for (uint8 i = 0; i < user2voteMap[msg.sender].length; i++) {
            if (
                keccak256(
                    abi.encodePacked(
                        globalVoteMap[user2voteMap[msg.sender][i]].pollId
                    )
                ) == keccak256(abi.encodePacked(_pid))
            ) {
                _hasUserAlreadyVoted = true;
                break;
            }
        }
        require(
            !_hasUserAlreadyVoted,
            "You have already casted a vote for this poll"
        );

        string memory _vid = _generateId("vid");

        globalVoteMap[_vid] = Vote(_vid, _pid, msg.sender, _oid);
        poll2voteMap[_pid].push(_vid);
        user2voteMap[msg.sender].push(_vid);
        emit evCastVote(globalVoteMap[_vid], msg.sender, true);
        return true;
    }
}
// pragma solidity ^0.8.0;

// import "./IERC20.sol";

// contract Voting {
//     struct UserId {
//         string hostId;
//         string voterId;
//         bool found;
//     }

//     struct Vote {
//         string voteId;
//         string pollId;
//         address userId;
//         string optionId;
//     }

//     // vid => Vote {}
//     mapping(string => Vote) public globalVoteMap;
//     // pollId -> string[vid]
//     mapping(string => string[]) public poll2voteMap;
//     // userId -> string[vid]
//     mapping(address => string[]) public user2voteMap;

//     struct Option {
//         string optionId; // opt prefix with random string
//         string optionName; // gifu
//         bool isUser; // gifu get it from user andif user
//         address optionAddress; // gifu if user is true thn ; default 0x000 | walletAdress of the Candidate
//         string imageUrl; // gifu if true store the url else store "N/A"
//         uint stakeAmount; // gifu and if poll type is metered else 0.0
//         address tokenAddress; // gifu and if poll type is metered else 0x0000
//         uint votePrice; // 1 vote will cost 5 rights??
//         string optionMessage; // gifu just for bystand; the political party's message
//         string hostId; // the hostId of the poll Host
//     }

//     struct User {
//         address walletAddress;
//         string hostId;
//         string voterId;
//         string[] pollId;
//         string[] votes;
//     }

//     enum PollType {
//         PUBLIC,
//         PRIVATE,
//         METERED
//     }

//     // PollType public pollType;

//     enum PollStatus {
//         DRAFT,
//         LIVE,
//         CONDUCTED,
//         DISCARDED
//     }

//     struct Poll {
//         string pollId;
//         string pollName;
//         string pollDescription;
//         PollType pollType;
//         PollStatus pollStatus;
//         string hostId;
//         address walletAddress;
//         address[] addressList;
//         address tokenContractAddress;
//         uint tokenAmount;
//         string[] options;
//     }

//     struct PollTime {
//         string pollId;
//         bool customStartDate;
//         bool customEndDate;
//         int pollStartDate;
//         int pollEndDate;
//     }

//     User[] users;
//     Poll[] demoPolls;
//     PollTime[] demoPollTimes;
//     // Rights[] rights;
//     // Option[] options;
//     mapping(address => User[1]) public usersMap;
//     mapping(string => address) public hostIdMap;
//     mapping(string => address) public voterIdMap;

//     // pollId to Poll
//     mapping(string => Poll) public pollsMap;
//     // host account address => list of polls created by host
//     mapping(address => string[]) public polls;
//     // poll id => host's account address
//     mapping(string => address) public pollIdMap;
//     // user => fetch the schedule for the poll
//     mapping(string => PollTime) public pollTimesMap;
//     // poll id => options Ids for the poll
//     mapping(string => string[]) public optionIdMap;
//     // option id (oid) => Option
//     mapping(string => Option) public  optionMap;
//     // debug vars start
//     // debug vars end

//     // utils variables start
//     uint counter = 1;

//     //utils variables end

//     function findIdByAddress(
//         address _user
//     ) public view returns (UserId memory) {
//         for (uint8 i = 0; i < users.length; i++) {
//             if (users[i].walletAddress == _user) {
//                 return UserId(users[i].hostId, users[i].voterId, true);
//             }
//         }
//         return UserId("null", "null", false);
//     }

//     function _checkUsersExistence(address _user) public view returns (bool) {
//         for (uint8 i = 0; i < users.length; i++) {
//             if (users[i].walletAddress == _user) {
//                 return true;
//             }
//         }
//         return false;
//     }

//     function _getSlice(
//         uint256 begin,
//         uint256 end,
//         string memory text
//     ) public pure returns (string memory) {
//         bytes memory a = new bytes(end - begin + 1);
//         for (uint i = 0; i <= end - begin; i++) {
//             a[i] = bytes(text)[i + begin - 1];
//         }
//         return string(a);
//     }

//     function _validatePollId(string memory _pid) internal view returns (bool) {
//         if (
//             keccak256(bytes(this._getSlice(0, 2, _pid))) ==
//             keccak256(bytes("pid"))
//         ) {
//             return true;
//         }
//         return false;
//     }

//     function _validateUserId(string memory _uid) internal view returns (bool) {
//         if (
//             keccak256(bytes(this._getSlice(0, 2, _uid))) ==
//             keccak256(bytes("hst"))
//         ) {
//             return true;
//         }
//         return false;
//     }

//     function _verifySIG(
//         address _user,
//         bytes32 _hash,
//         bytes32 _r,
//         bytes32 _s,
//         uint8 _v
//     ) private pure returns (bool) {
//         return
//             bool(
//                 ecrecover(
//                     keccak256(
//                         abi.encodePacked(
//                             "\x19Ethereum Signed Message:\n32",
//                             _hash
//                         )
//                     ),
//                     _v,
//                     _r,
//                     _s
//                 ) == _user
//             );
//     }

//     function _validateVoterId(string memory _vid) internal view returns (bool) {
//         if (
//             keccak256(bytes(this._getSlice(0, 2, _vid))) ==
//             keccak256(bytes("vtr"))
//         ) {
//             return true;
//         }
//         return false;
//     }

//     function _random(uint number) public returns (uint) {
//         counter++;
//         return
//             uint(
//                 keccak256(
//                     abi.encodePacked(
//                         block.timestamp,
//                         block.prevrandao,
//                         msg.sender,
//                         counter
//                     )
//                 )
//             ) % number;
//     }

//     function _randomString(uint size) public returns (string memory) {
//         bytes memory randomWord = new bytes(size);
//         // since we have 26 letters
//         bytes memory chars = new bytes(36);
//         chars = "abcdefghijklmnopqrstuvwxyz0123456789";
//         for (uint i = 0; i < size; i++) {
//             uint randomNumber = _random(36);
//             randomWord[i] = chars[randomNumber];
//         }
//         return string(randomWord);
//     }

//     function _generateId(string memory _prefix) public returns (string memory) {
//         return string(abi.encodePacked(_prefix, _randomString(13)));
//     }

//     function _createUser(address _user) public returns (bool) {
//         string memory _hostId = _generateId("hst");
//         string memory _voterId = _generateId("vtr");
//         string[] memory placeholderArr;
//         hostIdMap[_hostId] = _user;
//         voterIdMap[_voterId] = _user;
//         users.push(
//             User(_user, _hostId, _voterId, placeholderArr, placeholderArr)
//         );
//         usersMap[_user][0] = User(
//             _user,
//             _hostId,
//             _voterId,
//             placeholderArr,
//             placeholderArr
//         );
//         return true;
//     }

//     // function createPoll(string memory _pollName, string memory _pollDescription,string memory _pollType, address _tokenAddr, uint _tokenAmount, bool _customStartDate, bool _customEndDate, uint _pollStartDate, uint _pollEndDate, address _user, uint _nonce, uint8 _v, bytes32 _r, bytes32 _s) public returns(bool) {
//     event evCreatePoll(string _pollId);

//     function createPoll(
//         Poll memory poll,
//         PollTime memory pollTime,
//         address _user,
//         uint _nonce,
//         bytes32 _hash,
//         bytes memory _signature,
//         bytes32 _r,
//         bytes32 _s,
//         uint8 _v
//     ) public payable returns (string memory) {
//         if (!_checkUsersExistence(_user)) {
//             _createUser(_user);
//         }
//         require(_checkUsersExistence(_user), "User does not exist");
//         require(_verifySIG(_user, _hash, _r, _s, _v), "Invalid Signature");
//         poll.pollId = _generateId("pid");
//         pollTime.pollId = poll.pollId;
//         poll.hostId = findIdByAddress(_user).hostId;
//         string[] memory option;
//         poll.options = option;
//         address defAddr = 0x0000000000000000000000000000000000000000;
//         if (poll.tokenAmount != 0 && poll.tokenContractAddress != defAddr) {
//             poll.pollType = PollType.METERED;
//         } else if (poll.addressList[0] != defAddr) {
//             poll.pollType = PollType.PRIVATE;
//         } else {
//             poll.pollType = PollType.PUBLIC;
//         }
//         pollsMap[poll.pollId] = Poll(
//             poll.pollId,
//             poll.pollName,
//             poll.pollDescription,
//             poll.pollType,
//             PollStatus.DRAFT,
//             poll.hostId,
//             poll.walletAddress,
//             poll.addressList,
//             poll.tokenContractAddress,
//             poll.tokenAmount,
//             poll.options
//         );
//         polls[_user].push(poll.pollId);
//         demoPolls.push(poll);
//         pollTimesMap[poll.pollId] = PollTime(
//             pollTime.pollId,
//             pollTime.customStartDate,
//             pollTime.customEndDate,
//             pollTime.pollStartDate,
//             pollTime.pollEndDate
//         );
//         demoPollTimes.push(pollTimesMap[poll.pollId]);
//         pollIdMap[poll.pollId] = _user;
//         emit evCreatePoll(poll.pollId);
//         return poll.pollId;
//     }

//     function getPollsFromUser(
//         address _user
//     ) public view returns (Poll[] memory) {
//         uint arrlen = polls[_user].length;
//         Poll[] memory _pollList = new Poll[](arrlen);
//         for (uint8 i = 0; i < polls[_user].length; i++) {
//             _pollList[i] = pollsMap[polls[_user][i]];
//         }
//         return _pollList;
//     }

//     function getPollTimesFromUser(
//         address _user
//     ) public view returns (PollTime[] memory) {
//         uint arrlen = polls[_user].length;
//         PollTime[] memory _pollTimeList = new PollTime[](arrlen);
//         for (uint8 i = 0; i < polls[_user].length; i++) {
//             _pollTimeList[i] = pollTimesMap[polls[_user][i]];
//         }
//         return _pollTimeList;
//     }

//     // no need for event emitter as we only are only reading
//     function fetchPollOptions(
//         string memory _pid
//     ) public view returns (Option[] memory) {
//         require(pollIdMap[_pid] != address(0), "No Poll Found");
//         require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
//         uint arrlen = optionIdMap[_pid].length;
//         Option[] memory _optionList = new Option[](arrlen);
//         for (uint8 i = 0; i < optionIdMap[_pid].length; i++) {
//             _optionList[i] = optionMap[optionIdMap[_pid][i]];
//         }
//         return _optionList;
//     }

//     event evAddPollOption(bool added);

//     function addPollOption(
//         string memory _pid,
//         Option memory _option,
//         bytes32 _hash,
//         bytes32 _r,
//         bytes32 _s,
//         uint8 _v
//     ) public returns (bool) {
//         require(pollIdMap[_pid] != address(0), "No Poll Found");
//         require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
//         require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
//         _option.optionId = _generateId("oid");

//         optionIdMap[_pid].push(_option.optionId);
//         optionMap[_option.optionId] = _option;
//         emit evAddPollOption(true);
//         return true;
//     }

//     event evRemovePollOptions(bool deleted);

//     function removePollOptions(
//         string memory _pid,
//         string memory _oid,
//         bytes32 _hash,
//         bytes32 _r,
//         bytes32 _s,
//         uint8 _v
//     ) public returns (bool) {
//         require(pollIdMap[_pid] != address(0), "No Poll Found");
//         require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
//         require(optionIdMap[_pid].length != 0, "No options found");
//         require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
//         require(keccak256(abi.encodePacked((optionMap[_oid].optionName))) != keccak256(abi.encodePacked("")), "Option does not exists");
//         bytes32 oidHash = keccak256(bytes(optionMap[_oid].optionId));
//         bytes32 targetHash = keccak256(bytes(_oid));
//         if (oidHash == targetHash) {
//             delete optionMap[_oid];
//             for (uint8 i = 0; i < optionIdMap[_pid].length; i++) {
//                 if (keccak256(abi.encodePacked(optionIdMap[_pid][i])) == keccak256(abi.encodePacked(_oid))) {
//                     delete optionIdMap[_pid][i];
//                 }
//             }
//             emit evRemovePollOptions(true);
//             return true;
//         }
//         emit evRemovePollOptions(false);
//         return false;
//     }

//     event evModifyPollOption(bool deleted);

//     function modifyPollOption(
//         string memory _pid,
//         Option memory _option,
//         bytes32 _hash,
//         bytes32 _r,
//         bytes32 _s,
//         uint8 _v
//     ) public returns (bool) {
//         require(pollIdMap[_pid] != address(0), "No Poll Found");
//         require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
//         require(optionIdMap[_pid].length != 0, "No options found");
//         require(keccak256(abi.encodePacked((_option.optionName))) != keccak256(abi.encodePacked("")), "Option does not exists");
//         require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
//         bytes32 oidHash = keccak256(bytes(optionMap[_option.optionId].optionId));
//         bytes32 targetHash = keccak256(bytes(_option.optionId));
//         if (oidHash == targetHash) {
//             optionMap[_option.optionId] = _option;
//             emit evModifyPollOption(true);
//             return true;
//         }
//         emit evModifyPollOption(false);
//         return false;
//     }

//     // function getca() public view returns (address) {
//     //     return msg.sender;
//     // }
//     function getUserDetails() public view returns (User[1] memory) {
//         return usersMap[address(msg.sender)];
//     }

//     function getPollDetails(
//         string memory _pid
//     ) public returns (Poll memory) {
//         if (pollTimesMap[_pid].customEndDate) {
//             if(!(int(block.timestamp) < pollTimesMap[_pid].pollEndDate)) {
//                 if(pollsMap[_pid].pollStatus == PollStatus.LIVE) {
//                     pollsMap[_pid].pollStatus = PollStatus.CONDUCTED;
//                 }
//             }
//         }
//         return pollsMap[_pid];
//     }

//     // function checkBal() public view returns (string memory) {
//     //     address _tokenAddr = 0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0;
//     //     IERC20 _token = IERC20(_tokenAddr);
//     //     bytes memory _lessTknErrMsg = abi.encodePacked("You do not possess enough $", _token.symbol());
//     //     return string(_lessTknErrMsg);
//     // }

//     function getPollTimeDetails(
//         string memory _pid
//     ) public view returns (PollTime memory) {
//         return pollTimesMap[_pid];
//     }

//     event evCastVote(Vote addedVote, address castedBy, bool wasSuccessful);
//     function castVote(string memory _pid, string memory _oid, bytes32 _hash, bytes32 _r, bytes32 _s, uint8 _v) public returns (bool){
//         if (!_checkUsersExistence(msg.sender)) {
//             _createUser(msg.sender);
//         }
//         require(_checkUsersExistence(msg.sender), "User does not exist");
//         require(_verifySIG(msg.sender, _hash, _r, _s, _v), "Invalid Signature");
//         require(pollIdMap[_pid] != address(0), "No Poll Found");
//         require(pollsMap[_pid].pollStatus != PollStatus.DISCARDED, "Poll is DELETED");
//         require(pollsMap[_pid].pollStatus != PollStatus.CONDUCTED, "Poll has ENDED");
//         require(pollsMap[_pid].pollStatus == PollStatus.LIVE, "Voting has not started for this poll");

//         if (pollTimesMap[_pid].customStartDate) {
//             require(int(block.timestamp) > pollTimesMap[_pid].pollStartDate, "Poll has not started yet!");
//         }

//         if (pollTimesMap[_pid].customEndDate) {
//             if(!(int(block.timestamp) < pollTimesMap[_pid].pollEndDate)) {
//                 if(pollsMap[_pid].pollStatus == PollStatus.LIVE) {
//                     pollsMap[_pid].pollStatus = PollStatus.CONDUCTED;
//                 }
//             }
//             require(int(block.timestamp) < pollTimesMap[_pid].pollEndDate, "Poll has ended");
//         }

//         if (pollsMap[_pid].pollType == PollType.PRIVATE || pollsMap[_pid].pollType == PollType.METERED) {
//             bool _authorized = false;
//             for (uint8 i = 0; i < pollsMap[_pid].addressList.length; i++) {
//                 if( pollsMap[_pid].addressList[i] == msg.sender ) {
//                     _authorized = true;
//                     break;
//                 }
//             }
//             require(_authorized, "User is not authorized to vote");

//             if (pollsMap[_pid].pollType == PollType.METERED) {
//                 IERC20 _token = IERC20(pollsMap[_pid].tokenContractAddress);
//                 bytes memory _lessTknErrMsg = abi.encodePacked("You do not possess enough $", _token.symbol());
//                 require((_token.balanceOf(msg.sender) / (1 ether)) >= pollsMap[_pid].tokenAmount, string(_lessTknErrMsg));
//             }
//         }

//         bool _hasUserAlreadyVoted = false;
//         for (uint8 i = 0; i < user2voteMap[msg.sender].length; i++){
//             if(keccak256(abi.encodePacked(globalVoteMap[user2voteMap[msg.sender][i]].pollId)) == keccak256(abi.encodePacked(_pid))) {
//                 _hasUserAlreadyVoted = true;
//                 break;
//             }
//         }
//         require(!_hasUserAlreadyVoted, "You have already casted a vote for this poll");
//         string memory _vid = _generateId("vid");

//         globalVoteMap[_vid] = Vote(_vid, _pid, msg.sender, _oid);
//         poll2voteMap[_pid].push(_vid);
//         user2voteMap[msg.sender].push(_vid);
//         emit evCastVote(globalVoteMap[_vid], msg.sender, true);
//         return true;
//     }
// }
