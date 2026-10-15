const mongoose = require('mongoose');

/**
 * MongoDB multi-document transactions only work on replica sets / sharded
 * clusters. The default local + docker-compose setup runs a standalone mongod,
 * so every transactional code path must degrade gracefully.
 *
 * Instead of guessing from error messages (which differ between server
 * versions), we ask the server once what topology it is running and cache it.
 */
let transactionSupport = null;

const supportsTransactions = async () => {
    if (transactionSupport !== null) {
        return transactionSupport;
    }

    try {
        const hello = await mongoose.connection.db.admin().command({ hello: 1 });
        transactionSupport = Boolean(hello.setName || hello.msg === 'isdbgrid');
    } catch (error) {
        transactionSupport = false;
    }

    return transactionSupport;
};

/**
 * Runs `work(session)` inside a transaction when the deployment supports it,
 * otherwise runs `work(null)` directly. Callers must pass `session` through to
 * every query (passing `null` is valid for Mongoose) and, when `session` is
 * null, perform their own compensation on failure where it matters.
 */
const runInTransaction = async (work) => {
    if (!(await supportsTransactions())) {
        return work(null);
    }

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await work(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
};

module.exports = {
    supportsTransactions,
    runInTransaction,
};
