"use client";

import { useEffect, useState } from "react";
import deployedContracts from "../contracts/deployedContracts";
import { ethers } from "ethers";

export default function Home() {
  const [leases, setLeases] = useState<any[]>([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);
  const [landlord, setLandlord] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const contractAddress = deployedContracts[31337].RentalDeposit.address;
  const contractABI = deployedContracts[31337].RentalDeposit.abi;

  const getContract = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
  };

  const handleCreateLease = async () => {
    const contract = await getContract();
    if (!contract) return;

    try {
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      const depositInWei = ethers.utils.parseEther(depositAmount.toString());

      await contract.createLease(landlord, depositInWei, startTimestamp, endTimestamp, { value: depositInWei });
      alert("Lease created and deposit paid successfully!");
      fetchLeases();
    } catch (error) {
      console.error("Error creating lease:", error);
      alert("Error creating lease. Please try again.");
    }
  };

  const handleApproveDepositReturn = async () => {
    const contract = await getContract();
    if (!contract) return;

    try {
      if (selectedLeaseId === null) {
        alert("Please select a lease to approve deposit return!");
        return;
      }
      await contract.approveDepositReturn(selectedLeaseId);
      alert("Deposit return approved successfully!");
      fetchLeases();
    } catch (error) {
      console.error("Error approving deposit return:", error);
      alert("Error approving deposit return. Please try again.");
    }
  };

  const handleWithdrawDeposit = async () => {
    const contract = await getContract();
    if (!contract) return;

    try {
      if (selectedLeaseId === null) {
        alert("Please select a lease to withdraw deposit!");
        return;
      }
      await contract.withdrawDeposit(selectedLeaseId);
      alert("Deposit withdrawn successfully!");
      fetchLeases();
    } catch (error) {
      console.error("Error withdrawing deposit:", error);
      alert("Lease period has not ended yet or you are not authorized to perform this action.");
    }
  };

  const handleReturnDeposit = async () => {
    const contract = await getContract();
    if (!contract) return;

    try {
      if (selectedLeaseId === null) {
        alert("Please select a lease to return deposit!");
        return;
      }
      await contract.returnDeposit(selectedLeaseId);
      alert("Deposit returned successfully!");
      fetchLeases();
    } catch (error) {
      console.error("Error returning deposit:", error);
      alert(
        "Lease period has not ended yet, landlord has not approved the return, or you are not authorized to perform this action.",
      );
    }
  };

  const fetchLeases = async () => {
    const contract = await getContract();
    if (!contract) return;

    try {
      const leaseCount = await contract.getLeaseCount();
      const leases = [];
      for (let i = 0; i < leaseCount; i++) {
        const lease = await contract.getLeaseDetails(i);
        leases.push({
          id: i,
          landlord: lease.landlord,
          tenant: lease.tenant,
          depositAmount: ethers.utils.formatEther(lease.depositAmount),
          startDate: new Date(lease.startDate * 1000).toLocaleString(),
          endDate: new Date(lease.endDate * 1000).toLocaleString(),
          isActive: lease.isActive,
          landlordApproved: lease.landlordApproved,
        });
      }
      setLeases(leases);
    } catch (error) {
      console.error("Error fetching leases:", error);
      alert("Error fetching leases. Please try again.");
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-blue-500 text-gray-800 p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">Rental Deposit Management</h1>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Create Lease</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Landlord Address"
              value={landlord}
              onChange={e => setLandlord(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Deposit Amount (ETH)"
              value={depositAmount}
              onChange={e => setDepositAmount(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
            <input
              type="datetime-local"
              placeholder="Start Date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="datetime-local"
              placeholder="End Date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleCreateLease}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Create Lease
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Manage Lease</h2>
          <div className="space-y-4">
            <select onChange={e => setSelectedLeaseId(Number(e.target.value))} className="w-full p-2 border rounded">
              <option value="" disabled selected>
                Select a lease
              </option>
              {leases.map(lease => (
                <option key={lease.id} value={lease.id}>
                  {`Lease ID: ${lease.id}, Tenant: ${lease.tenant}`}
                </option>
              ))}
            </select>
            {selectedLeaseId !== null && (
              <div>
                <p className="text-lg font-semibold">Lease Details:</p>
                <ul className="list-disc list-inside">
                  <li>Landlord: {leases[selectedLeaseId]?.landlord}</li>
                  <li>Tenant: {leases[selectedLeaseId]?.tenant}</li>
                  <li>Deposit Amount: {leases[selectedLeaseId]?.depositAmount} ETH</li>
                  <li>Start Date: {leases[selectedLeaseId]?.startDate}</li>
                  <li>End Date: {leases[selectedLeaseId]?.endDate}</li>
                  <li>Active: {leases[selectedLeaseId]?.isActive ? "Yes" : "No"}</li>
                  <li>Landlord Approved: {leases[selectedLeaseId]?.landlordApproved ? "Yes" : "No"}</li>
                </ul>
              </div>
            )}
            <button
              onClick={handleApproveDepositReturn}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Approve Deposit Return (Landlord)
            </button>
            <button
              onClick={handleWithdrawDeposit}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
            >
              Withdraw Deposit (Landlord)
            </button>
            <button
              onClick={handleReturnDeposit}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Return Deposit (Tenant)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
