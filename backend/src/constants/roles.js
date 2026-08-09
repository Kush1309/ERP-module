const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
});

const ROLE_PREFIX = Object.freeze({
  ADMIN: 'ADM',
  TEACHER: 'TCH',
  STUDENT: 'STU',
  PARENT: 'PAR',
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ROLE_PREFIX,
  ROLE_VALUES,
};
