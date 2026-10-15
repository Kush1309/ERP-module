// Shared fee arithmetic so every screen and rule agrees on what is payable
const round2 = (n) => Math.round(n * 100) / 100;

// Fee amount after concession (before any late charge)
const baseNet = (r) => Math.max((r.amountDue || 0) - (r.discount || 0), 0);

// Late charge currently payable (0 when waived)
const lateCharge = (r) => (r.lateFeeWaived ? 0 : (r.lateFee || 0));

// Total payable = fee after concession + late charge
const netPayable = (r) => round2(baseNet(r) + lateCharge(r));

const outstanding = (r) => round2(Math.max(netPayable(r) - (r.amountPaid || 0), 0));

module.exports = { round2, baseNet, lateCharge, netPayable, outstanding };
