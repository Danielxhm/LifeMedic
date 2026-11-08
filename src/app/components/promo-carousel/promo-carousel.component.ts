import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { register } from 'swiper/element/bundle';

register();

export interface Promotion {
  id: number;
  brand: string;
  title: string;
  description: string;
  image: string;
  gradient: string;
  textColor: string;
  buttonBg: string;
  buttonColor: string;
  action: string;
}

@Component({
  selector: 'app-promo-carousel',
  standalone: true,
  templateUrl: './promo-carousel.component.html',
  styleUrls: ['./promo-carousel.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PromoCarouselComponent {
  private readonly router = inject(Router);

  readonly promotions: Promotion[] = [
    {
      id: 1,
      brand: 'Protección diaria',
      title: 'Protector solar',
      description: 'Cuida tu piel todos los días.',
      image: 'assets/images/protector-solar.png',
      gradient:
        'radial-gradient(ellipse at 78% 50%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%), linear-gradient(125deg, #d8f3c3 0%, #a8c978 48%, #789953 100%)',
      textColor: '#123b25',
      buttonBg: '#b8f276',
      buttonColor: '#173d22',
      action: 'VER PRODUCTO',
    },
    {
      id: 2,
      brand: 'Cuidado antiedad',
      title: 'Crema con Retinol',
      description: 'Combate arrugas profundas y renueva tu piel.',
      image: 'assets/images/retinol.png',
      gradient:
        'radial-gradient(ellipse at 80% 55%, #e6faf2 0%, transparent 45%), linear-gradient(125deg, #c7f3e2 0%, #89d9be 50%, #58ab8f 100%)',
      textColor: '#083324',
      buttonBg: '#111827',
      buttonColor: '#ffffff',
      action: '20% DTO. | COMPRAR',
    },
    {
      id: 3,
      brand: 'Energía & Inmunidad',
      title: 'Vitamina C + Zinc',
      description: 'Refuerza tus defensas y rinde al máximo.',
      image: 'assets/images/vitamina-c.png',
      gradient:
        'radial-gradient(ellipse at 80% 55%, #fffbf0 0%, transparent 45%), linear-gradient(125deg, #fef0c7 0%, #fbd578 50%, #e09f3e 100%)',
      textColor: '#572b07',
      buttonBg: '#78350f',
      buttonColor: '#ffffff',
      action: 'VER OFERTA',
    },
    {
      id: 4,
      brand: 'Descanso reparador',
      title: 'Tylenol PM',
      description: 'Alivio del dolor nocturno para un sueño profundo.',
      image: 'assets/images/tylenol-pm.png',
      gradient:
        'radial-gradient(ellipse at 80% 55%, #f0f4ff 0%, transparent 45%), linear-gradient(125deg, #dbe4ff 0%, #a5b8f6 50%, #687ee0 100%)',
      textColor: '#182457',
      buttonBg: '#1e1b4b',
      buttonColor: '#ffffff',
      action: 'COMPRAR AHORA',
    },
  ];

  onPromotionClick(): void {
    this.router.navigate(['/products']);
  }
}
