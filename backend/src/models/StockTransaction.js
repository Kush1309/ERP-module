const mongoose = require('mongoose');

// Stock movement ledger: goods received (IN, from a supplier) or issued (OUT).
const stockTransactionSchema = new mongoose.Schema(
    {
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true, index: true },
        type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT'], required: true },
        quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
        supplier: { type: String, trim: true, default: '' },
        unitCost: { type: Number, min: 0, default: 0 },
        reference: { type: String, trim: true, default: '' },
        issuedTo: { type: String, trim: true, default: '' },
        note: { type: String, trim: true, default: '' },
        balanceAfter: { type: Number, required: true },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
