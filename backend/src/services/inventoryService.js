const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');
const AppError = require('../utils/AppError');
const { assertObjectId, pick, escapeRegex, getPagination, buildPagination } = require('../utils/queryHelpers');

const ITEM_FIELDS = ['name', 'category', 'sku', 'itemType', 'unit', 'reorderLevel', 'location', 'condition', 'notes'];

const listItems = async (query = {}) => {
    const { page, limit, skip } = getPagination(query, 20);
    const filter = {};
    if (query.category) filter.category = String(query.category);
    if (query.itemType) filter.itemType = String(query.itemType).toUpperCase();
    if (query.search) {
        const regex = { $regex: escapeRegex(query.search), $options: 'i' };
        filter.$or = [{ name: regex }, { sku: regex }, { location: regex }];
    }
    let items = await InventoryItem.find(filter).sort({ category: 1, name: 1 }).lean();
    if (query.lowStock === 'true') items = items.filter((i) => i.quantity <= i.reorderLevel);
    const total = items.length;
    const lowStockCount = (await InventoryItem.find().select('quantity reorderLevel').lean()).filter((i) => i.quantity <= i.reorderLevel).length;
    const categories = await InventoryItem.distinct('category');
    return {
        items: items.slice(skip, skip + limit).map((i) => ({ ...i, lowStock: i.quantity <= i.reorderLevel })),
        lowStockCount,
        categories: categories.sort(),
        pagination: buildPagination(page, limit, total),
    };
};

const createItem = async (data, userId) => {
    const payload = pick(data, ITEM_FIELDS);
    const opening = Number(data.quantity || 0);
    if (!Number.isFinite(opening) || opening < 0) throw new AppError('Opening quantity cannot be negative', 400);
    try {
        const item = await InventoryItem.create({ ...payload, quantity: opening });
        if (opening > 0) {
            await StockTransaction.create({ item: item._id, type: 'IN', quantity: opening, note: 'Opening stock', balanceAfter: opening, recordedBy: userId });
        }
        return item.toObject();
    } catch (error) {
        if (error.code === 11000) throw new AppError('An item with this SKU / asset code already exists', 409);
        throw error;
    }
};

// Quantity is only changed through stock transactions so the ledger stays complete
const updateItem = async (id, data) => {
    assertObjectId(id, 'item ID');
    const item = await InventoryItem.findById(id);
    if (!item) throw new AppError('Item not found', 404);
    Object.assign(item, pick(data, ITEM_FIELDS));
    try {
        await item.save();
    } catch (error) {
        if (error.code === 11000) throw new AppError('An item with this SKU / asset code already exists', 409);
        throw error;
    }
    return item.toObject();
};

const deleteItem = async (id) => {
    assertObjectId(id, 'item ID');
    const item = await InventoryItem.findById(id);
    if (!item) throw new AppError('Item not found', 404);
    const movements = await StockTransaction.countDocuments({ item: id, note: { $ne: 'Opening stock' } });
    if (movements > 0) throw new AppError('Items with stock history cannot be deleted. Mark them as disposed instead.', 409);
    await StockTransaction.deleteMany({ item: id });
    await item.deleteOne();
    return { deleted: true };
};

const recordTransaction = async (itemId, data, userId) => {
    assertObjectId(itemId, 'item ID');
    const type = String(data.type || '').toUpperCase();
    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) throw new AppError('type must be IN, OUT or ADJUSTMENT', 400);
    const quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new AppError('Quantity must be a whole number of at least 1', 400);
    if (type === 'OUT' && !String(data.issuedTo || '').trim()) throw new AppError('Specify who the stock was issued to', 400);

    // ADJUSTMENT sets an absolute count (stock-take); IN/OUT change it atomically
    let item;
    if (type === 'ADJUSTMENT') {
        item = await InventoryItem.findByIdAndUpdate(itemId, { $set: { quantity } }, { new: true });
    } else {
        const delta = type === 'IN' ? quantity : -quantity;
        const filter = { _id: itemId };
        if (type === 'OUT') filter.quantity = { $gte: quantity };
        item = await InventoryItem.findOneAndUpdate(filter, { $inc: { quantity: delta } }, { new: true });
        if (!item) {
            const exists = await InventoryItem.exists({ _id: itemId });
            if (!exists) throw new AppError('Item not found', 404);
            throw new AppError('Not enough stock to issue that quantity', 409);
        }
    }
    if (!item) throw new AppError('Item not found', 404);

    const txn = await StockTransaction.create({
        item: itemId, type, quantity,
        supplier: String(data.supplier || '').trim(),
        unitCost: Number(data.unitCost) || 0,
        reference: String(data.reference || '').trim(),
        issuedTo: String(data.issuedTo || '').trim(),
        note: String(data.note || '').trim(),
        balanceAfter: item.quantity,
        recordedBy: userId,
    });
    return { item: { ...item.toObject(), lowStock: item.quantity <= item.reorderLevel }, transaction: txn.toObject() };
};

const listTransactions = async (query = {}) => {
    const { page, limit, skip } = getPagination(query, 25);
    const filter = {};
    if (query.item) { assertObjectId(query.item, 'item ID'); filter.item = query.item; }
    if (query.type) filter.type = String(query.type).toUpperCase();
    const [transactions, total] = await Promise.all([
        StockTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate('item', 'name sku unit').populate('recordedBy', 'loginId').lean(),
        StockTransaction.countDocuments(filter),
    ]);
    return { transactions, pagination: buildPagination(page, limit, total) };
};

module.exports = { listItems, createItem, updateItem, deleteItem, recordTransaction, listTransactions };
