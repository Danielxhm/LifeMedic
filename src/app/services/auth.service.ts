import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CartService } from './cart.service';
import { TokenStorageService } from './token-storage.service';
import {
  ApiResponseEnvelope,
  extractApiErrorMessage,
} from '../utils/api-error.util';

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
  password?: string;
  phone?: string;
  address: UserAddress;
  role?: string;
  roleLabel?: string;
  isActive?: boolean;
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

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role?: string;
  role_label?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthPayloadData {
  user: ApiUser;
  token: string;
  token_type?: string;
}

interface ProfilePayloadData {
  user: ApiUser;
}

interface StoredProfileDetails {
  firstName: string;
  lastName: string;
  address: UserAddress;
}

const SESSION_STORAGE_KEY = 'lifemedic_auth_session';
const PROFILE_DETAILS_KEY = 'lifemedic_profile_details';
const DEVICE_NAME = 'lifemedic-ionic';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly cartService = inject(CartService);
  private readonly apiUrl = environment.apiUrl;

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
  private inFlightProfilePromise: Promise<AuthActionResult> | null = null;

  constructor() {
    this.tokenStorage.unauthorized$.subscribe(() => {
      this.clearLocalSession();
      this.cartService.clearLocalStateOnLogout();
    });
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.getValue();
  }

  hasSessionToken(): boolean {
    return this.tokenStorage.hasToken();
  }

  isLoggedIn(): boolean {
    return (
      this.currentUserSubject.getValue() !== null &&
      this.tokenStorage.hasToken()
    );
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

  async completeRegistration(
    address: UserAddress,
    explicitDraft?: RegistrationDraft,
  ): Promise<AuthActionResult> {
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

    if (draft.password.length < 8) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres.',
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

    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const normalizedEmail = draft.email.trim().toLowerCase();
    const cleanAddress: UserAddress = {
      street: address.street.trim(),
      municipality: address.municipality.trim(),
      city: address.city.trim(),
      postalCode: address.postalCode.trim(),
    };

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponseEnvelope<AuthPayloadData>>(
          `${this.apiUrl}/auth/register`,
          {
            name: `${firstName} ${lastName}`.trim(),
            email: normalizedEmail,
            address: this.formatAddress(cleanAddress),
            password: draft.password,
            password_confirmation: draft.password,
            device_name: DEVICE_NAME,
          },
        ),
      );

      const { token, user: apiUser } = response.data;
      this.tokenStorage.setToken(token);

      const details: StoredProfileDetails = {
        firstName,
        lastName,
        address: cleanAddress,
      };
      this.saveProfileDetails(apiUser.id, normalizedEmail, details);

      const profile = this.mapApiUserToProfile(apiUser, details);
      this.persistSession(profile);
      this.registrationDraft = null;

      await this.cartService.syncAfterLogin();

      return {
        success: true,
        message: response.message || 'Cuenta creada con éxito.',
        user: profile,
      };
    } catch (error) {
      return {
        success: false,
        message: extractApiErrorMessage(
          error,
          'No se pudo completar el registro. Intenta nuevamente.',
        ),
      };
    }
  }

  async login(email: string, password: string): Promise<AuthActionResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return {
        success: false,
        message: 'Ingresa tu correo y contraseña.',
      };
    }

    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponseEnvelope<AuthPayloadData>>(
          `${this.apiUrl}/auth/login`,
          {
            email: normalizedEmail,
            password,
            device_name: DEVICE_NAME,
          },
        ),
      );

      const { token, user: apiUser } = response.data;
      this.tokenStorage.setToken(token);

      const storedDetails = this.loadProfileDetails(apiUser.id, apiUser.email);
      const profile = this.mapApiUserToProfile(apiUser, storedDetails);
      this.persistSession(profile);

      await this.cartService.syncAfterLogin();

      return {
        success: true,
        message:
          response.message || `¡Bienvenido de nuevo, ${profile.firstName}!`,
        user: profile,
      };
    } catch (error) {
      return {
        success: false,
        message: extractApiErrorMessage(
          error,
          'No se pudo iniciar sesión. Verifica tus credenciales.',
        ),
      };
    }
  }

  async refreshProfile(): Promise<AuthActionResult> {
    if (!this.tokenStorage.hasToken()) {
      return { success: false, message: 'No hay una sesión activa.' };
    }

    if (this.inFlightProfilePromise) {
      return this.inFlightProfilePromise;
    }

    this.inFlightProfilePromise = (async () => {
      try {
        const response = await firstValueFrom(
          this.http.get<ApiResponseEnvelope<ProfilePayloadData>>(
            `${this.apiUrl}/auth/profile`,
          ),
        );

        const apiUser = response.data.user;
        const storedDetails = this.loadProfileDetails(
          apiUser.id,
          apiUser.email,
        );
        const profile = this.mapApiUserToProfile(apiUser, storedDetails);
        this.persistSession(profile);

        return {
          success: true,
          message: response.message || 'Perfil actualizado.',
          user: profile,
        };
      } catch (error) {
        return {
          success: false,
          message: extractApiErrorMessage(error, 'No se pudo cargar tu perfil.'),
        };
      } finally {
        this.inFlightProfilePromise = null;
      }
    })();

    return this.inFlightProfilePromise;
  }

  async updateDeliveryInfo(updates: {
    phone?: string;
    street?: string;
    municipality?: string;
    city?: string;
    postalCode?: string;
  }): Promise<AuthActionResult> {
    const current = this.currentUserSubject.getValue();
    if (!current || !this.tokenStorage.hasToken()) {
      return { success: false, message: 'No hay una sesión activa.' };
    }

    const updatedAddress: UserAddress = {
      street:
        updates.street !== undefined
          ? updates.street.trim()
          : current.address.street,
      municipality:
        updates.municipality !== undefined
          ? updates.municipality.trim()
          : current.address.municipality,
      city:
        updates.city !== undefined ? updates.city.trim() : current.address.city,
      postalCode:
        updates.postalCode !== undefined
          ? updates.postalCode.trim()
          : current.address.postalCode,
    };

    const nextPhone =
      updates.phone !== undefined ? updates.phone.trim() : current.phone;

    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponseEnvelope<ProfilePayloadData>>(
          `${this.apiUrl}/auth/profile`,
          {
            phone: nextPhone || null,
            address: this.formatAddress(updatedAddress) || null,
          },
        ),
      );

      const apiUser = response.data.user;
      const details: StoredProfileDetails = {
        firstName: current.firstName,
        lastName: current.lastName,
        address: updatedAddress,
      };
      this.saveProfileDetails(apiUser.id, apiUser.email, details);

      const updatedUser = this.mapApiUserToProfile(apiUser, details);
      this.persistSession(updatedUser);

      return {
        success: true,
        message: response.message || 'Datos de entrega actualizados.',
        user: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: extractApiErrorMessage(
          error,
          'No se pudieron actualizar los datos de entrega.',
        ),
      };
    }
  }

  async updateEmail(newEmail: string): Promise<AuthActionResult> {
    const current = this.currentUserSubject.getValue();
    if (!current || !this.tokenStorage.hasToken()) {
      return { success: false, message: 'No hay una sesión activa.' };
    }

    const normalizedEmail = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, message: 'Ingresa un correo electrónico válido.' };
    }

    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponseEnvelope<ProfilePayloadData>>(
          `${this.apiUrl}/auth/profile`,
          { email: normalizedEmail },
        ),
      );

      const apiUser = response.data.user;
      const details: StoredProfileDetails = {
        firstName: current.firstName,
        lastName: current.lastName,
        address: { ...current.address },
      };
      this.saveProfileDetails(apiUser.id, apiUser.email, details);

      const updatedUser = this.mapApiUserToProfile(apiUser, details);
      this.persistSession(updatedUser);

      return {
        success: true,
        message: response.message || 'Correo actualizado con éxito.',
        user: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: extractApiErrorMessage(
          error,
          'No se pudo actualizar el correo electrónico.',
        ),
      };
    }
  }

  async updatePassword(
    newPassword: string,
    confirmPassword?: string,
  ): Promise<AuthActionResult> {
    const current = this.currentUserSubject.getValue();
    if (!current || !this.tokenStorage.hasToken()) {
      return { success: false, message: 'No hay una sesión activa.' };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres.',
      };
    }

    const confirmation = confirmPassword ?? newPassword;
    if (newPassword !== confirmation) {
      return {
        success: false,
        message: 'Las contraseñas no coinciden.',
      };
    }

    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponseEnvelope<ProfilePayloadData>>(
          `${this.apiUrl}/auth/profile`,
          {
            password: newPassword,
            password_confirmation: confirmation,
          },
        ),
      );

      const apiUser = response.data.user;
      const details: StoredProfileDetails = {
        firstName: current.firstName,
        lastName: current.lastName,
        address: { ...current.address },
      };
      const updatedUser = this.mapApiUserToProfile(apiUser, details);
      this.persistSession(updatedUser);

      return {
        success: true,
        message: response.message || 'Contraseña actualizada con éxito.',
        user: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: extractApiErrorMessage(
          error,
          'No se pudo actualizar la contraseña.',
        ),
      };
    }
  }

  async updateProfileData(data: {
    firstName: string;
    lastName: string;
    street: string;
    municipality: string;
    city: string;
    postalCode?: string;
    phone?: string;
  }): Promise<AuthActionResult> {
    const current = this.currentUserSubject.getValue();
    if (!current || !this.tokenStorage.hasToken()) {
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

    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const updatedAddress: UserAddress = {
      street: data.street.trim(),
      municipality: data.municipality.trim(),
      city: data.city.trim(),
      postalCode:
        data.postalCode !== undefined
          ? data.postalCode.trim()
          : current.address.postalCode,
    };

    try {
      const response = await firstValueFrom(
        this.http.put<ApiResponseEnvelope<ProfilePayloadData>>(
          `${this.apiUrl}/auth/profile`,
          {
            name: `${firstName} ${lastName}`.trim(),
            address: this.formatAddress(updatedAddress),
            ...(data.phone !== undefined
              ? { phone: data.phone.trim() || null }
              : {}),
          },
        ),
      );

      const apiUser = response.data.user;
      const details: StoredProfileDetails = {
        firstName,
        lastName,
        address: updatedAddress,
      };
      this.saveProfileDetails(apiUser.id, apiUser.email, details);

      const updatedUser = this.mapApiUserToProfile(apiUser, details);
      this.persistSession(updatedUser);

      return {
        success: true,
        message: response.message || 'Datos actualizados con éxito.',
        user: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: extractApiErrorMessage(
          error,
          'No se pudieron actualizar tus datos personales.',
        ),
      };
    }
  }

  async logout(): Promise<void> {
    const token = this.tokenStorage.getToken();

    this.inFlightProfilePromise = null;
    this.tokenStorage.clearToken();
    this.clearLocalSession();
    this.registrationDraft = null;
    this.cartService.clearLocalStateOnLogout();

    if (token) {
      try {
        await firstValueFrom(
          this.http.post<ApiResponseEnvelope<null>>(
            `${this.apiUrl}/auth/logout`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),
        );
      } catch {
        // Proceed cleanly even if token was already expired/revoked
      }
    }
  }

  private clearLocalSession(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage access failures in private/test environments
    }
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
  }

  private persistSession(user: UserProfile): void {
    const safeUser: UserProfile = {
      ...user,
      password: undefined,
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
    } catch {
      // Ignore storage failures
    }
    this.currentUserSubject.next(safeUser);
    this.isAuthenticated.set(true);
  }

  private loadSessionUser(): UserProfile | null {
    if (!this.tokenStorage.hasToken()) {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore storage failures
      }
      return null;
    }

    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }

  private mapApiUserToProfile(
    apiUser: ApiUser,
    details?: StoredProfileDetails,
  ): UserProfile {
    const parsedName = this.splitName(apiUser.name);
    const parsedAddress = this.parseAddress(apiUser.address);

    const resolvedFirstName = details?.firstName || parsedName.firstName;
    const resolvedLastName = details?.lastName ?? parsedName.lastName;
    const resolvedAddress =
      details?.address &&
      this.formatAddress(details.address) === (apiUser.address ?? '').trim()
        ? details.address
        : details?.address && !apiUser.address
          ? details.address
          : apiUser.address && details?.address
            ? {
                ...details.address,
                street: details.address.street || parsedAddress.street,
              }
            : parsedAddress;

    return {
      id: String(apiUser.id),
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      email: apiUser.email,
      phone: apiUser.phone ?? undefined,
      address: resolvedAddress,
      role: apiUser.role,
      roleLabel: apiUser.role_label,
      isActive: apiUser.is_active,
      createdAt: apiUser.created_at ?? new Date().toISOString(),
    };
  }

  private splitName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { firstName: 'Usuario', lastName: '' };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  private formatAddress(address: UserAddress): string {
    return [
      address.street,
      address.municipality,
      address.city,
      address.postalCode,
    ]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ')
      .slice(0, 255);
  }

  private parseAddress(rawAddress?: string | null): UserAddress {
    const parts = (rawAddress ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 4) {
      return {
        street: parts.slice(0, parts.length - 3).join(', '),
        municipality: parts[parts.length - 3],
        city: parts[parts.length - 2],
        postalCode: parts[parts.length - 1],
      };
    }

    if (parts.length === 3) {
      return {
        street: parts[0],
        municipality: parts[1],
        city: parts[2],
        postalCode: '',
      };
    }

    if (parts.length === 2) {
      return {
        street: parts[0],
        municipality: parts[1],
        city: parts[1],
        postalCode: '',
      };
    }

    return {
      street: parts[0] ?? '',
      municipality: '',
      city: '',
      postalCode: '',
    };
  }

  private loadProfileDetails(
    userId: number,
    email: string,
  ): StoredProfileDetails | undefined {
    try {
      const raw = localStorage.getItem(PROFILE_DETAILS_KEY);
      if (!raw) {
        return undefined;
      }
      const mapObj = JSON.parse(raw) as Record<string, StoredProfileDetails>;
      return (
        mapObj[`id:${userId}`] ?? mapObj[`email:${email.trim().toLowerCase()}`]
      );
    } catch {
      return undefined;
    }
  }

  private saveProfileDetails(
    userId: number,
    email: string,
    details: StoredProfileDetails,
  ): void {
    try {
      const raw = localStorage.getItem(PROFILE_DETAILS_KEY);
      const mapObj: Record<string, StoredProfileDetails> = raw
        ? (JSON.parse(raw) as Record<string, StoredProfileDetails>)
        : {};
      mapObj[`id:${userId}`] = details;
      mapObj[`email:${email.trim().toLowerCase()}`] = details;
      localStorage.setItem(PROFILE_DETAILS_KEY, JSON.stringify(mapObj));
    } catch {
      // Ignore storage failures
    }
  }
}
