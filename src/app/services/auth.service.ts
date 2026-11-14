import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserAddress {
  street: string;
  municipality: string;
  city: string;
  postalCode: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  address: UserAddress;
  createdAt: string;
}

export interface RegistrationDraft {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthActionResult {
  success: boolean;
  message: string;
  user?: UserProfile;
}

const SESSION_STORAGE_KEY = 'lifemedic_auth_session';
const USERS_STORAGE_KEY = 'lifemedic_registered_users';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<UserProfile | null>(
    this.loadSessionUser(),
  );

  readonly currentUser$: Observable<UserProfile | null> =
    this.currentUserSubject.asObservable();

  readonly isAuthenticated$: Observable<boolean> = this.currentUser$.pipe(
    map((user) => user !== null),
  );

  readonly isAuthenticated = signal<boolean>(
    this.currentUserSubject.getValue() !== null,
  );

  private registrationDraft: RegistrationDraft | null = null;

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.getValue();
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.getValue() !== null;
  }

  setRegistrationDraft(draft: RegistrationDraft): void {
    this.registrationDraft = { ...draft };
  }

  getRegistrationDraft(): RegistrationDraft | null {
    return this.registrationDraft ? { ...this.registrationDraft } : null;
  }

  clearRegistrationDraft(): void {
    this.registrationDraft = null;
  }

  completeRegistration(
    address: UserAddress,
    explicitDraft?: RegistrationDraft,
  ): AuthActionResult {
    const draft = explicitDraft ?? this.registrationDraft;
    if (
      !draft ||
      !draft.firstName.trim() ||
      !draft.lastName.trim() ||
      !draft.email.trim() ||
      !draft.password
    ) {
      return {
        success: false,
        message: 'Faltan tus datos de registro iniciales.',
      };
    }

    if (
      !address.street.trim() ||
      !address.municipality.trim() ||
      !address.city.trim() ||
      !address.postalCode.trim()
    ) {
      return {
        success: false,
        message: 'Completa todos los campos de tu dirección de envío.',
      };
    }

    const normalizedEmail = draft.email.trim().toLowerCase();
    const users = this.loadRegisteredUsers();
    const existingIndex = users.findIndex(
      (u) => u.email.toLowerCase() === normalizedEmail,
    );

    const newUser: UserProfile = {
      id:
        existingIndex >= 0
          ? users[existingIndex].id
          : `usr_${Date.now().toString(36)}`,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: normalizedEmail,
      password: draft.password,
      phone: existingIndex >= 0 ? users[existingIndex].phone : undefined,
      address: {
        street: address.street.trim(),
        municipality: address.municipality.trim(),
        city: address.city.trim(),
        postalCode: address.postalCode.trim(),
      },
      createdAt:
        existingIndex >= 0
          ? users[existingIndex].createdAt
          : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }

    this.saveRegisteredUsers(users);
    this.persistSession(newUser);
    this.registrationDraft = null;

    return {
      success: true,
      message: 'Cuenta creada con éxito.',
      user: newUser,
    };
  }

  login(email: string, password: string): AuthActionResult {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return {
        success: false,
        message: 'Ingresa tu correo y contraseña.',
      };
    }

    const users = this.loadRegisteredUsers();
    const matched = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail,
    );

    if (!matched) {
      return {
        success: false,
        message:
          'No encontramos una cuenta con este correo. Puedes registrarte primero.',
      };
    }

    if (matched.password !== password) {
      return {
        success: false,
        message: 'La contraseña ingresada es incorrecta.',
      };
    }

    this.persistSession(matched);
    return {
      success: true,
      message: `¡Bienvenido de nuevo, ${matched.firstName}!`,
      user: matched,
    };
  }

  updateDeliveryInfo(updates: {
    phone?: string;
    street?: string;
    city?: string;
    postalCode?: string;
  }): void {
    const current = this.currentUserSubject.getValue();
    if (!current) return;

    const updatedUser: UserProfile = {
      ...current,
      phone: updates.phone !== undefined ? updates.phone.trim() : current.phone,
      address: {
        ...current.address,
        street:
          updates.street !== undefined
            ? updates.street.trim()
            : current.address.street,
        city:
          updates.city !== undefined ? updates.city.trim() : current.address.city,
        postalCode:
          updates.postalCode !== undefined
            ? updates.postalCode.trim()
            : current.address.postalCode,
      },
    };

    this.saveUpdatedUser(updatedUser);
  }

  updateEmail(newEmail: string): AuthActionResult {
    const current = this.currentUserSubject.getValue();
    if (!current) {
      return { success: false, message: 'No hay una sesión activa.' };
    }

    const normalizedEmail = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, message: 'Ingresa un correo electrónico válido.' };
    }

    const updatedUser: UserProfile = {
      ...current,
      email: normalizedEmail,
    };

    this.saveUpdatedUser(updatedUser);
    return {
      success: true,
      message: 'Correo actualizado con éxito.',
      user: updatedUser,
    };
  }

  updatePassword(newPassword: string): AuthActionResult {
    const current = this.currentUserSubject.getValue();
    if (!current) {
      return { success: false, message: 'No hay una sesión activa.' };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres.',
      };
    }

    const updatedUser: UserProfile = {
      ...current,
      password: newPassword,
    };

    this.saveUpdatedUser(updatedUser);
    return {
      success: true,
      message: 'Contraseña actualizada con éxito.',
      user: updatedUser,
    };
  }

  updateProfileData(data: {
    firstName: string;
    lastName: string;
    street: string;
    municipality: string;
    city: string;
  }): AuthActionResult {
    const current = this.currentUserSubject.getValue();
    if (!current) {
      return { success: false, message: 'No hay una sesión activa.' };
    }

    if (
      !data.firstName.trim() ||
      !data.lastName.trim() ||
      !data.street.trim() ||
      !data.municipality.trim() ||
      !data.city.trim()
    ) {
      return {
        success: false,
        message: 'Completa todos los campos requeridos.',
      };
    }

    const updatedUser: UserProfile = {
      ...current,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      address: {
        ...current.address,
        street: data.street.trim(),
        municipality: data.municipality.trim(),
        city: data.city.trim(),
      },
    };

    this.saveUpdatedUser(updatedUser);
    return {
      success: true,
      message: 'Datos actualizados con éxito.',
      user: updatedUser,
    };
  }

  private saveUpdatedUser(updatedUser: UserProfile): void {
    const users = this.loadRegisteredUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index >= 0) {
      users[index] = updatedUser;
      this.saveRegisteredUsers(users);
    }
    this.persistSession(updatedUser);
  }

  logout(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage access failures in private/test environments
    }
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
  }

  private persistSession(user: UserProfile): void {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage failures
    }
    this.currentUserSubject.next(user);
    this.isAuthenticated.set(true);
  }

  private loadSessionUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  private loadRegisteredUsers(): UserProfile[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as UserProfile[]) : [];
    } catch {
      return [];
    }
  }

  private saveRegisteredUsers(users: UserProfile[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Ignore storage failures
    }
  }
}
