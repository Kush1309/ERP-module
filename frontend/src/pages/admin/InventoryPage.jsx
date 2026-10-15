import { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import { inventoryApi } from '../../services/moduleApi';
import { PageHeader, Tabs, DataTable, PaginationBar, StatusPill, Field, Alert, inputClass, errorMessage, formatLabel, formatCurrency } from '../../components/common/ui';

const CONDITIONS = ['GOOD', 'NEEDS_REPAIR', 'DAMAGED', 'DISPOSED'];
const EMPTY_ITEM = { name: '', category: '', sku: '', itemType: 'CONSUMABLE', unit: 'pcs', quantity: 0, reorderLevel: 0, location: '', condition: 'GOOD', notes: '' };
const EMPTY_TXN = { type: 'IN', quantity: '', supplier: '', unitCost: '', reference: '', issuedTo: '', note: '' };
const TXN_TONE = { IN: 'green', OUT: 'amber', ADJUSTMENT: 'blue' };

function Items() {
    const [filters, setFilters] = useState({ search: '', category: '', itemType: '', lowStock: false });
    const [debounced, setDebounced] = useState(filters);
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ items: [], categories: [], lowStockCount: 0, pagination: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_ITEM);
    const [txn, setTxn] = useState(EMPTY_TXN);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setPage(1); setDebounced(filters); }, 300); return () => clearTimeout(t); }, [filters]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await inventoryApi.listItems({ page, search: debounced.search || undefined, category: debounced.category || undefined, itemType: debounced.itemType || undefined, lowStock: debounced.lowStock ? 'true' : undefined });
            setData({ items: result?.items || [], categories: result?.categories || [], lowStockCount: result?.lowStockCount || 0, pagination: result?.pagination || null });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load inventory.'));
        } finally {
            setLoading(false);
        }
    }, [page, debounced]);

    useEffect(() => { load(); }, [load]);

    const saveItem = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        const body = { name: form.name, category: form.category, sku: form.sku, itemType: form.itemType, unit: form.unit, reorderLevel: Number(form.reorderLevel), location: form.location, condition: form.condition, notes: form.notes };
        try {
            if (modal.mode === 'create') await inventoryApi.createItem({ ...body, quantity: Number(form.quantity) });
            else await inventoryApi.updateItem(modal.record._id, body);
            setNotice(`${form.name} saved.`);
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to save item.'));
        } finally {
            setSaving(false);
        }
    };

    const saveTxn = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            const result = await inventoryApi.recordTransaction(modal.record._id, { ...txn, quantity: Number(txn.quantity), unitCost: txn.unitCost === '' ? 0 : Number(txn.unitCost) });
            setNotice(`Stock updated. ${result.item.name} balance: ${result.item.quantity} ${result.item.unit}.`);
            setModal(null);
            load();
        } catch (err) {
            setFormError(errorMessage(err, 'Unable to record stock movement.'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (item) => {
        if (!window.confirm(`Delete ${item.name}?`)) return;
        try { await inventoryApi.deleteItem(item._id); setNotice('Item deleted.'); load(); } catch (err) { setError(errorMessage(err, 'Unable to delete item.')); }
    };

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const setT = (k) => (e) => setTxn((f) => ({ ...f, [k]: e.target.value }));

    return (
        <>
            {data.lowStockCount > 0 && <Alert tone="warning">{data.lowStockCount} item(s) are at or below their reorder level.</Alert>}
            <Card className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <input aria-label="Search items" placeholder="Search name, SKU, location..." className={inputClass} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                <select aria-label="Category" className={`${inputClass} lg:w-44`} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                    <option value="">All categories</option>{data.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select aria-label="Item type" className={`${inputClass} lg:w-40`} value={filters.itemType} onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}>
                    <option value="">All types</option><option value="CONSUMABLE">Consumable</option><option value="ASSET">Asset</option>
                </select>
                <label className="flex shrink-0 items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={filters.lowStock} onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })} /> Low stock</label>
                <Button type="button" className="shrink-0" onClick={() => { setForm(EMPTY_ITEM); setFormError(''); setModal({ mode: 'create' }); }}>Add Item</Button>
            </Card>
            {notice && <Alert>{notice}</Alert>}
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={data.items}
                emptyTitle="No inventory items"
                emptyDescription="Register consumables (stationery, lab supplies) and assets (furniture, equipment)."
                columns={[
                    { key: 'name', label: 'Item', render: (i) => <div><p className="font-medium text-ink-900">{i.name}</p><p className="font-mono text-xs text-ink-500">{i.sku}</p></div> },
                    { key: 'category', label: 'Category', render: (i) => <div><p>{i.category}</p><p className="text-xs text-ink-500">{formatLabel(i.itemType)}</p></div> },
                    { key: 'quantity', label: 'In stock', render: (i) => <span className={i.lowStock ? 'font-semibold text-red-600' : ''}>{i.quantity} {i.unit}{i.lowStock ? ' · low' : ''}</span> },
                    { key: 'reorderLevel', label: 'Reorder at' },
                    { key: 'location', label: 'Location', render: (i) => i.location || '—' },
                    { key: 'condition', label: 'Condition', render: (i) => <StatusPill value={i.condition} tone={i.condition === 'GOOD' ? 'green' : i.condition === 'DISPOSED' ? 'gray' : 'amber'} /> },
                    {
                        key: 'actions', label: '', className: 'text-right', render: (i) => (
                            <div className="flex justify-end gap-3">
                                <button type="button" className="font-medium text-emerald-700" onClick={() => { setTxn(EMPTY_TXN); setFormError(''); setModal({ mode: 'stock', record: i }); }}>Stock</button>
                                <button type="button" className="font-medium text-brand-700" onClick={() => { setForm({ ...EMPTY_ITEM, ...i }); setFormError(''); setModal({ mode: 'edit', record: i }); }}>Edit</button>
                                <button type="button" className="font-medium text-red-600" onClick={() => remove(i)}>Delete</button>
                            </div>
                        ),
                    },
                ]}
                footer={!loading && !error && <PaginationBar pagination={data.pagination} onPage={setPage} loading={loading} />}
            />

            <Modal isOpen={modal?.mode === 'create' || modal?.mode === 'edit'} onClose={() => !saving && setModal(null)} title={modal?.mode === 'edit' ? 'Edit Item' : 'Add Item'} size="max-w-lg">
                <form onSubmit={saveItem} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Name" htmlFor="it-name" required><input id="it-name" required className={inputClass} value={form.name} onChange={set('name')} /></Field>
                        <Field label="SKU / asset code" htmlFor="it-sku" required><input id="it-sku" required className={inputClass} value={form.sku} onChange={set('sku')} /></Field>
                        <Field label="Category" htmlFor="it-cat" required><input id="it-cat" required list="it-categories" className={inputClass} value={form.category} onChange={set('category')} /><datalist id="it-categories">{data.categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
                        <Field label="Type" htmlFor="it-type"><select id="it-type" className={inputClass} value={form.itemType} onChange={set('itemType')}><option value="CONSUMABLE">Consumable</option><option value="ASSET">Asset</option></select></Field>
                        <Field label="Unit" htmlFor="it-unit"><input id="it-unit" className={inputClass} value={form.unit} onChange={set('unit')} /></Field>
                        {modal?.mode === 'create'
                            ? <Field label="Opening stock" htmlFor="it-qty"><input id="it-qty" type="number" min="0" className={inputClass} value={form.quantity} onChange={set('quantity')} /></Field>
                            : <Field label="Current stock" htmlFor="it-qty" hint="Change stock with the Stock action so it is recorded in the ledger."><input id="it-qty" disabled className={`${inputClass} bg-ink-50`} value={form.quantity} /></Field>}
                        <Field label="Reorder level" htmlFor="it-reorder"><input id="it-reorder" type="number" min="0" className={inputClass} value={form.reorderLevel} onChange={set('reorderLevel')} /></Field>
                        <Field label="Location" htmlFor="it-loc"><input id="it-loc" className={inputClass} value={form.location} onChange={set('location')} /></Field>
                        <Field label="Condition" htmlFor="it-cond"><select id="it-cond" className={inputClass} value={form.condition} onChange={set('condition')}>{CONDITIONS.map((c) => <option key={c} value={c}>{formatLabel(c)}</option>)}</select></Field>
                    </div>
                    <Field label="Notes" htmlFor="it-notes"><input id="it-notes" className={inputClass} value={form.notes} onChange={set('notes')} /></Field>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={modal?.mode === 'stock'} onClose={() => !saving && setModal(null)} title={`Stock movement · ${modal?.record?.name || ''}`}>
                <form onSubmit={saveTxn} className="space-y-4">
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <p className="text-sm text-ink-600">Current stock: {modal?.record?.quantity} {modal?.record?.unit}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Movement" htmlFor="tx-type">
                            <select id="tx-type" className={inputClass} value={txn.type} onChange={setT('type')}>
                                <option value="IN">Received (IN)</option><option value="OUT">Issued (OUT)</option><option value="ADJUSTMENT">Stock-take (set count)</option>
                            </select>
                        </Field>
                        <Field label={txn.type === 'ADJUSTMENT' ? 'Counted quantity' : 'Quantity'} htmlFor="tx-qty" required><input id="tx-qty" type="number" min="1" step="1" required className={inputClass} value={txn.quantity} onChange={setT('quantity')} /></Field>
                        {txn.type === 'IN' && (
                            <>
                                <Field label="Supplier" htmlFor="tx-sup"><input id="tx-sup" className={inputClass} value={txn.supplier} onChange={setT('supplier')} /></Field>
                                <Field label="Unit cost" htmlFor="tx-cost"><input id="tx-cost" type="number" min="0" step="0.01" className={inputClass} value={txn.unitCost} onChange={setT('unitCost')} /></Field>
                                <Field label="Invoice / PO reference" htmlFor="tx-ref"><input id="tx-ref" className={inputClass} value={txn.reference} onChange={setT('reference')} /></Field>
                            </>
                        )}
                        {txn.type === 'OUT' && <Field label="Issued to" htmlFor="tx-to" required><input id="tx-to" required className={inputClass} value={txn.issuedTo} onChange={setT('issuedTo')} /></Field>}
                    </div>
                    <Field label="Note" htmlFor="tx-note"><input id="tx-note" className={inputClass} value={txn.note} onChange={setT('note')} /></Field>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Record'}</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

function Ledger() {
    const [type, setType] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ transactions: [], pagination: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await inventoryApi.listTransactions({ page, type: type || undefined });
            setData({ transactions: result?.transactions || [], pagination: result?.pagination || null });
        } catch (err) {
            setError(errorMessage(err, 'Unable to load stock ledger.'));
        } finally {
            setLoading(false);
        }
    }, [page, type]);

    useEffect(() => { load(); }, [load]);

    return (
        <>
            <Card className="mb-4">
                <select aria-label="Movement type" className={`${inputClass} sm:w-56`} value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
                    <option value="">All movements</option><option value="IN">Received</option><option value="OUT">Issued</option><option value="ADJUSTMENT">Stock-take</option>
                </select>
            </Card>
            <DataTable
                loading={loading}
                error={error}
                onRetry={load}
                rows={data.transactions}
                emptyTitle="No stock movements yet"
                columns={[
                    { key: 'date', label: 'Date', render: (t) => new Date(t.createdAt).toLocaleString() },
                    { key: 'item', label: 'Item', render: (t) => (t.item ? `${t.item.name} (${t.item.sku})` : 'Deleted item') },
                    { key: 'type', label: 'Type', render: (t) => <StatusPill value={t.type} tone={TXN_TONE[t.type]} /> },
                    { key: 'quantity', label: 'Qty' },
                    { key: 'balanceAfter', label: 'Balance' },
                    { key: 'detail', label: 'Details', render: (t) => [t.supplier && `Supplier: ${t.supplier}`, t.unitCost ? `@ ${formatCurrency(t.unitCost)}` : '', t.reference && `Ref ${t.reference}`, t.issuedTo && `To: ${t.issuedTo}`, t.note].filter(Boolean).join(' · ') || '—' },
                    { key: 'by', label: 'By', render: (t) => t.recordedBy?.loginId || '—' },
                ]}
                footer={!loading && !error && <PaginationBar pagination={data.pagination} onPage={setPage} loading={loading} />}
            />
        </>
    );
}

export default function InventoryPage() {
    const [tab, setTab] = useState('items');
    return (
        <div className="mx-auto w-full max-w-6xl">
            <PageHeader title="Inventory & Assets" description="Items and assets, stock received from suppliers, stock issued, and low-stock alerts." />
            <Tabs tabs={[{ key: 'items', label: 'Items' }, { key: 'ledger', label: 'Stock Ledger' }]} active={tab} onChange={setTab} />
            {tab === 'items' ? <Items /> : <Ledger />}
        </div>
    );
}
