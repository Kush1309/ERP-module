import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
    getTransportRoutes,
    createTransportRoute,
    updateTransportRoute,
    deleteTransportRoute,
    getTransportAllocations,
    createTransportAllocation,
    updateTransportAllocation,
    deleteTransportAllocation
} from '../services/transportApi';
import { getStudents } from '../services/studentApi';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';

function TransportPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    // Data States
    const [routes, setRoutes] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [studentsList, setStudentsList] = useState([]); // For Admin Dropdown

    // Load / Error States
    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [errorRoutes, setErrorRoutes] = useState('');
    const [loadingAllocations, setLoadingAllocations] = useState(true);
    const [errorAllocations, setErrorAllocations] = useState('');

    // Search / Filter States
    const [searchRoute, setSearchRoute] = useState('');
    const [searchAllocation, setSearchAllocation] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRoute, setFilterRoute] = useState('');

    // Modal / Form States
    const [successMessage, setSuccessMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    // Modals
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [showAllocModal, setShowAllocModal] = useState(false);
    const [showDelRouteModal, setShowDelRouteModal] = useState(false);
    const [showDelAllocModal, setShowDelAllocModal] = useState(false);

    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedAlloc, setSelectedAlloc] = useState(null);

    const initialRouteForm = { name: '', vehicleNumber: '', driverName: '', capacity: '', stops: [''] };
    const [routeForm, setRouteForm] = useState(initialRouteForm);

    const initialAllocForm = { studentId: '', routeId: '', pickupStop: '', dropStop: '', status: 'ACTIVE' };
    const [allocForm, setAllocForm] = useState(initialAllocForm);

    // Call API
    const loadRoutes = useCallback(async () => {
        setLoadingRoutes(true);
        setErrorRoutes('');
        try {
            const data = await getTransportRoutes({ limit: 1000 });
            setRoutes(data?.data || []);
        } catch (err) {
            setErrorRoutes(err?.response?.data?.message || 'Unable to load transport information.');
        } finally {
            setLoadingRoutes(false);
        }
    }, []);

    const loadAllocations = useCallback(async () => {
        setLoadingAllocations(true);
        setErrorAllocations('');
        try {
            const data = await getTransportAllocations({ limit: 1000 });
            setAllocations(data?.data || []);
        } catch (err) {
            setErrorAllocations(err?.response?.data?.message || 'Unable to load transport information.');
        } finally {
            setLoadingAllocations(false);
        }
    }, []);

    const loadStudentsIfAdmin = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const data = await getStudents({ limit: 1000 });
            setStudentsList(data?.students || []);
        } catch (err) {
            console.error('Failed to load students for dropdown', err);
        }
    }, [isAdmin]);

    useEffect(() => {
        loadRoutes();
        loadAllocations();
        loadStudentsIfAdmin();
    }, [loadRoutes, loadAllocations, loadStudentsIfAdmin]);

    // Show temporary success feedback
    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // Calculate Summaries
    const totalRoutes = routes.length;
    const activeAllocations = allocations.filter(a => a.status === 'ACTIVE').length;

    // "Available Routes" might be routes with active allocations < capacity
    const availableRoutes = useMemo(() => {
        return routes.filter(r => {
            const allocsForRoute = allocations.filter(a => a.route?._id === r._id && a.status === 'ACTIVE').length;
            return allocsForRoute < r.capacity;
        }).length;
    }, [routes, allocations]);

    const transportStudents = new Set(allocations.filter(a => a.status === 'ACTIVE' && a.student).map(a => typeof a.student === 'object' ? a.student._id : a.student)).size;

    // Computed filtered lists
    const filteredRoutes = routes.filter(r => {
        if (!searchRoute) return true;
        const term = searchRoute.toLowerCase();
        return (r.name || '').toLowerCase().includes(term) ||
            (r.vehicleNumber || '').toLowerCase().includes(term) ||
            (r.driverName || '').toLowerCase().includes(term);
    });

    const filteredAllocations = allocations.filter(a => {
        if (filterStatus && a.status !== filterStatus) return false;
        if (filterRoute && a.route?._id !== filterRoute) return false;

        if (searchAllocation) {
            const term = searchAllocation.toLowerCase();
            const stuName = typeof a.student === 'object' ? `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.toLowerCase() : '';
            const rName = a.route?.name?.toLowerCase() || '';
            const vName = a.route?.vehicleNumber?.toLowerCase() || '';
            return stuName.includes(term) || rName.includes(term) || vName.includes(term);
        }
        return true;
    });

    // Handle Route Form
    const handleSaveRoute = async () => {
        // Validation
        if (!routeForm.name || !routeForm.vehicleNumber || !routeForm.driverName || routeForm.capacity === '') {
            alert('Please fill out all required route fields.');
            return;
        }
        if (Number(routeForm.capacity) < 0) {
            alert('Capacity must be >= 0.');
            return;
        }
        const validStops = routeForm.stops.map(s => s.trim()).filter(s => s.length > 0);
        if (validStops.length === 0) {
            alert('Please add at least one valid stop.');
            return;
        }

        const payload = {
            name: routeForm.name,
            vehicleNumber: routeForm.vehicleNumber,
            driverName: routeForm.driverName,
            capacity: Number(routeForm.capacity),
            stops: validStops
        };

        setProcessing(true);
        try {
            if (selectedRoute) {
                await updateTransportRoute(selectedRoute._id, payload);
                showSuccess('Route updated successfully');
            } else {
                await createTransportRoute(payload);
                showSuccess('Route created successfully');
            }
            setShowRouteModal(false);
            loadRoutes();
            loadAllocations(); // Refresh in case route name changes affect allocation display
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to save route.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteRoute = async () => {
        if (!selectedRoute) return;
        setProcessing(true);
        try {
            await deleteTransportRoute(selectedRoute._id);
            showSuccess('Route deleted successfully');
            setShowDelRouteModal(false);
            loadRoutes();
        } catch (err) {
            alert(err?.response?.data?.message || 'Cannot delete route. It may have active allocations.');
            setShowDelRouteModal(false);
        } finally {
            setProcessing(false);
        }
    };

    // Handle Allocation Form
    const selectedRouteObjectForAlloc = useMemo(() => {
        return routes.find(r => r._id === allocForm.routeId);
    }, [allocForm.routeId, routes]);

    const handleSaveAllocation = async () => {
        if (!allocForm.studentId || !allocForm.routeId || !allocForm.pickupStop || !allocForm.dropStop) {
            alert('Please fill out all allocation fields.');
            return;
        }

        // Validate stops belong to selected route
        if (selectedRouteObjectForAlloc) {
            if (!selectedRouteObjectForAlloc.stops.includes(allocForm.pickupStop) || !selectedRouteObjectForAlloc.stops.includes(allocForm.dropStop)) {
                alert('Invalid stops for this route.');
                return;
            }
        }

        const payload = { ...allocForm };

        setProcessing(true);
        try {
            if (selectedAlloc) {
                await updateTransportAllocation(selectedAlloc._id, payload);
                showSuccess('Allocation updated successfully');
            } else {
                await createTransportAllocation(payload);
                showSuccess('Allocation created successfully');
            }
            setShowAllocModal(false);
            loadAllocations();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to save allocation.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteAllocation = async () => {
        if (!selectedAlloc) return;
        setProcessing(true);
        try {
            await deleteTransportAllocation(selectedAlloc._id);
            showSuccess('Allocation deleted successfully');
            setShowDelAllocModal(false);
            loadAllocations();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to delete allocation.');
            setShowDelAllocModal(false);
        } finally {
            setProcessing(false);
        }
    };

    const openRouteModal = (route = null) => {
        setSelectedRoute(route);
        if (route) {
            setRouteForm({
                name: route.name || '',
                vehicleNumber: route.vehicleNumber || '',
                driverName: route.driverName || '',
                capacity: route.capacity || '',
                stops: route.stops?.length ? [...route.stops] : ['']
            });
        } else {
            setRouteForm(initialRouteForm);
        }
        setShowRouteModal(true);
    };

    const openAllocModal = (alloc = null) => {
        setSelectedAlloc(alloc);
        if (alloc) {
            setAllocForm({
                studentId: typeof alloc.student === 'object' ? alloc.student?._id : alloc.student || '',
                routeId: typeof alloc.route === 'object' ? alloc.route?._id : alloc.route || '',
                pickupStop: alloc.pickupStop || '',
                dropStop: alloc.dropStop || '',
                status: alloc.status || 'ACTIVE'
            });
        } else {
            setAllocForm(initialAllocForm);
        }
        setShowAllocModal(true);
    };

    return (
        <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 py-6">
            {successMessage && (
                <div className="fixed top-6 right-6 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
                    {successMessage}
                </div>
            )}

            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-ink-900">Transport Management</h1>
                    <p className="mt-2 text-sm text-ink-600">Manage school routes, vehicles, stops, and student transport allocations.</p>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-3 shrink-0">
                        <Button type="button" variant="secondary" onClick={() => openRouteModal(null)}>+ Add Route</Button>
                        <Button type="button" onClick={() => openAllocModal(null)}>Assign Student</Button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-5 flex flex-col items-start justify-center">
                    <p className="text-sm font-medium text-ink-500">Total Routes</p>
                    <p className="mt-1 text-2xl font-bold text-ink-900">{loadingRoutes ? '...' : totalRoutes}</p>
                </Card>
                <Card className="p-5 flex flex-col items-start justify-center">
                    <p className="text-sm font-medium text-ink-500">Active Allocations</p>
                    <p className="mt-1 text-2xl font-bold text-ink-900">{loadingAllocations ? '...' : activeAllocations}</p>
                </Card>
                <Card className="p-5 flex flex-col items-start justify-center">
                    <p className="text-sm font-medium text-ink-500">Available Routes</p>
                    <p className="mt-1 text-2xl font-bold text-ink-900">{loadingRoutes || loadingAllocations ? '...' : availableRoutes}</p>
                </Card>
                <Card className="p-5 flex flex-col items-start justify-center">
                    <p className="text-sm font-medium text-ink-500">Transport Students</p>
                    <p className="mt-1 text-2xl font-bold text-ink-900">{loadingAllocations ? '...' : transportStudents}</p>
                </Card>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Routes Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-ink-900">Routes</h2>
                    </div>
                    <Card className="p-0 overflow-hidden flex flex-col relative w-full">
                        <div className="p-4 border-b border-ink-100 bg-ink-50/50">
                            <input
                                type="text"
                                placeholder="Search routes by name, vehicle, or driver..."
                                value={searchRoute}
                                onChange={(e) => setSearchRoute(e.target.value)}
                                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>

                        <div className="overflow-x-auto w-full">
                            {loadingRoutes ? (
                                <div className="p-8 text-center text-sm text-ink-500 animate-pulse">
                                    <div className="h-4 bg-ink-200 rounded w-1/2 mx-auto mb-3"></div>
                                    <div className="h-4 bg-ink-100 rounded w-1/3 mx-auto"></div>
                                </div>
                            ) : errorRoutes ? (
                                <div className="p-8 text-center flex flex-col items-center gap-3">
                                    <p className="text-sm text-rose-600">Unable to load transport information.</p>
                                    <Button type="button" variant="secondary" onClick={loadRoutes}>Retry</Button>
                                </div>
                            ) : filteredRoutes.length === 0 ? (
                                <div className="p-8 text-center text-sm text-ink-500">
                                    {searchRoute ? 'No routes match your search.' : 'No transport routes found.'}
                                </div>
                            ) : (
                                <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                                    <thead className="bg-white border-b border-ink-200">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase text-ink-500">Route</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase text-ink-500">Driver / Vehicle</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase text-ink-500">Capacity / Stops</th>
                                            {isAdmin && <th className="px-4 py-3 text-xs font-semibold uppercase text-ink-500 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink-100 bg-white">
                                        {filteredRoutes.map(r => {
                                            const allocsForRoute = allocations.filter(a => a.route?._id === r._id && a.status === 'ACTIVE').length;
                                            return (
                                                <tr key={r._id} className="hover:bg-ink-50/50">
                                                    <td className="px-4 py-3 align-top">
                                                        <div className="font-medium text-ink-900">{r.name}</div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-sm">
                                                        <div className="text-ink-900">{r.driverName}</div>
                                                        <div className="text-ink-500 text-xs">{r.vehicleNumber}</div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-sm">
                                                        <div className="text-ink-700">{allocsForRoute} / {r.capacity} assigned</div>
                                                        <div className="text-ink-500 text-xs mt-0.5 truncate max-w-[120px]" title={r.stops?.join(', ')}>
                                                            {r.stops?.length || 0} stops
                                                        </div>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-4 py-3 align-top text-right text-sm">
                                                            <button onClick={() => openRouteModal(r)} className="text-brand-600 hover:text-brand-800 font-medium mr-3">Edit</button>
                                                            <button onClick={() => { setSelectedRoute(r); setShowDelRouteModal(true); }} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Allocations Section */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-ink-900">Allocations</h2>
                    </div>
                    <Card className="p-0 overflow-hidden flex flex-col relative w-full">
                        <div className="p-4 border-b border-ink-100 bg-ink-50/50 flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                placeholder="Search student or route..."
                                value={searchAllocation}
                                onChange={(e) => setSearchAllocation(e.target.value)}
                                className="flex-1 rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                            />
                            <select
                                value={filterRoute}
                                onChange={e => setFilterRoute(e.target.value)}
                                className="w-full sm:w-1/3 rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                            >
                                <option value="">All Routes</option>
                                {routes.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="w-full sm:w-1/4 rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                            >
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto w-full">
                            {loadingAllocations ? (
                                <div className="p-8 text-center text-sm text-ink-500 animate-pulse">
                                    <div className="h-4 bg-ink-200 rounded w-1/2 mx-auto mb-3"></div>
                                    <div className="h-4 bg-ink-100 rounded w-1/3 mx-auto"></div>
                                </div>
                            ) : errorAllocations ? (
                                <div className="p-8 text-center flex flex-col items-center gap-3">
                                    <p className="text-sm text-rose-600">Unable to load transport information.</p>
                                    <Button type="button" variant="secondary" onClick={loadAllocations}>Retry</Button>
                                </div>
                            ) : filteredAllocations.length === 0 ? (
                                <div className="p-8 text-center text-sm text-ink-500">
                                    {searchAllocation || filterRoute || filterStatus ? 'No allocations match your filters.' : 'No transport allocations found.'}
                                </div>
                            ) : (
                                <table className="w-full text-left whitespace-nowrap min-w-[500px]">
                                    <thead className="bg-white border-b border-ink-200">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase text-ink-500">Student</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase text-ink-500">Route / Stops</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase text-ink-500">Status</th>
                                            {isAdmin && <th className="px-4 py-3 text-xs font-semibold uppercase text-ink-500 text-right">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink-100 bg-white">
                                        {filteredAllocations.map(a => {
                                            const stuName = typeof a.student === 'object' ? `${a.student?.firstName || ''} ${a.student?.lastName || ''}` : `ID: ${a.student}`;
                                            const rName = typeof a.route === 'object' ? a.route?.name : `ID: ${a.route}`;
                                            return (
                                                <tr key={a._id} className="hover:bg-ink-50/50">
                                                    <td className="px-4 py-3 align-top min-w-[150px]">
                                                        <div className="font-medium text-ink-900 truncate">{stuName}</div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-sm min-w-[200px]">
                                                        <div className="text-ink-900 font-medium truncate">{rName}</div>
                                                        <div className="text-ink-500 text-xs truncate">P: {a.pickupStop} | D: {a.dropStop}</div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-sm">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                                            {a.status}
                                                        </span>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-4 py-3 align-top text-right text-sm">
                                                            <button onClick={() => openAllocModal(a)} className="text-brand-600 hover:text-brand-800 font-medium mr-3">Edit</button>
                                                            <button onClick={() => { setSelectedAlloc(a); setShowDelAllocModal(true); }} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* ROUTE MODAL */}
            {isAdmin && (
                <Modal isOpen={showRouteModal} onClose={() => !processing && setShowRouteModal(false)} title={selectedRoute ? 'Edit Route' : 'Add Route'}>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Route Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                                value={routeForm.name}
                                onChange={e => setRouteForm({ ...routeForm, name: e.target.value })}
                                disabled={processing}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Vehicle Number <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                                value={routeForm.vehicleNumber}
                                onChange={e => setRouteForm({ ...routeForm, vehicleNumber: e.target.value })}
                                disabled={processing}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Driver Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                                value={routeForm.driverName}
                                onChange={e => setRouteForm({ ...routeForm, driverName: e.target.value })}
                                disabled={processing}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Capacity <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                min="0"
                                className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                                value={routeForm.capacity}
                                onChange={e => setRouteForm({ ...routeForm, capacity: e.target.value })}
                                disabled={processing}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-ink-700">Stops <span className="text-red-500">*</span></label>
                            {routeForm.stops.map((stop, index) => (
                                <div key={index} className="flex gap-2 mb-2 items-center">
                                    <span className="text-xs text-ink-500 w-12 shrink-0">Stop {index + 1}</span>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm"
                                        value={stop}
                                        onChange={e => {
                                            const newStops = [...routeForm.stops];
                                            newStops[index] = e.target.value;
                                            setRouteForm({ ...routeForm, stops: newStops });
                                        }}
                                        disabled={processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (processing) return;
                                            const newStops = routeForm.stops.filter((_, i) => i !== index);
                                            setRouteForm({ ...routeForm, stops: newStops });
                                        }}
                                        className="text-red-500 text-sm font-medium hover:text-red-700 px-2"
                                        disabled={processing}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="text-brand-600 text-sm font-medium mt-1 hover:text-brand-800"
                                onClick={() => {
                                    if (processing) return;
                                    setRouteForm({ ...routeForm, stops: [...routeForm.stops, ''] });
                                }}
                                disabled={processing}
                            >
                                + Add Stop
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setShowRouteModal(false)} disabled={processing}>Cancel</Button>
                        <Button type="button" onClick={handleSaveRoute} disabled={processing}>{processing ? 'Saving...' : 'Save Route'}</Button>
                    </div>
                </Modal>
            )}

            {/* DELETE ROUTE CONFIRM MODAL */}
            {isAdmin && (
                <Modal isOpen={showDelRouteModal} onClose={() => !processing && setShowDelRouteModal(false)} title="Delete Transport Route?">
                    <p className="text-sm text-ink-700 mb-6 font-medium">Are you sure you want to delete this transport route?</p>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setShowDelRouteModal(false)} disabled={processing}>Cancel</Button>
                        <Button type="button" onClick={handleDeleteRoute} disabled={processing} className="bg-red-600 hover:bg-red-700 border-red-600 text-white">{processing ? 'Deleting...' : 'Delete Route'}</Button>
                    </div>
                </Modal>
            )}

            {/* ALLOCATION MODAL */}
            {isAdmin && (
                <Modal isOpen={showAllocModal} onClose={() => !processing && setShowAllocModal(false)} title={selectedAlloc ? 'Edit Allocation' : 'Assign Student'}>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Student <span className="text-red-500">*</span></label>
                            {selectedAlloc ? (
                                <input type="text" disabled className="w-full rounded-md border border-ink-300 bg-ink-50 px-3 py-2 text-sm text-ink-600 cursor-not-allowed" value={typeof selectedAlloc.student === 'object' ? `${selectedAlloc.student?.firstName || ''} ${selectedAlloc.student?.lastName || ''}` : selectedAlloc.student} />
                            ) : (
                                <select
                                    className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm bg-white"
                                    value={allocForm.studentId}
                                    onChange={e => setAllocForm({ ...allocForm, studentId: e.target.value })}
                                    disabled={processing || selectedAlloc}
                                >
                                    <option value="">-- Select Student --</option>
                                    {studentsList.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Route <span className="text-red-500">*</span></label>
                            <select
                                className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm bg-white"
                                value={allocForm.routeId}
                                onChange={e => {
                                    setAllocForm({ ...allocForm, routeId: e.target.value, pickupStop: '', dropStop: '' }); // Clear stops on route change
                                }}
                                disabled={processing}
                            >
                                <option value="">-- Select Route --</option>
                                {routes.map(r => <option key={r._id} value={r._id}>{r.name} - {r.vehicleNumber}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Pickup Stop <span className="text-red-500">*</span></label>
                            <select
                                className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm bg-white"
                                value={allocForm.pickupStop}
                                onChange={e => setAllocForm({ ...allocForm, pickupStop: e.target.value })}
                                disabled={processing || !allocForm.routeId}
                            >
                                <option value="">-- Select Pickup Stop --</option>
                                {selectedRouteObjectForAlloc?.stops?.map((stop, i) => <option key={i} value={stop}>{stop}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Drop Stop <span className="text-red-500">*</span></label>
                            <select
                                className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm bg-white"
                                value={allocForm.dropStop}
                                onChange={e => setAllocForm({ ...allocForm, dropStop: e.target.value })}
                                disabled={processing || !allocForm.routeId}
                            >
                                <option value="">-- Select Drop Stop --</option>
                                {selectedRouteObjectForAlloc?.stops?.map((stop, i) => <option key={i} value={stop}>{stop}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-ink-700">Status <span className="text-red-500">*</span></label>
                            <select
                                className="w-full rounded-md border border-ink-300 px-3 py-2 text-sm bg-white"
                                value={allocForm.status}
                                onChange={e => setAllocForm({ ...allocForm, status: e.target.value })}
                                disabled={processing}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setShowAllocModal(false)} disabled={processing}>Cancel</Button>
                        <Button type="button" onClick={handleSaveAllocation} disabled={processing}>{processing ? 'Saving...' : 'Save Allocation'}</Button>
                    </div>
                </Modal>
            )}

            {/* DELETE ALLOCATION CONFIRM MODAL */}
            {isAdmin && (
                <Modal isOpen={showDelAllocModal} onClose={() => !processing && setShowDelAllocModal(false)} title="Delete Allocation?">
                    <p className="text-sm text-ink-700 mb-6 font-medium">Are you sure you want to delete this allocation?</p>
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setShowDelAllocModal(false)} disabled={processing}>Cancel</Button>
                        <Button type="button" onClick={handleDeleteAllocation} disabled={processing} className="bg-red-600 hover:bg-red-700 border-red-600 text-white">{processing ? 'Deleting...' : 'Delete Allocation'}</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default TransportPage;
