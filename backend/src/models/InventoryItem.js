const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Item name is required'], trim: true },
        category: { type: String, required: [true, 'Category is required'], trim: true },
        sku: { type: String, required: [true, 'SKU / asset code is required'], trim: true, uppercase: true, unique: true },
        itemType: { type: String, enum: ['CONSUMABLE', 'ASSET'], default: 'CONSUMABLE' },
        unit: { type: String, trim: true, default: 'pcs' },
        quantity: { type: Number, min: [0, 'Stock cannot be negative'], default: 0 },
        reorderLevel: { type: Number, min: 0, default: 0 },
        location: { type: String, trim: true, default: '' },
        condition: { type: String, enum: ['GOOD', 'NEEDS_REPAIR', 'DAMAGED', 'DISPOSED'], default: 'GOOD' },
        notes: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
);

inventoryItemSchema.index({ category: 1, name: 1 });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
