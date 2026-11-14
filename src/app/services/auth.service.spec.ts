import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    service.logout();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should store registration draft and complete registration with delivery address', () => {
    service.setRegistrationDraft({
      firstName: 'Tatiana',
      lastName: 'Ayala',
      email: 'tatiana@itca.edu.sv',
      password: 'secretpassword',
    });

    const result = service.completeRegistration({
      street: 'Col. Miraflores, Bloque B, Casa #12',
      municipality: 'Santa Tecla',
      city: 'San Salvador',
      postalCode: '11101',
    });

    expect(result.success).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    const user = service.getCurrentUser();
    expect(user?.firstName).toBe('Tatiana');
    expect(user?.lastName).toBe('Ayala');
    expect(user?.address.street).toBe('Col. Miraflores, Bloque B, Casa #12');
    expect(user?.address.city).toBe('San Salvador');
    expect(user?.address.postalCode).toBe('11101');
  });

  it('should reject login with wrong password and succeed with registered credentials', () => {
    service.completeRegistration(
      {
        street: 'Calle 123',
        municipality: 'Santa Tecla',
        city: 'Santa Tecla',
        postalCode: '11090',
      },
      {
        firstName: 'Tatiana',
        lastName: 'Ayala',
        email: 'tatiana@itca.edu.sv',
        password: 'mypassword1',
      },
    );

    service.logout();
    expect(service.isLoggedIn()).toBe(false);

    const badLogin = service.login('tatiana@itca.edu.sv', 'wrongpass');
    expect(badLogin.success).toBe(false);

    const goodLogin = service.login('tatiana@itca.edu.sv', 'mypassword1');
    expect(goodLogin.success).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentUser()?.address.street).toBe('Calle 123');
  });

  it('should update delivery phone and address on active user profile', () => {
    service.completeRegistration(
      {
        street: 'Calle Principal #10',
        municipality: 'Santa Tecla',
        city: 'Santa Tecla',
        postalCode: '11090',
      },
      {
        firstName: 'Tatiana',
        lastName: 'Ayala',
        email: 'tatiana@itca.edu.sv',
        password: 'mypassword1',
      },
    );

    service.updateDeliveryInfo({ phone: '+503 9988-7766' });
    expect(service.getCurrentUser()?.phone).toBe('+503 9988-7766');
  });

  it('should update active user email and authenticate with the new email', () => {
    service.completeRegistration(
      {
        street: 'Calle Principal #10',
        municipality: 'Santa Tecla',
        city: 'Santa Tecla',
        postalCode: '11090',
      },
      {
        firstName: 'Tatiana',
        lastName: 'Ayala',
        email: 'tatiana@itca.edu.sv',
        password: 'mypassword1',
      },
    );

    const res = service.updateEmail('nuevo@itca.edu.sv');
    expect(res.success).toBe(true);
    expect(service.getCurrentUser()?.email).toBe('nuevo@itca.edu.sv');

    service.logout();
    const loginRes = service.login('nuevo@itca.edu.sv', 'mypassword1');
    expect(loginRes.success).toBe(true);
  });

  it('should update active user password and authenticate with the new password', () => {
    service.completeRegistration(
      {
        street: 'Calle Principal #10',
        municipality: 'Santa Tecla',
        city: 'Santa Tecla',
        postalCode: '11090',
      },
      {
        firstName: 'Tatiana',
        lastName: 'Ayala',
        email: 'tatiana@itca.edu.sv',
        password: 'mypassword1',
      },
    );

    const res = service.updatePassword('newsecret99');
    expect(res.success).toBe(true);

    service.logout();
    expect(service.login('tatiana@itca.edu.sv', 'mypassword1').success).toBe(
      false,
    );
    expect(service.login('tatiana@itca.edu.sv', 'newsecret99').success).toBe(
      true,
    );
  });

  it('should update profile name and address while preserving postalCode', () => {
    service.completeRegistration(
      {
        street: 'Calle Principal #10',
        municipality: 'Santa Tecla',
        city: 'Santa Tecla',
        postalCode: '11090',
      },
      {
        firstName: 'Tatiana',
        lastName: 'Ayala',
        email: 'tatiana@itca.edu.sv',
        password: 'mypassword1',
      },
    );

    const res = service.updateProfileData({
      firstName: 'XioFik',
      lastName: 'Hasan',
      street: 'Ej. Calle 123, Piso 4',
      municipality: 'San Miguelito',
      city: 'Panamá',
    });

    expect(res.success).toBe(true);
    const updated = service.getCurrentUser();
    expect(updated?.firstName).toBe('XioFik');
    expect(updated?.lastName).toBe('Hasan');
    expect(updated?.address.street).toBe('Ej. Calle 123, Piso 4');
    expect(updated?.address.municipality).toBe('San Miguelito');
    expect(updated?.address.city).toBe('Panamá');
    expect(updated?.address.postalCode).toBe('11090');
  });
});
