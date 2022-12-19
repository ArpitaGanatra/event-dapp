// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const rsvpContractFactory = await hre.ethers.getContractFactory("EventRSVP");
  const rsvpContract = await rsvpContractFactory.deploy();
  await rsvpContract.deployed();
  console.log("rsvpContract address", rsvpContract.address);

  const [deployer, address1, address2] = await hre.ethers.getSigners();

  //mock data for event
  let deposit = hre.ethers.utils.parseEther("1.0");
  console.log("deposit", deposit);
  let maxCapacity = 3;
  let timestamp = 1718926202;
  let eventDataCID =
    "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";

  //create a event for mock data
  let txn = await rsvpContract.createNewEvent(
    timestamp,
    deposit,
    maxCapacity,
    eventDataCID
  );

  console.log("txn", txn);

  let wait = await txn.wait();
  console.log("NEW EVENT CREATED: ", wait.events[0].event, wait.events[0].args);

  let eventId = wait.events[0].args.eventId;
  console.log("EVENT ID: ", eventId);

  txn = await rsvpContract.createNewRSVP(eventId, { value: deposit });
  wait = await txn.wait();
  console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

  txn = await rsvpContract
    .connect(address1)
    .createNewRSVP(eventId, { value: deposit });
  wait = await txn.wait();
  console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

  txn = await rsvpContract
    .connect(address2)
    .createNewRSVP(eventId, { value: deposit });
  wait = await txn.wait();
  console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

  txn = await rsvpContract.confirmAllAttendees(eventId);
  wait = await txn.wait();
  wait.events.forEach((event) =>
    console.log("CONFIRMED:", event.args.attendeeAddress)
  );

  //wait for 10 year to withdraw unclaimed deposit ;)
  await hre.network.provider.send("evm_increaseTime", [15778800000000]);
  txn = await rsvpContract.withdrawUnclaimedDeposits(eventId);
  wait = await txn.wait();
  console.log("WITHDRAWN:", wait.events[0].event, wait.events[0].args);
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
runMain();
