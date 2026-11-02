export const ADMIN_ROLES = ['admin', 'quan tri', 'quản trị', 'quantri', 'quan tri vien', 'quản trị viên'];

export const checkIsAdmin = (role) => {
    if (!role) return false;
    const cleanRole = role.toString().trim().toLowerCase();
    return ADMIN_ROLES.includes(cleanRole);
};

export const getSessionUser = () => {
    try {
        const saved = sessionStorage.getItem('user');
        if (!saved || saved === 'undefined') return null;
        return JSON.parse(saved);
    } catch (e) {
        return null;
    }
};

export const isCurrentUserAdmin = () => {
    const user = getSessionUser();
    return checkIsAdmin(user?.role);
};
