const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("RockPaperScissors", function () {
  let rps;
  let owner, player1, player2, player3;
  const stake = ethers.parseEther("1.0"); // 1 ETH stake

  // Move enum values
  const Move = {
    None: 0,
    Rock: 1,
    Paper: 2,
    Scissors: 3
  };

  beforeEach(async function () {
    // Get signers
    [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy contract
    const RPS = await ethers.getContractFactory("RockPaperScissors");
    rps = await RPS.deploy();
  });

  describe("Game Creation", function () {
    it("Should create a game with valid parameters", async function () {
      const tx = await rps.connect(player1).createGame(player2.address, { value: stake });
      await expect(tx)
        .to.emit(rps, "GameCreated")
        .withArgs(0, player1.address, player2.address, stake);

      const game = await rps.getGame(0);
      expect(game.player1).to.equal(player1.address);
      expect(game.player2).to.equal(player2.address);
      expect(game.stake).to.equal(stake);
      expect(game.state).to.equal(0); // WaitingForPlayer2
    });

    it("Should reject game creation with zero stake", async function () {
      await expect(
        rps.connect(player1).createGame(player2.address, { value: 0 })
      ).to.be.revertedWithCustomError(rps, "InvalidStake");
    });

    it("Should reject game creation with self as opponent", async function () {
      await expect(
        rps.connect(player1).createGame(player1.address, { value: stake })
      ).to.be.revertedWithCustomError(rps, "Unauthorized");
    });

    it("Should reject game creation with zero address", async function () {
      await expect(
        rps.connect(player1).createGame(ethers.ZeroAddress, { value: stake })
      ).to.be.revertedWithCustomError(rps, "Unauthorized");
    });
  });

  describe("Joining Game", function () {
    beforeEach(async function () {
      await rps.connect(player1).createGame(player2.address, { value: stake });
    });

    it("Should allow player2 to join with correct stake", async function () {
      const tx = await rps.connect(player2).joinGame(0, { value: stake });
      await expect(tx)
        .to.emit(rps, "Player2Joined")
        .withArgs(0, player2.address);

      const game = await rps.getGame(0);
      expect(game.state).to.equal(1); // CommitPhase
    });

    it("Should reject join with wrong stake amount", async function () {
      await expect(
        rps.connect(player2).joinGame(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(rps, "InvalidStake");
    });

    it("Should reject join from wrong player", async function () {
      await expect(
        rps.connect(player3).joinGame(0, { value: stake })
      ).to.be.revertedWithCustomError(rps, "Unauthorized");
    });

    it("Should reject join on non-existent game", async function () {
      await expect(
        rps.connect(player2).joinGame(999, { value: stake })
      ).to.be.revertedWithCustomError(rps, "GameNotFound");
    });
  });

  describe("Commit Phase", function () {
    let commit1, commit2;
    const secret1 = "mySecret123";
    const secret2 = "anotherSecret456";

    beforeEach(async function () {
      // Create and join game
      await rps.connect(player1).createGame(player2.address, { value: stake });
      await rps.connect(player2).joinGame(0, { value: stake });

      // Generate commitments
      commit1 = await rps.getCommitmentHash(Move.Rock, secret1);
      commit2 = await rps.getCommitmentHash(Move.Paper, secret2);
    });

    it("Should allow both players to commit moves", async function () {
      await expect(rps.connect(player1).commitMove(0, commit1))
        .to.emit(rps, "MoveCommitted")
        .withArgs(0, player1.address);

      await expect(rps.connect(player2).commitMove(0, commit2))
        .to.emit(rps, "MoveCommitted")
        .withArgs(0, player2.address);

      const game = await rps.getGame(0);
      expect(game.state).to.equal(2); // RevealPhase
    });

    it("Should reject commit from unauthorized player", async function () {
      await expect(
        rps.connect(player3).commitMove(0, commit1)
      ).to.be.revertedWithCustomError(rps, "Unauthorized");
    });

    it("Should reject double commit from same player", async function () {
      await rps.connect(player1).commitMove(0, commit1);
      await expect(
        rps.connect(player1).commitMove(0, commit1)
      ).to.be.revertedWithCustomError(rps, "NotYourTurn");
    });
  });

  describe("Reveal Phase and Winner Determination", function () {
    const secret1 = "player1secret";
    const secret2 = "player2secret";

    async function setupGameToRevealPhase(move1, move2) {
      await rps.connect(player1).createGame(player2.address, { value: stake });
      await rps.connect(player2).joinGame(0, { value: stake });

      const commit1 = await rps.getCommitmentHash(move1, secret1);
      const commit2 = await rps.getCommitmentHash(move2, secret2);

      await rps.connect(player1).commitMove(0, commit1);
      await rps.connect(player2).commitMove(0, commit2);

      return { move1, move2 };
    }

    it("Should allow Rock to beat Scissors", async function () {
      await setupGameToRevealPhase(Move.Rock, Move.Scissors);

      const balanceBefore = await ethers.provider.getBalance(player1.address);

      await rps.connect(player1).revealMove(0, Move.Rock, secret1);
      await rps.connect(player2).revealMove(0, Move.Scissors, secret2);

      const game = await rps.getGame(0);
      expect(game.winner).to.equal(player1.address);
      expect(game.state).to.equal(3); // Completed

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      // Player1 should have received 2 ETH (minus gas)
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should allow Paper to beat Rock", async function () {
      await setupGameToRevealPhase(Move.Rock, Move.Paper);

      await rps.connect(player1).revealMove(0, Move.Rock, secret1);
      await rps.connect(player2).revealMove(0, Move.Paper, secret2);

      const game = await rps.getGame(0);
      expect(game.winner).to.equal(player2.address);
    });

    it("Should allow Scissors to beat Paper", async function () {
      await setupGameToRevealPhase(Move.Scissors, Move.Paper);

      await rps.connect(player1).revealMove(0, Move.Scissors, secret1);
      await rps.connect(player2).revealMove(0, Move.Paper, secret2);

      const game = await rps.getGame(0);
      expect(game.winner).to.equal(player1.address);
    });

    it("Should handle draw correctly", async function () {
      await setupGameToRevealPhase(Move.Rock, Move.Rock);

      const balance1Before = await ethers.provider.getBalance(player1.address);
      const balance2Before = await ethers.provider.getBalance(player2.address);

      await rps.connect(player1).revealMove(0, Move.Rock, secret1);
      await rps.connect(player2).revealMove(0, Move.Rock, secret2);

      const game = await rps.getGame(0);
      expect(game.winner).to.equal(ethers.ZeroAddress); // No winner (draw)

      // Both players should get their stake back
      const balance1After = await ethers.provider.getBalance(player1.address);
      const balance2After = await ethers.provider.getBalance(player2.address);

      expect(balance1After).to.be.greaterThan(balance1Before);
      expect(balance2After).to.be.greaterThan(balance2Before);
    });

    it("Should reject reveal with wrong secret", async function () {
      await setupGameToRevealPhase(Move.Rock, Move.Paper);

      await expect(
        rps.connect(player1).revealMove(0, Move.Rock, "wrongSecret")
      ).to.be.revertedWithCustomError(rps, "CommitMismatch");
    });

    it("Should reject reveal with wrong move", async function () {
      await setupGameToRevealPhase(Move.Rock, Move.Paper);

      await expect(
        rps.connect(player1).revealMove(0, Move.Paper, secret1)
      ).to.be.revertedWithCustomError(rps, "CommitMismatch");
    });

    it("Should reject double reveal", async function () {
      await setupGameToRevealPhase(Move.Rock, Move.Paper);

      await rps.connect(player1).revealMove(0, Move.Rock, secret1);
      await expect(
        rps.connect(player1).revealMove(0, Move.Rock, secret1)
      ).to.be.revertedWithCustomError(rps, "NotYourTurn");
    });
  });

  describe("Timeout Mechanism", function () {
    const secret1 = "player1secret";
    const secret2 = "player2secret";

    beforeEach(async function () {
      // Setup game to reveal phase
      await rps.connect(player1).createGame(player2.address, { value: stake });
      await rps.connect(player2).joinGame(0, { value: stake });

      const commit1 = await rps.getCommitmentHash(Move.Rock, secret1);
      const commit2 = await rps.getCommitmentHash(Move.Paper, secret2);

      await rps.connect(player1).commitMove(0, commit1);
      await rps.connect(player2).commitMove(0, commit2);

      // Player1 reveals but player2 doesn't
      await rps.connect(player1).revealMove(0, Move.Rock, secret1);
    });

    it("Should allow timeout claim after deadline", async function () {
      // Fast forward time past the reveal deadline (5 minutes)
      await time.increase(301); // 5 minutes + 1 second

      const balanceBefore = await ethers.provider.getBalance(player1.address);

      await expect(rps.connect(player1).claimTimeout(0))
        .to.emit(rps, "TimeoutClaimed")
        .withArgs(0, player1.address)
        .and.to.emit(rps, "GameCompleted");

      const game = await rps.getGame(0);
      expect(game.winner).to.equal(player1.address);
      expect(game.state).to.equal(3); // Completed

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should reject timeout claim before deadline", async function () {
      await expect(
        rps.connect(player1).claimTimeout(0)
      ).to.be.revertedWithCustomError(rps, "TimeoutNotReached");
    });

    it("Should reject timeout claim from player who didn't reveal", async function () {
      await time.increase(301);

      await expect(
        rps.connect(player2).claimTimeout(0)
      ).to.be.revertedWithCustomError(rps, "Unauthorized");
    });
  });

  describe("Helper Functions", function () {
    it("Should generate correct commitment hash", async function () {
      const move = Move.Rock;
      const secret = "testSecret";

      const hash = await rps.getCommitmentHash(move, secret);

      // Verify it matches ethers.js computation
      const expectedHash = ethers.keccak256(
        ethers.solidityPacked(["uint8", "string"], [move, secret])
      );

      expect(hash).to.equal(expectedHash);
    });

    it("Should reject invalid move in commitment hash", async function () {
      await expect(
        rps.getCommitmentHash(Move.None, "secret")
      ).to.be.revertedWith("Invalid move");
    });
  });

  describe("Contract Balance", function () {
    it("Should hold correct balance during game", async function () {
      await rps.connect(player1).createGame(player2.address, { value: stake });
      expect(await ethers.provider.getBalance(await rps.getAddress())).to.equal(stake);

      await rps.connect(player2).joinGame(0, { value: stake });
      expect(await ethers.provider.getBalance(await rps.getAddress())).to.equal(stake * 2n);
    });

    it("Should empty balance after game completion", async function () {
      const secret1 = "s1";
      const secret2 = "s2";

      await rps.connect(player1).createGame(player2.address, { value: stake });
      await rps.connect(player2).joinGame(0, { value: stake });

      const commit1 = await rps.getCommitmentHash(Move.Rock, secret1);
      const commit2 = await rps.getCommitmentHash(Move.Scissors, secret2);

      await rps.connect(player1).commitMove(0, commit1);
      await rps.connect(player2).commitMove(0, commit2);

      await rps.connect(player1).revealMove(0, Move.Rock, secret1);
      await rps.connect(player2).revealMove(0, Move.Scissors, secret2);

      // Contract should have zero balance after payout
      expect(await ethers.provider.getBalance(await rps.getAddress())).to.equal(0);
    });
  });
});
