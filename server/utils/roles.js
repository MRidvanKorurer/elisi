const isSuperAdmin = (rol) => rol === 'superadmin';
const isSellerRole = (rol) => rol === 'seller';
const ROLES = ['user', 'seller', 'superadmin'];

module.exports = { isSuperAdmin, isSellerRole, ROLES };
