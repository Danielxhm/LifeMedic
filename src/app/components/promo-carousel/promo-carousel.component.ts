import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { register } from 'swiper/element/bundle';

register();

interface Promotion {
  brand: string;
  title: string;
  description: string;
  image: string;
  color: string;
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
  promotions: Promotion[] = [
    {
      brand: 'Murad',
      title: 'Renovación con Retinol Crema de Noche',
      description:
        'Tecnología Tri-Activa con Retinol: combate arrugas profundas, unifica el tono de la piel y potencia la luminosidad de forma visible.',
      image: 'assets/images/retinol.png',
      color: '#d5efbd',
      action: '20% DTO. | COMPRAR AHORA',
    },
    {
      brand: 'Protección diaria',
      title: 'Protector solar',
      description: 'Cuida tu piel todos los días.',
      image: 'assets/images/protector-solar.png',
      color: '#d7e9fb',
      action: 'VER PRODUCTO',
    },
  ];
}