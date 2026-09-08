export const ADMIN_ROLES = ['admin', 'quan tri', 'quản trị', 'quantri', 'quan tri vien', 'quản trị viên'];

export const checkIsAdmin = (role) => {
    if (!role) return false;
    const cleanRole = role.toString().trim().toLowerCase();
    return ADMIN_ROLES.includes(cleanRole);
};
