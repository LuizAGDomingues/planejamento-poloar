import Cookies from 'js-cookie';

export const USER_COOKIE_KEY = 'user_id';
export const ROLE_COOKIE_KEY = 'user_role';
export const NAME_COOKIE_KEY = 'user_name';

export function setUserCookies(userId: string, role: string, name: string) {
  Cookies.set(USER_COOKIE_KEY, userId, { expires: 7 });
  Cookies.set(ROLE_COOKIE_KEY, role, { expires: 7 });
  Cookies.set(NAME_COOKIE_KEY, name, { expires: 7 });
}

export function getUserId(): string | undefined {
  return Cookies.get(USER_COOKIE_KEY);
}

export function getUserRole(): string | undefined {
  return Cookies.get(ROLE_COOKIE_KEY);
}

export function getUserName(): string | undefined {
  return Cookies.get(NAME_COOKIE_KEY);
}

export function clearUserCookies() {
  Cookies.remove(USER_COOKIE_KEY);
  Cookies.remove(ROLE_COOKIE_KEY);
  Cookies.remove(NAME_COOKIE_KEY);
} 