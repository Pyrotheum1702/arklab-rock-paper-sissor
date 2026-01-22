const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RockPaperScissorsZK", function () {
  let rpsZK, mockVerifier;
  let owner, player1, player2, player3;
  const stake = ethers.parseEther("1.0");

  // Mock commitments (in production, these would be Poseidon hashes)
  const commitment1 = 123456789n;
  const commitment2 = 987654321n;

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy mock verifier
    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifier.deploy();

    // Deploy ZK RPS contract
    const RPSZK = await ethers.getContractFactory("RockPaperScissorsZK");
    rpsZK = await RPSZK.deploy(await mockVerifier.getAddress());
  });

  describe("Game Creation", function () {
    it("Should create a game with valid parameters", async function () {
      const tx = await rpsZK.connect(player1).createGame(
        player2.address,
        commitment1,
        { value: stake }
      );

      await expect(tx)
        .to.emit(rpsZK, "GameCreated")
        .withArgs(0, player1.address, player2.address, stake, commitment1);

      const game = await rpsZK.getGame(0);
      expect(game.player1).to.equal(player1.address);
      expect(game.player2).to.equal(player2.address);
      expect(game.stake).to.equal(stake);
      expect(game.commitment1).to.equal(commitment1);
      expect(game.state).to.equal(0); // WaitingForPlayer2
    });

    it("Should reject game creation with zero commitment", async function () {
      await expect(
        rpsZK.connect(player1).createGame(player2.address, 0, { value: stake })
      ).to.be.revertedWithCustomError(rpsZK, "InvalidCommitment");
    });

    it("Should reject game creation with zero stake", async function () {
      await expect(
        rpsZK.connect(player1).createGame(player2.address, commitment1, { value: 0 })
      ).to.be.revertedWithCustomError(rpsZK, "InvalidStake");
    });

    it("Should reject game with self as opponent", async function () {
      await expect(
        rpsZK.connect(player1).createGame(player1.address, commitment1, { value: stake })
      ).to.be.revertedWithCustomError(rpsZK, "Unauthorized");
    });
  });

  describe("Joining Game", function () {
    beforeEach(async function () {
      await rpsZK.connect(player1).createGame(player2.address, commitment1, { value: stake });
    });

    it("Should allow player2 to join with correct stake and commitment", async function () {
      const tx = await rpsZK.connect(player2).joinGame(0, commitment2, { value: stake });

      await expect(tx)
        .to.emit(rpsZK, "Player2Joined")
        .withArgs(0, player2.address, commitment2);

      const game = await rpsZK.getGame(0);
      expect(game.commitment2).to.equal(commitment2);
      expect(game.state).to.equal(1); // WaitingForProof
    });

    it("Should reject join with wrong stake amount", async function () {
      await expect(
        rpsZK.connect(player2).joinGame(0, commitment2, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(rpsZK, "InvalidStake");
    });

    it("Should reject join with zero commitment", async function () {
      await expect(
        rpsZK.connect(player2).joinGame(0, 0, { value: stake })
      ).to.be.revertedWithCustomError(rpsZK, "InvalidCommitment");
    });

    it("Should reject join from wrong player", async function () {
      await expect(
        rpsZK.connect(player3).joinGame(0, commitment2, { value: stake })
      ).to.be.revertedWithCustomError(rpsZK, "Unauthorized");
    });
  });

  describe("Proving Winner", function () {
    // Mock proof data (in production, this comes from snarkjs)
    const mockProof = {
      a: [1n, 2n],
      b: [[3n, 4n], [5n, 6n]],
      c: [7n, 8n]
    };

    beforeEach(async function () {
      await rpsZK.connect(player1).createGame(player2.address, commitment1, { value: stake });
      await rpsZK.connect(player2).joinGame(0, commitment2, { value: stake });
    });

    it("Should accept valid proof and pay winner (player1 wins)", async function () {
      const balanceBefore = await ethers.provider.getBalance(player1.address);

      await expect(
        rpsZK.connect(player1).proveWinner(0, 1, mockProof.a, mockProof.b, mockProof.c)
      ).to.emit(rpsZK, "WinnerProven");

      const game = await rpsZK.getGame(0);
      expect(game.winner).to.equal(player1.address);
      expect(game.state).to.equal(2); // Completed

      const balanceAfter = await ethers.provider.getBalance(player1.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should accept valid proof and pay winner (player2 wins)", async function () {
      const balanceBefore = await ethers.provider.getBalance(player2.address);

      await rpsZK.connect(player2).proveWinner(0, 2, mockProof.a, mockProof.b, mockProof.c);

      const game = await rpsZK.getGame(0);
      expect(game.winner).to.equal(player2.address);

      const balanceAfter = await ethers.provider.getBalance(player2.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should handle draw correctly", async function () {
      const balance1Before = await ethers.provider.getBalance(player1.address);
      const balance2Before = await ethers.provider.getBalance(player2.address);

      await rpsZK.connect(player1).proveWinner(0, 0, mockProof.a, mockProof.b, mockProof.c);

      const game = await rpsZK.getGame(0);
      expect(game.winner).to.equal(ethers.ZeroAddress); // Draw

      // Both should get refunds
      const balance1After = await ethers.provider.getBalance(player1.address);
      const balance2After = await ethers.provider.getBalance(player2.address);

      expect(balance1After).to.be.greaterThan(balance1Before);
      expect(balance2After).to.be.greaterThan(balance2Before);
    });

    it("Should reject proof from unauthorized player", async function () {
      await expect(
        rpsZK.connect(player3).proveWinner(0, 1, mockProof.a, mockProof.b, mockProof.c)
      ).to.be.revertedWithCustomError(rpsZK, "Unauthorized");
    });

    it("Should reject invalid winner value", async function () {
      await expect(
        rpsZK.connect(player1).proveWinner(0, 3, mockProof.a, mockProof.b, mockProof.c)
      ).to.be.revertedWithCustomError(rpsZK, "InvalidProof");
    });

    it("Should reject proof in wrong state", async function () {
      await rpsZK.connect(player1).proveWinner(0, 1, mockProof.a, mockProof.b, mockProof.c);

      // Try to prove again after game is complete
      await expect(
        rpsZK.connect(player2).proveWinner(0, 2, mockProof.a, mockProof.b, mockProof.c)
      ).to.be.revertedWithCustomError(rpsZK, "WrongGameState");
    });
  });

  describe("Contract Balance", function () {
    const mockProof = {
      a: [1n, 2n],
      b: [[3n, 4n], [5n, 6n]],
      c: [7n, 8n]
    };

    it("Should hold correct balance during game", async function () {
      await rpsZK.connect(player1).createGame(player2.address, commitment1, { value: stake });
      expect(await ethers.provider.getBalance(await rpsZK.getAddress())).to.equal(stake);

      await rpsZK.connect(player2).joinGame(0, commitment2, { value: stake });
      expect(await ethers.provider.getBalance(await rpsZK.getAddress())).to.equal(stake * 2n);
    });

    it("Should empty balance after game completion", async function () {
      await rpsZK.connect(player1).createGame(player2.address, commitment1, { value: stake });
      await rpsZK.connect(player2).joinGame(0, commitment2, { value: stake });
      await rpsZK.connect(player1).proveWinner(0, 1, mockProof.a, mockProof.b, mockProof.c);

      // Contract should have zero balance after payout
      expect(await ethers.provider.getBalance(await rpsZK.getAddress())).to.equal(0);
    });
  });
});

describe("TestVerifier", function () {
  let testVerifier;

  beforeEach(async function () {
    const TestVerifier = await ethers.getContractFactory("TestVerifier");
    testVerifier = await TestVerifier.deploy();
  });

  describe("Winner Computation", function () {
    it("Should compute Rock beats Scissors", async function () {
      expect(await testVerifier.computeWinner(1, 3)).to.equal(1);
    });

    it("Should compute Paper beats Rock", async function () {
      expect(await testVerifier.computeWinner(2, 1)).to.equal(1);
    });

    it("Should compute Scissors beats Paper", async function () {
      expect(await testVerifier.computeWinner(3, 2)).to.equal(1);
    });

    it("Should compute Scissors loses to Rock", async function () {
      expect(await testVerifier.computeWinner(3, 1)).to.equal(2);
    });

    it("Should compute Rock loses to Paper", async function () {
      expect(await testVerifier.computeWinner(1, 2)).to.equal(2);
    });

    it("Should compute Paper loses to Scissors", async function () {
      expect(await testVerifier.computeWinner(2, 3)).to.equal(2);
    });

    it("Should compute draw for same moves", async function () {
      expect(await testVerifier.computeWinner(1, 1)).to.equal(0);
      expect(await testVerifier.computeWinner(2, 2)).to.equal(0);
      expect(await testVerifier.computeWinner(3, 3)).to.equal(0);
    });

    it("Should reject invalid moves", async function () {
      await expect(testVerifier.computeWinner(0, 1)).to.be.revertedWith("Invalid move1");
      await expect(testVerifier.computeWinner(1, 4)).to.be.revertedWith("Invalid move2");
    });
  });

  describe("Proof Verification", function () {
    const mockProof = {
      a: [1n, 2n],
      b: [[3n, 4n], [5n, 6n]],
      c: [7n, 8n]
    };

    it("Should verify correct winner claims", async function () {
      // Rock (1) vs Scissors (3) = Player 1 wins
      const input = [1n, 3n, 1n, 1n]; // [move1, move2, winner, valid]
      expect(await testVerifier.verifyProof(mockProof.a, mockProof.b, mockProof.c, input))
        .to.equal(true);
    });

    it("Should reject incorrect winner claims", async function () {
      // Rock (1) vs Scissors (3) but claiming Player 2 wins
      const input = [1n, 3n, 2n, 1n];
      expect(await testVerifier.verifyProof(mockProof.a, mockProof.b, mockProof.c, input))
        .to.equal(false);
    });
  });
});
