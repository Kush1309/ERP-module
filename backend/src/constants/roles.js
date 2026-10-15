const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  ACCOUNTANT: 'ACCOUNTANT',
  LIBRARIAN: 'LIBRARIAN',
});

const ROLE_PREFIX = Object.freeze({
  ADMIN: 'ADM',
  TEACHER: 'TCH',
  STUDENT: 'STU',
  PARENT: 'PAR',
  ACCOUNTANT: 'ACC',
  LIBRARIAN: 'LIB',
});

// Non-teaching staff roles managed from Admin -> Staff Accounts
const STAFF_ROLES = Object.freeze([ROLES.ACCOUNTANT, ROLES.LIBRARIAN]);

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ROLE_PREFIX,
  ROLE_VALUES,
  STAFF_ROLES,
};
