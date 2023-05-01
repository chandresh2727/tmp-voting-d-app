// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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

    // a lot of possibilities here, like option image, different cost for different option, etc
    struct Option {
        string pollId;
        string optionId;
        string optionName;
        string optionDescription;
        uint8 voteCount;
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

    // needed to created separate struct because of 16 parameter limit
    struct PollTime {
        string pollId;
        bool customStartDate;
        bool customEndDate;
        int pollStartDate;
        int pollEndDate;
    }

    User[] users; // users array

    // I could've used more mappings to avoid using forloops in new functions, but it was getting complicated
    // msg.sender => User[]
    mapping(address => User[1]) public usersMap;

    // hostID and voterID is some nonsense which I came up in the early phase, servers no major purpose,
    // too lazy to rewrite entite code because of this, so ignore
    // host id string starting with "hst" maps to msg.msg.sender
    mapping(string => address) public hostIdMap;
    // host id string starting with "vtr" maps to msg.msg.sender
    mapping(string => address) public voterIdMap;

    // MAIN CORE COMPONENTS - could've spent some time renaming them like findPollByPIDMap() but lazy
    // poll id string starting with "pid" maps to a Poll
    mapping(string => Poll) public pollsMap;
    // msg.send => list of polls created by host (string array of poll ids)
    mapping(address => string[]) public polls;
    // poll id => msg.sender address (find the owner of the poll)
    mapping(string => address) public pollIdMap;
    // poll id string maps to poll time
    mapping(string => PollTime) public pollTimesMap;

    // poll id => options Ids for the poll
    mapping(string => string[]) public optionIdMap;
    // option id (oid) => Option
    mapping(string => Option) public optionMap;


    // vote id starting with vid maps to a vote
    mapping(string => Vote) public globalVoteMap;
    // gets all the votes [vote id string array] using poll id
    mapping(string => string[]) public poll2voteMap;
    // get all the votes by user
    mapping(address => string[]) public user2voteMap;



    // utils variables start, increses each time a random id gets generated, no logical sense, but it is what it is 
    uint counter = 1;

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


    // I was watching some anime while I was naming this function
    function _checkUsersExistence(address _user) public view returns (bool) {
        for (uint8 i = 0; i < users.length; i++) {
            if (users[i].walletAddress == _user) {
                return true;
            }
        }
        return false;
    }

    // copied from ethereum stackexchange obv
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


    // this function basically verifys the hash,r,s,v against the msg.sender / _user
    // I didn't knew about msg.sender while I was writing this section, and I'm lazy to remove this
    // additionally this verification system is pretty useless because the hacker just needs some random hash sent
    // from the target, and they can basically perform every action in their stead
    // prevention?: One can use random nonce with backend server to validate signature, so each signature even for the
    // same action could be different
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


    // generates random number
    function _random(uint number) private returns (uint) {
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

    // generates a random string based on random number
    function _randomString(uint size) private returns (string memory) {
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

    function _generateId(string memory _prefix) private returns (string memory) {
        return string(abi.encodePacked(_prefix, _randomString(13)));
    }

    function _createUser(address _user) private returns (bool) {
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
        
        // determine poll type
        address defAddr = address(0x0);
        if (poll.tokenAmount != 0 && poll.tokenContractAddress != defAddr) {
            poll.pollType = PollType.METERED;
        } else if (poll.addressList[0] != defAddr) {
            poll.pollType = PollType.PRIVATE;
        } else {
            poll.pollType = PollType.PUBLIC;
        }

        poll.pollStatus = PollStatus.DRAFT
        pollsMap[poll.pollId] = poll
        polls[_user].push(poll.pollId);
        pollTimesMap[poll.pollId] =pollTime;
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
        // require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
        uint arrlen = optionIdMap[_pid].length;
        Option[] memory _optionList = new Option[](arrlen);
        for (uint8 i = 0; i < optionIdMap[_pid].length; i++) {
            if (keccak256(abi.encodePacked(optionMap[optionIdMap[_pid][i]].optionId)) != keccak256(abi.encodePacked(""))) {
                _optionList[i] = optionMap[optionIdMap[_pid][i]];}
        }
        return _optionList;
    }

    event evAddPollOption(bool added);
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
        _option.voteCount = 0;
        _option.optionId = _generateId("oid");
        optionIdMap[_option.pollId].push(_option.optionId);
        optionMap[_option.optionId] = _option;
        pollsMap[_option.pollId].options.push(_option.optionId);
        emit evAddPollOption(true);
        return true;
    }

    function fetchOptionById(string memory _pid, string memory _oid) public view returns (Option memory) {
        require(pollIdMap[_pid] != address(0), "No Poll Found");
        // require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
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

    function getUserDetails() public view returns (User[1] memory) {
        return usersMap[address(msg.sender)];
    }

    // alternative to cron job, whenever a 'write' transaction occurs relating to a particular poll
    // this function updates the poll validity, 
    function checkPollValidity (string memory _pid) private returns(bool) {
        require(pollIdMap[_pid] != address(0x0), "No Poll Found");
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

    // this function compares the epoch timestamp sent by the user against the polltimes struct,
    // and sends the replica of the Poll with the updated PollStatus. it's an alternate/gimmick version 
    // of  checkPollValidity() as this doesn't require gas, additionally it makes this dapp unsecure,
    // if a user sends a timestamp of a future, they can caste a vote, even if the poll is not started
     function getVerifiedPoll(string memory _pid, int _currtime) public returns (Poll memory) {
        require(pollIdMap[_pid] != address(0x0), "No Poll Found");
        require(pollsMap[_pid].pollStatus != PollStatus.CONDUCTED, "Poll Has Ended!");
        require(pollsMap[_pid].pollStatus != PollStatus.DISCARDED, "No Poll Found!");

        Poll _tmpPoll = pollsMap[_pid]
        // if startdate is already passed
        if(pollTimesMap[_pid].customStartDate){
            if(_currtime > (pollTimesMap[_pid].pollStartDate/1000)) {
                _tmpPoll.pollStatus = PollStatus.LIVE;
            }
        }

        // if curent time is greater than end time
        if( pollTimesMap[_pid].customEndDate && ((pollTimesMap[_pid].pollEndDate/1000) < _currtime)) {
            _tmpPoll.pollStatus = PollStatus.CONDUCTED;
        }
        return _tmpPoll.pollStatus;
    }

    // using timestamp from the user's side to know the current UTC epoch time
    // block.timestamp returns the timestamp of the most recent block
    function getPollDetails(string memory _pid, int _currtime) public returns (Poll memory) {
        require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
        return getVerifiedPoll(_pid, _currtime);
    }

    function getPollDetailsForVoting(string memory _pid,  int _currtime) public returns (Poll memory) {
        Poll memory _tmpPoll = getVerifiedPoll(_pid, _currtime);

        // if it is private or metered then check if the user is on the list
         if(_tmpPoll.pollType != PollType.PUBLIC) {
            bool found = false;
            for(uint8 i = 0; i < _tmpPoll.addressList.length; i++) {
                if(msg.sender == _tmpPoll.addressList[i]) {
                    found = true;
                }
            }
            require(found, "You are not permitted to vote on this poll");
        }

        require(_tmpPoll.pollStatus != PollStatus.CONDUCTED, "Poll Has Ended!");
        require(_tmpPoll.pollStatus != PollStatus.DISCARDED, "No Poll Found!");
        require(_tmpPoll.pollStatus == PollStatus.LIVE, "Poll has not started yet");
        return _tmpPoll;
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
        require(pollIdMap[_poll.pollId] == msg.sender, "User Not Authenticated");
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
        require(pollIdMap[_pid] == msg.sender, "User Not Authenticated");
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

    function getPollTimeDetails(
        string memory _pid
    ) public view returns (PollTime memory) {
        require(keccak256(abi.encodePacked(pollsMap[_pid].pollId)) != keccak256(abi.encodePacked("")), "Poll not Found!");
        return pollTimesMap[_pid];
    }

    event evCastVote(Vote addedVote, address castedBy, bool wasSuccessful, string message);

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

            if (pollsMap[_pid].pollType == PollType.METERED) {
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

        require(!_hasUserAlreadyVoted,"You have already casted a vote for this poll");

        string memory _vid = _generateId("vid");
        optionMap[_oid].voteCount = (optionMap[_oid].voteCount +1);
        globalVoteMap[_vid] = Vote(_vid, _pid, msg.sender, _oid);
        poll2voteMap[_pid].push(_vid);
        user2voteMap[msg.sender].push(_vid);
        emit evCastVote(globalVoteMap[_vid], msg.sender, true, "success: vote has been casted");
        return true;
    }


    struct UserVote {
        bool hasVoted;
        Vote vote;
    }
    function getUserVote(string memory _pid) public view returns (UserVote memory) {
        bool _hasUserAlreadyVoted = false;
        Vote memory _vote = Vote("","",address(0x0),"");
        for (uint8 i = 0; i < user2voteMap[msg.sender].length; i++) {
            if (
                keccak256(
                    abi.encodePacked(
                        globalVoteMap[user2voteMap[msg.sender][i]].pollId
                    )
                ) == keccak256(abi.encodePacked(_pid))
            ) {
                _vote = globalVoteMap[user2voteMap[msg.sender][i]];
                _hasUserAlreadyVoted = true;
                break;
            }
        }
        return UserVote(_hasUserAlreadyVoted, _vote);
    }

    // gets poll results
    function getPollResults(string memory _pid,  int _currtime) public returns(Option[] memory) {
        require(pollIdMap[_pid] != address(0), "No Poll Found");      
        Poll memory _poll = getVerifiedPoll(_pid, _currtime);
        require(_poll.pollStatus == PollStatus.LIVE, "Poll has not begun yet");
        Option[] memory _options = new Option[]( pollsMap[_pid].options.length);
        for(uint256 indx = 0; indx < pollsMap[_pid].options.length; indx++) {
            _options[indx] = optionMap[ pollsMap[_pid].options[indx]];
        }
        return _options;
    }
}

// notes from the author:
// The main goal of the project was to learn solidity in chaotic way so the result was also chaotic haha
// And as to celebrate the completition of the MVP (yes MVP!! jk) I shall share one embarassing moment of the journey
// I spent 3 days scratching my head because I couldn't make a "write" transaction work in react but it was working with remix ,
//      later I discovered the gas popup was also not poping up, after some digging i found out I need to use .send()
//      method of web3js instead of call to make writable transactions. 
// see I was noob then, I still am but noob pro plus ultra max.
